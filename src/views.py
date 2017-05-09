from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from pyramid.session import check_csrf_token

from sqlalchemy import func, distinct

from oauth2client import client, crypt
import os

from .models import DBSession, ESearch, Colleague, Colleaguetriage, Filedbentity, Filepath, Dbentity, Edam, Referencedbentity, ReferenceFile, Referenceauthor, FileKeyword, Keyword, Referencedocument, Chebi, ChebiUrl, PhenotypeannotationCond, Phenotypeannotation, Reservedname, Straindbentity, Literatureannotation, Phenotype, Apo, Go, Referencetriage, Referencedeleted, Locusdbentity, CurationReference, Dataset, DatasetKeyword

from .celery_tasks import upload_to_s3

from .helpers import allowed_file, secure_save_file, curator_or_none, authenticate, extract_references, extract_keywords, get_or_create_filepath, get_pusher_client, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file, FILE_EXTENSIONS

from .search_helpers import build_autocomplete_search_body_request, format_autocomplete_results, build_search_query, build_es_search_body_request, build_es_aggregation_body_request, format_search_results, format_aggregation_results
from .tsv_parser import parse_tsv_annotations

from .loading.promote_reference_triage import add_paper, get_dbentity_by_name

import transaction

import traceback
import datetime
import logging
import json
log = logging.getLogger(__name__)

@view_config(route_name='home', request_method='GET', renderer='home.jinja2')
def home_view(request):
    return {
        'google_client_id': os.environ['GOOGLE_CLIENT_ID'],
        'pusher_key': os.environ['PUSHER_KEY']
    }
    
@view_config(route_name='upload_spreadsheet', request_method='POST', renderer='json')
@authenticate
def upload_spreadsheet(request):
    tsv_file = request.POST['file'].file
    template_type = request.POST['template']
    annotations = parse_tsv_annotations(DBSession, tsv_file, template_type)
    return {'annotations': annotations}

@view_config(route_name='upload', request_method='POST', renderer='json')
@authenticate
def upload_file(request):
    keys = ['file', 'old_filepath', 'new_filepath', 'previous_file_name', 'display_name', 'status', 'topic_id', 'format_id', 'extension', 'file_date', 'readme_name', 'pmids', 'keyword_ids']
    optional_keys = ['is_public', 'for_spell', 'for_browser']
    
    for k in keys:
        if request.POST.get(k) is None:
            return HTTPBadRequest(body=json.dumps({'error': 'Field \'' + k + '\' is missing'}))

    file = request.POST['file'].file
    filename = request.POST['file'].filename

    if not file:
        log.info('No file was sent.')
        return HTTPBadRequest(body=json.dumps({'error': 'No file was sent.'}))

    if not allowed_file(filename):
        log.info('Upload error: File ' + request.POST.get('display_name') + ' has an invalid extension.')
        return HTTPBadRequest(body=json.dumps({'error': 'File extension is invalid'}))
    
    try:
        references = extract_references(request)
        keywords = extract_keywords(request)
        topic = extract_topic(request)
        format = extract_format(request)
        filepath = get_or_create_filepath(request)
    except HTTPBadRequest as bad_request:
        return HTTPBadRequest(body=json.dumps({'error': str(bad_request.detail)}))

    if file_already_uploaded(request):
        return HTTPBadRequest(body=json.dumps({'error': 'Upload error: File ' + request.POST.get('display_name') + ' already exists.'}))

    fdb = Filedbentity(
        # Filedbentity params
        md5sum=None,
        previous_file_name=request.POST.get('previous_file_name'),
        topic_id=topic.edam_id,
        format_id=format.edam_id,
        file_date=datetime.datetime.strptime(request.POST.get('file_date'), '%Y-%m-%d %H:%M:%S'),
        is_public=request.POST.get('is_public', 0),
        is_in_spell=request.POST.get('for_spell', 0),
        is_in_browser=request.POST.get('for_browser', 0),
        filepath_id=filepath.filepath_id,
        # TODO: missing readme_file_id
        file_extension=request.POST.get('extension'),        

        # DBentity params
        format_name=request.POST.get('display_name'),
        display_name=request.POST.get('display_name'),
        s3_url=None,
        source_id=339,
        dbentity_status=request.POST.get('status')
    )

    DBSession.add(fdb)
    DBSession.flush()
    DBSession.refresh(fdb)

    link_references_to_file(references, fdb.dbentity_id)
    link_keywords_to_file(keywords, fdb.dbentity_id)
    
    # fdb object gets expired after transaction commit
    fdb_sgdid = fdb.sgdid
    fdb_file_extension = fdb.file_extension
    
    transaction.commit() # this commit must be synchronous because the upload_to_s3 task expects the row in the DB

    temp_file_path = secure_save_file(file, filename)
    upload_to_s3.delay(temp_file_path, fdb_sgdid, fdb_file_extension, os.environ['S3_ACCESS_KEY'], os.environ['S3_SECRET_KEY'], os.environ['S3_BUCKET'])

    log.info('File ' + request.POST.get('display_name') + ' was successfully uploaded.')
    return Response({'success': True})
    
@view_config(route_name='autocomplete_results', renderer='json', request_method='GET')
def search_autocomplete(request):
    query = request.params.get('q', '')
    category = request.params.get('category', '')
    field = request.params.get('field', 'name')

    if query == '':
        return {
            "results": None
        }

    autocomplete_results = ESearch.search(
        index=request.registry.settings['elasticsearch.index'],
        body=build_autocomplete_search_body_request(query, category, field)
    )

    return {
        "results": format_autocomplete_results(autocomplete_results, field)
    }

@view_config(route_name='search', renderer='json', request_method='GET')
def search(request):
    query = request.params.get('q', '')
    limit = int(request.params.get('limit', 10))
    offset = int(request.params.get('offset', 0))
    category = request.params.get('category', '')
    sort_by = request.params.get('sort_by', '')

    # subcategory filters. Map: (request GET param name from frontend, ElasticSearch field name)
    category_filters = {
        "locus": [('feature type', 'feature_type'), ('molecular function', 'molecular_function'), ('phenotype', 'phenotypes'), ('cellular component', 'cellular_component'), ('biological process', 'biological_process')],
        "phenotype": [("observable", "observable"), ("qualifier", "qualifier"), ("references", "references"), ("phenotype_locus", "phenotype_loci"), ("chemical", "chemical"), ("mutant_type", "mutant_type")],
        "biological_process": [("go_locus", "go_loci")],
        "cellular_component": [("go_locus", "go_loci")],
        "molecular_function": [("go_locus", "go_loci")],
        "reference": [("author", "author"), ("journal", "journal"), ("year", "year"), ("reference_locus", "reference_loci")],
        "contig": [("strain", "strain")],
        "colleague": [("last_name", "last_name"), ("position", "position"), ("institution", "institution"), ("country", "country"), ("keywords", "keywords"), ("colleague_loci", "colleague_loci")]
    }

    search_fields = ["name", "description", "first_name", "last_name", "institution", "colleague_loci", "feature_type", "name_description", "summary", "phenotypes", "cellular_component", "biological_process", "molecular_function", "ec_number", "protein", "tc_number", "secondary_sgdid", "sequence_history", "gene_history", "observable", "qualifier", "references", "phenotype_loci", "chemical", "mutant_type", "synonyms", "go_id", "go_loci", "author", "journal", "reference_loci"] # year not inserted, have to change to str in mapping

    json_response_fields = ['name', 'href', 'description', 'category', 'bioentity_id', 'phenotype_loci', 'go_loci', 'reference_loci']

    args = {}
    for key in request.params.keys():
        args[key] = request.params.getall(key)

    es_query = build_search_query(query, search_fields, category,
                                  category_filters, args)

    search_body = build_es_search_body_request(query,
                                               category,
                                               es_query,
                                               json_response_fields,
                                               search_fields,
                                               sort_by)

    search_results = ESearch.search(
        index=request.registry.settings['elasticsearch.index'],
        body=search_body,
        size=limit,
        from_=offset,
        preference='p_'+query
    )

    if search_results['hits']['total'] == 0:
        return {
            'total': 0,
            'results': [],
            'aggregations': []
        }
    
    aggregation_body = build_es_aggregation_body_request(
        es_query,
        category,
        category_filters
    )

    aggregation_results = ESearch.search(
        index=request.registry.settings['elasticsearch.index'],
        body=aggregation_body,
        preference='p_'+query
    )
    
    return {
        'total': search_results['hits']['total'],
        'results': format_search_results(search_results, json_response_fields, query),
        'aggregations': format_aggregation_results(
            aggregation_results,
            category,
            category_filters
        )
    }

@view_config(route_name='formats', renderer='json', request_method='GET')
def formats(request):
    formats_db = DBSession.query(Edam).filter(Edam.edam_namespace == 'format').all()
    return {'options': [f.to_dict() for f in formats_db]}

@view_config(route_name='topics', renderer='json', request_method='GET')
def topics(request):
    topics_db = DBSession.query(Edam).filter(Edam.edam_namespace == 'topic').all()
    return {'options': [t.to_dict() for t in topics_db]}

@view_config(route_name='extensions', renderer='json', request_method='GET')
def extensions(request):
    return {'options': [{'id': e, 'name': e} for e in FILE_EXTENSIONS]}

@view_config(route_name='reference_list', renderer='json', request_method='POST')
def reference_list(request):
    reference_ids = request.POST.get('reference_ids', request.json_body.get('reference_ids', None))
    
    if reference_ids is None or len(reference_ids) == 0:
        return HTTPBadRequest(body=json.dumps({'error': "No reference_ids sent. JSON object expected: {\"reference_ids\": [\"id_1\", \"id_2\", ...]}"}))
    else:
        try:
            reference_ids = [int(r) for r in reference_ids]
            references = DBSession.query(Referencedocument.reference_id, Referencedocument.text).filter(Referencedocument.reference_id.in_(reference_ids), Referencedocument.document_type == 'Medline').all()

            if len(references) == 0:
                return HTTPNotFound(body=json.dumps({'error': "Reference_ids do not exist."}))
            
            return [{'id': r.reference_id, 'text': r.text} for r in references]
        except ValueError:
            return HTTPBadRequest(body=json.dumps({'error': "IDs must be string format of integers. Example JSON object expected: {\"reference_ids\": [\"1\", \"2\"]}"}))

@view_config(route_name='sign_in', request_method='POST', renderer='json')
def sign_in(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))

    if request.json_body['google_token'] is None:
        return HTTPForbidden(body=json.dumps({'error': 'Expected authentication token not found'}))
    
    try:
        idinfo = client.verify_id_token(request.json_body['google_token'], os.environ['GOOGLE_CLIENT_ID'])

        if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return HTTPForbidden(body=json.dumps({'error': 'Authentication token has an invalid ISS'}))
        
        if idinfo.get('email') is None:
            return HTTPForbidden(body=json.dumps({'error': 'Authentication token has no email'}))

        log.info('User ' + idinfo['email'] + ' trying to authenticate from ' + (request.remote_addr or '(no remote address)'))

        curator = curator_or_none(idinfo['email'])

	if curator is None:
            return HTTPForbidden(body=json.dumps({'error': 'User ' + idinfo['email'] + ' is not authorized on SGD'}))
        
        session = request.session

        if 'email' not in session:
            session['email'] = curator.email

        if 'username' not in session:
            session['username'] = curator.username

        log.info('User ' + idinfo['email'] + ' was successfuly authenticated.')

        return { 'username': curator.username }
    except crypt.AppIdentityError:
        return HTTPForbidden(body=json.dumps({'error': 'Authentication token is invalid'}))

@view_config(route_name='sign_out', request_method='DELETE')
def sign_out(request):
    request.session.invalidate()
    return HTTPOk()

@view_config(route_name='search_sequence_objects', request_method='GET')
def search_sequence_objects(request):
    query = request.params.get('query', '').lower()
    offset = request.params.get('offset', 0)
    limit = request.params.get('limit', 1000)

    search_body = build_sequence_objects_search_query(query)

    res = ESearch.search(index=request.registry.settings['elasticsearch.variant_viewer_index'], body=search_body, size=limit, from_=offset)

    simple_hits = []
    for hit in res['hits']['hits']:
        simple_hits.append(hit['_source'])

    formatted_response = {
        'loci': simple_hits,
        'total': res['hits']['total'],
        'offset': offset
    }
    
    return Response(body=json.dumps(formatted_response), content_type='application/json')

@view_config(route_name='get_sequence_object', renderer='json', request_method='GET')
def get_sequence_object(request):
    id = request.matchdict['id'].upper()

    return ESearch.get(index=request.registry.settings['elasticsearch.variant_viewer_index'], id=id)['_source']

@view_config(route_name='reserved_name', renderer='json', request_method='GET')
def reserved_name(request):
    id = request.matchdict['id'].upper()

    reserved_name = DBSession.query(Reservedname).filter_by(format_name=id).one_or_none()
    
    if reserved_name:
        return reserved_name.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='strain', renderer='json', request_method='GET')
def strain(request):
    id = request.matchdict['id'].upper()

    strain = DBSession.query(Straindbentity).filter_by(sgdid=id).one_or_none()
    
    if strain:
        return strain.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference', renderer='json', request_method='GET')
def reference(request):
    id = request.matchdict['id'].upper()

    reference = DBSession.query(Referencedbentity).filter_by(sgdid=id).one_or_none()
    if reference:
        return reference.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_literature_details', renderer='json', request_method='GET')
def reference_literature_details(request):
    id = request.matchdict['id'].upper()

    reference = DBSession.query(Referencedbentity).filter_by(sgdid=id).one_or_none()
    if reference:
        return reference.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_interaction_details', renderer='json', request_method='GET')
def reference_interaction_details(request):
    id = request.matchdict['id'].upper()

    reference = DBSession.query(Referencedbentity).filter_by(sgdid=id).one_or_none()
    if reference:
        return reference.interactions_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_go_details', renderer='json', request_method='GET')
def reference_go_details(request):
    id = request.matchdict['id'].upper()

    reference = DBSession.query(Referencedbentity).filter_by(sgdid=id).one_or_none()
    if reference:
        return reference.go_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_phenotype_details', renderer='json', request_method='GET')
def reference_phenotype_details(request):
    id = request.matchdict['id'].upper()

    reference = DBSession.query(Referencedbentity).filter_by(sgdid=id).one_or_none()
    if reference:
        return reference.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_regulation_details', renderer='json', request_method='GET')
def reference_regulation_details(request):
    id = request.matchdict['id'].upper()

    reference = DBSession.query(Referencedbentity).filter_by(sgdid=id).one_or_none()
    if reference:
        return reference.regulation_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage', renderer='json', request_method='GET')
def reference_triage(request):
    triages = DBSession.query(Referencetriage).order_by(Referencetriage.date_created.asc()).all()
    return {'entries': [t.to_dict() for t in triages]}

@view_config(route_name='reference_triage_id', renderer='json', request_method='GET')
def reference_triage_id(request):
    id = request.matchdict['id'].upper()
    
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        return triage.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_id_update', renderer='json', request_method='PUT')
def reference_triage_id_update(request):
    id = request.matchdict['id'].upper()

    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        try:
            triage.update_from_json(request.json)
        except ValueError:
            return HTTPBadRequest(body=json.dumps({'error': 'Invalid JSON format in body request'}))
        try:
            transaction.commit()
        except:
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify if pmid is valid and not already present.'}))
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        return HTTPOk()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_promote', renderer='json', request_method='PUT')
def reference_triage_promote(request):
    id = request.matchdict['id'].upper()
    
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:

        tags = []
        for tag in request.json['data']['tags']:
            if tag.get('genes'):
                genes = tag.get('genes').split(',')
                for g in genes:
                    locus = get_dbentity_by_name(g.strip())
                    if locus is None:
                        return HTTPBadRequest(body=json.dumps({'error': 'Invalid gene name ' + g}))
                    tags.append((tag['name'], tag['comment'], locus.dbentity_id))
            else:
                tags.append((tag['name'], tag['comment'], None))

        try:
            reference_id, sgdid = add_paper(triage.pmid, request.json['data']['assignee'])
        except:
            traceback.print_exc()
            return HTTPBadRequest(body=json.dumps({'error': 'Error importing PMID into the database'}))

        if sgdid is None:
            return HTTPBadRequest(body=json.dumps({'error': 'Error importing PMID into the database'}))

        try:
            transaction.commit()
        except:
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify if pmid is valid and not already present.'}))
        
        DBSession.delete(triage)

        for i in xrange(len(tags)):
            curation = CurationReference.factory(reference_id, tags[i][0], tags[i][1], tags[i][2], request.json['data']['assignee'])
            if curation is None:
                tags[i] = Literatureannotation.factory(reference_id, tags[i][0], tags[i][2], request.json['data']['assignee'])
            else:
                tags[i] = curation

        for tag in tags:
            if tag:
                DBSession.add(tag)

        DBSession.flush()                
        transaction.commit()
        
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        
        return {
            "sgdid": sgdid
        }
    else:
        return HTTPNotFound()
    
@view_config(route_name='reference_triage_id_delete', renderer='json', request_method='DELETE')
def reference_triage_id_delete(request):
    id = request.matchdict['id'].upper()

    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        reason = None

        if request.body != '':
            try:
                reason = request.json.get('reason')
            except ValueError:
                return HTTPBadRequest(body=json.dumps({'error': 'Invalid JSON format in body request'}))

        # better way to delete triage? travis
        # reference_deleted = Referencedeleted(pmid=triage.pmid, sgdid=None, reason_deleted=reason, created_by="OTTO")
        # DBSession.add(reference_deleted)
        DBSession.delete(triage)
        
        transaction.commit()
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        return HTTPOk()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_tags', renderer='json', request_method='GET')
def reference_triage_tags(request):
    sgdid = request.matchdict['id'].upper()

    dbentity_id = DBSession.query(Dbentity.dbentity_id).filter_by(sgdid=sgdid).one_or_none()

    if dbentity_id is None:
        return HTTPNotFound()
    
    obj = []

    tags = DBSession.query(CurationReference).filter_by(reference_id=dbentity_id[0]).all()
    for tag in tags:
        obj.append(tag.to_dict())

    return obj
    
@view_config(route_name='author', renderer='json', request_method='GET')
def author(request):
    format_name = request.matchdict['format_name']

    key = "/author/"+format_name
    
    authors_ref = DBSession.query(Referenceauthor).filter_by(obj_url=key).all()

    references_dict = sorted([author_ref.reference.to_dict_reference_related() for author_ref in authors_ref], key=lambda r: r["display_name"])
    
    if len(authors_ref) > 0:
        return {
            "display_name": authors_ref[0].display_name,
            "references": sorted(references_dict, key=lambda r: r["year"], reverse=True)
        }
    else:
        return HTTPNotFound()

@view_config(route_name='chemical', renderer='json', request_method='GET')
def chemical(request):
    format_name = request.matchdict['format_name'].upper()
    
    chebi = DBSession.query(Chebi).filter_by(format_name=format_name).one_or_none()
    if chebi:
        return chebi.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='chemical_phenotype_details', renderer='json', request_method='GET')
def chemical_phenotype_details(request):
    id = request.matchdict['id'].upper()

    chebi = DBSession.query(Chebi).filter_by(chebi_id=id).one_or_none()
    if chebi:
        return chebi.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='phenotype', renderer='json', request_method='GET')
def phenotype(request):
    format_name = request.matchdict['format_name']

    phenotype = DBSession.query(Phenotype).filter(func.lower(Phenotype.format_name) == func.lower(format_name)).one_or_none()
    if phenotype:
        return phenotype.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='phenotype_locus_details', renderer='json', request_method='GET')
def phenotype_locus_details(request):
    id = request.matchdict['id']

    try:
        id = int(id)
    except ValueError:
        return HTTPNotFound(body=json.dumps({'error': 'This endpoint expects a DB ID'}))

    phenotype = DBSession.query(Phenotype).filter_by(phenotype_id=id).one_or_none()
    if phenotype:
        return phenotype.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable', renderer='json', request_method='GET')
def observable(request):
    if request.matchdict['format_name'].upper() == "YPO": # /ontology/phenotype/ypo -> root of APOs
        return Apo.root_to_dict()
    
    format_name = request.matchdict['format_name'].upper()

    observable = DBSession.query(Apo).filter_by(format_name=format_name).one_or_none()
    if observable:
        return observable.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_locus_details', renderer='json', request_method='GET')
def observable_locus_details(request):
    id = request.matchdict['id']

    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_ontology_graph', renderer='json', request_method='GET')
def observable_ontology_graph(request):
    id = request.matchdict['id']

    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.ontology_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_locus_details_all', renderer='json', request_method='GET')
def observable_locus_details_all(request):
    id = request.matchdict['id']

    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.annotations_and_children_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go', renderer='json', request_method='GET')
def go(request):
    format_name = request.matchdict['format_name'].upper()

    go = DBSession.query(Go).filter_by(format_name=format_name).one_or_none()
    if go:
        return go.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go_ontology_graph', renderer='json', request_method='GET')
def go_ontology_graph(request):
    id = request.matchdict['id']

    try:
        id = int(id)
    except ValueError:
        return HTTPNotFound(body=json.dumps({'error': 'This endpoint expects a DB ID'}))

    go = DBSession.query(Go).filter_by(go_id=id).one_or_none()
    if go:
        return go.ontology_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='go_locus_details', renderer='json', request_method='GET')
def go_locus_details(request):
    id = request.matchdict['id']

    try:
        id = int(id)
    except ValueError:
        return HTTPNotFound(body=json.dumps({'error': 'This endpoint expects a DB ID'}))
        
    go = DBSession.query(Go).filter_by(go_id=id).one_or_none()
    if go:
        return go.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go_locus_details_all', renderer='json', request_method='GET')
def go_locus_details_all(request):
    id = request.matchdict['id']

    try:
        id = int(id)
    except ValueError:
        return HTTPNotFound(body=json.dumps({'error': 'This endpoint expects a DB ID'}))

    go = DBSession.query(Go).filter_by(go_id=id).one_or_none()
    if go:
        return go.annotations_and_children_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus', renderer='json', request_method='GET')
def locus(request):
    sgdid = request.matchdict['sgdid'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(sgdid=sgdid).one_or_none()
    if locus:
        return locus.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_tabs', renderer='json', request_method='GET')
def locus_tabs(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.tabs()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_phenotype_details', renderer='json', request_method='GET')
def locus_phenotype_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_phenotype_graph', renderer='json', request_method='GET')
def locus_phenotype_graph(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.phenotype_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_go_graph', renderer='json', request_method='GET')
def locus_go_graph(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.go_graph()
    else:
        return HTTPNotFound()
    
@view_config(route_name='locus_literature_details', renderer='json', request_method='GET')
def locus_literature_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.literature_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_literature_graph', renderer='json', request_method='GET')
def locus_literature_graph(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.literature_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_go_details', renderer='json', request_method='GET')
def locus_go_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.go_to_dict()
    else:
        return HTTPNotFound()
    
@view_config(route_name='locus_interaction_details', renderer='json', request_method='GET')
def locus_interaction_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.interactions_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_expression_details', renderer='json', request_method='GET')
def locus_expression_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.expression_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_neighbor_sequence_details', renderer='json', request_method='GET')
def locus_neighbor_sequence_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.neighbor_sequence_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_sequence_details', renderer='json', request_method='GET')
def locus_sequence_details(request):
    id = request.matchdict['id'].upper()

    locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
    if locus:
        return locus.sequence_details()
    else:
        return HTTPNotFound()
    
@view_config(route_name='bioentity_list', renderer='json', request_method='POST')
def analyze(request):
    try:
        data = request.json
    except ValueError:
        return HTTPBadRequest(body=json.dumps({'error': 'Invalid JSON format in body request'}))
        
    if "bioent_ids" not in data:
        return HTTPBadRequest(body=json.dumps({'error': 'Key \"bioent_ids\" missing'}))

    loci = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(data['bioent_ids'])).all()
    
    return [locus.to_dict_analyze() for locus in loci]

@view_config(route_name='dataset', renderer='json', request_method='GET')
def dataset(request):
    format_name = request.matchdict['id']

    dataset = DBSession.query(Dataset).filter(func.lower(Dataset.format_name) == func.lower(format_name)).one_or_none()
    if dataset:
        return dataset.to_dict(add_conditions=True, add_resources=True)
    else:
        return HTTPNotFound()

@view_config(route_name='keyword', renderer='json', request_method='GET')
def keyword(request):
    format_name = request.matchdict['id']

    keyword = DBSession.query(Keyword).filter(func.lower(Keyword.format_name) == func.lower(format_name)).one_or_none()
    
    if keyword:
        return keyword.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='keywords', renderer='json', request_method='GET')
def keywords(request):
    keyword_ids = DBSession.query(distinct(DatasetKeyword.keyword_id)).all()
    
    keywords = DBSession.query(Keyword).filter(Keyword.keyword_id.in_(keyword_ids)).all()

    return [k.to_simple_dict() for k in keywords]
