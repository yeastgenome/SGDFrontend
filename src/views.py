from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from pyramid.session import check_csrf_token

from sqlalchemy import func, distinct, and_, or_
from sqlalchemy.exc import IntegrityError

from oauth2client import client, crypt
import os

from .models import DBSession, ESearch, Colleague, Colleaguetriage, Filedbentity, Filepath, Dbentity, Edam, Referencedbentity, ReferenceFile, Referenceauthor, FileKeyword, Keyword, Referencedocument, Chebi, ChebiUrl, PhenotypeannotationCond, Phenotypeannotation, Reservedname, Straindbentity, Literatureannotation, Phenotype, Apo, Go, Referencetriage, Referencedeleted, Locusdbentity, CurationReference, Dataset, DatasetKeyword, Contig, Proteindomain, Ec, Locussummary

from .helpers import allowed_file, secure_save_file, curator_or_none, authenticate, extract_references, extract_keywords, get_or_create_filepath, get_pusher_client, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file, FILE_EXTENSIONS, get_locus_by_id, get_go_by_id

from .search_helpers import build_autocomplete_search_body_request, format_autocomplete_results, build_search_query, build_es_search_body_request, build_es_aggregation_body_request, format_search_results, format_aggregation_results, build_sequence_objects_search_query
from .tsv_parser import parse_tsv_annotations

from .loading.promote_reference_triage import add_paper

import transaction

import traceback
import datetime
import logging
import json

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)
log = logging.getLogger()

import redis
disambiguation_table = redis.Redis()

ES_INDEX_NAME = os.environ.get('ES_INDEX_NAME', 'searchable_items_aws')

# safe return returns None if not found instead of 404 exception
def extract_id_request(request, prefix, param_name='id', safe_return=False):
    id = str(request.matchdict[param_name])

    db_id = disambiguation_table.get(("/" + prefix + "/" + id).upper())
    
    if db_id is None and safe_return:
        return None
    elif db_id is None:
        raise HTTPNotFound()
    else:
        if prefix == 'author':
            return db_id
        else:
            return int(db_id)

@view_config(route_name='home', request_method='GET', renderer='home.jinja2')
def home_view(request):
    return {
        'google_client_id': os.environ['GOOGLE_CLIENT_ID'],
        'pusher_key': os.environ['PUSHER_KEY']
    }
   
@view_config(route_name='get_recent_annotations', request_method='GET', renderer='json')
@authenticate
def get_recent_annotations(request):
    limit = 25
    annotations = []
    recent_summaries = DBSession.query(Locussummary).order_by(Locussummary.date_created.desc()).limit(limit).all()
    recent_literature = DBSession.query(Referencedbentity).order_by(Referencedbentity.dbentity_id.desc()).limit(limit * 2).all()
    for d in recent_literature:
        annotations.append(d.annotations_summary_to_dict())
    for d in recent_summaries:
        annotations.append(d.to_dict())
    annotations = sorted(annotations, key=lambda r: r['date_created'], reverse=True)
    return annotations

@view_config(route_name='upload_spreadsheet', request_method='POST', renderer='json')
@authenticate
def upload_spreadsheet(request):
    try:
        tsv_file = request.POST['file'].file
        filename = request.POST['file'].filename
        template_type = request.POST['template']
        annotations = parse_tsv_annotations(DBSession, tsv_file, filename, template_type, request.session['username'])
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        return {'annotations': annotations}
    except ValueError as e:
        return HTTPBadRequest(body=json.dumps({ 'error': str(e) }), content_type='text/json')
    except AttributeError:
        traceback.print_exc()
        return HTTPBadRequest(body=json.dumps({ 'error': 'Please attach a valid TSV file.' }), content_type='text/json')
    except:
        traceback.print_exc()
        return HTTPBadRequest(body=json.dumps({ 'error': 'Unable to process file upload. Please try again.' }), content_type='text/json')

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

    # NO s3 upload, removed with celery

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
        index=ES_INDEX_NAME,
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

    search_fields = ["name", "description", "first_name", "last_name", "institution", "colleague_loci", "feature_type", "name_description", "summary", "phenotypes", "cellular_component", "biological_process", "molecular_function", "ec_number", "protein", "tc_number", "secondary_sgdid", "sequence_history", "gene_history", "observable", "qualifier", "references", "phenotype_loci", "chemical", "mutant_type", "synonyms", "go_id", "go_loci", "author", "journal", "reference_loci","aliases"] # year not inserted, have to change to str in mapping

    json_response_fields = ['name', 'href', 'description', 'category', 'bioentity_id', 'phenotype_loci', 'go_loci', 'reference_loci','aliases']

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
        index=ES_INDEX_NAME,
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
        index=ES_INDEX_NAME,
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
            references = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reference_ids)).all()

            if len(references) == 0:
                return HTTPNotFound(body=json.dumps({'error': "Reference_ids do not exist."}))
            
            return [r.to_bibentry() for r in references]
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

        return {'username': curator.username}
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
    id = extract_id_request(request, "reservedname")

    reserved_name = DBSession.query(Reservedname).filter_by(reservedname_id=id).one_or_none()
    
    if reserved_name:
        return reserved_name.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='strain', renderer='json', request_method='GET')
def strain(request):
    id = extract_id_request(request, 'strain')

    strain = DBSession.query(Straindbentity).filter_by(dbentity_id=id).one_or_none()
    
    if strain:
        return strain.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference', renderer='json', request_method='GET')
def reference(request):
    id = extract_id_request(request, 'reference', 'id', True)
    # allow reference to be accessed by sgdid even if not in disambig table
    if id:
        reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
    else:
        reference = DBSession.query(Referencedbentity).filter_by(sgdid=request.matchdict['id']).one_or_none()

    if reference:
        return reference.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_literature_details', renderer='json', request_method='GET')
def reference_literature_details(request):
    id = extract_id_request(request, 'reference', 'id', True)
    # allow reference to be accessed by sgdid even if not in disambig table
    if id:
        reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
    else:
        reference = DBSession.query(Referencedbentity).filter_by(sgdid=request.matchdict['id']).one_or_none()

    if reference:
        return reference.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_interaction_details', renderer='json', request_method='GET')
def reference_interaction_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

    if reference:
        return reference.interactions_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_go_details', renderer='json', request_method='GET')
def reference_go_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
    
    if reference:
        return reference.go_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_phenotype_details', renderer='json', request_method='GET')
def reference_phenotype_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

    if reference:
        return reference.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_regulation_details', renderer='json', request_method='GET')
def reference_regulation_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

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
@authenticate
def reference_triage_id_update(request):
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        try:
            triage.update_from_json(request.json)
            transaction.commit()
        except:
            traceback.print_exc()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify if pmid is valid and not already present.'}))
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        return HTTPOk()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_triage_promote', renderer='json', request_method='PUT')
@authenticate
def reference_triage_promote(request):
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:

        tags = []
        for tag in request.json['data']['tags']:
            if tag.get('genes'):
                genes = tag.get('genes').split(',')
                for g in genes:
                    uppername = g.upper().strip()
                    locus = DBSession.query(Locusdbentity).filter(or_(Locusdbentity.display_name==uppername, Locusdbentity.format_name==uppername)).one_or_none()
                    if locus is None:
                        return HTTPBadRequest(body=json.dumps({'error': 'Invalid gene name ' + g}))
                    tags.append((tag['name'], tag['comment'], locus.dbentity_id))
            else:
                tags.append((tag['name'], tag['comment'], None))

        try:
            reference_id, sgdid = add_paper(triage.pmid, request.json['data']['assignee'])
        except IntegrityError as e:
            traceback.print_exc()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': str(e) }))
        except:
            traceback.print_exc()
            return HTTPBadRequest(body=json.dumps({'error': 'Error importing PMID into the database'}))

        if sgdid is None:
            return HTTPBadRequest(body=json.dumps({'error': 'Error importing PMID into the database'}))

        try:
            DBSession.delete(triage)
            transaction.commit()
        except:
            DBSession.rollback()
            traceback.print_exc()
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify that PMID is valid and not already present in SGD.'}))  

        # HANDLE TAGS
        # track which loci have primary annotations for this reference to only have one primary per reference
        primary_obj = {}
        for i in xrange(len(tags)):
            tag_slug = tags[i][0]
            comment = tags[i][1]
            locus_dbentity_id = tags[i][2]
            curation_ref = CurationReference.factory(reference_id, tag_slug, comment, locus_dbentity_id, request.json['data']['assignee'])
            if curation_ref:
                DBSession.add(curation_ref)
            lit_annotation = Literatureannotation.factory(reference_id, tag_slug, locus_dbentity_id, request.json['data']['assignee'])
            if lit_annotation:
                # prevent multiple primary lit tags
                if lit_annotation.topic == 'Primary Literature':
                    if locus_dbentity_id in primary_obj.keys():
                        continue
                    else:
                        primary_obj[locus_dbentity_id] = True
                DBSession.add(lit_annotation)

        try:
            DBSession.flush()
            transaction.commit()
        except:
            traceback.print_exc()
            DBSession.rollback()
        
        pusher = get_pusher_client()
        pusher.trigger('sgd', 'triageUpdate', {})
        pusher.trigger('sgd', 'curateHomeUpdate', {})
        
        return {
            "sgdid": sgdid
        }
    else:
        return HTTPNotFound()
    
@view_config(route_name='reference_triage_id_delete', renderer='json', request_method='DELETE')
@authenticate
def reference_triage_id_delete(request):
    id = request.matchdict['id'].upper()
    triage = DBSession.query(Referencetriage).filter_by(curation_id=id).one_or_none()
    if triage:
        try:
            reference_deleted = Referencedeleted(pmid=triage.pmid, sgdid=None, reason_deleted='This paper was deleted because the content is not relevant to S. cerevisiae.', created_by=request.session['username'])
            DBSession.add(reference_deleted)
            DBSession.delete(triage)        
            transaction.commit()
            pusher = get_pusher_client()
            pusher.trigger('sgd', 'triageUpdate', {})
            return HTTPOk()
        except:
            traceback.print_exc()
            DBSession.rollback()
            return HTTPBadRequest(body=json.dumps({'error': 'DB failure. Verify that PMID is valid and not already present in SGD.'}))
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
    format_name = extract_id_request(request, 'author', param_name="format_name")

    key = "/author/" + format_name
    
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
    id = extract_id_request(request, 'chebi', param_name="format_name")
    chebi = DBSession.query(Chebi).filter_by(chebi_id=id).one_or_none()
    if chebi:
        return chebi.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='chemical_phenotype_details', renderer='json', request_method='GET')
def chemical_phenotype_details(request):
    id = extract_id_request(request, 'chebi')
    
    chebi = DBSession.query(Chebi).filter_by(chebi_id=id).one_or_none()
    if chebi:
        return chebi.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='phenotype', renderer='json', request_method='GET')
def phenotype(request):
    id = extract_id_request(request, 'phenotype', param_name="format_name")
    phenotype = DBSession.query(Phenotype).filter_by(phenotype_id=id).one_or_none()
    if phenotype:
        return phenotype.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='phenotype_locus_details', renderer='json', request_method='GET')
def phenotype_locus_details(request):
    id = extract_id_request(request, 'phenotype')
    phenotype = DBSession.query(Phenotype).filter_by(phenotype_id=id).one_or_none()
    if phenotype:
        return phenotype.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable', renderer='json', request_method='GET')
def observable(request):
    if request.matchdict['format_name'].upper() == "YPO": # /ontology/phenotype/ypo -> root of APOs
        return Apo.root_to_dict()

    id = extract_id_request(request, 'apo', param_name="format_name")
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_locus_details', renderer='json', request_method='GET')
def observable_locus_details(request):
    id = extract_id_request(request, 'apo')
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_ontology_graph', renderer='json', request_method='GET')
def observable_ontology_graph(request):
    id = extract_id_request(request, 'apo')
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.ontology_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_locus_details_all', renderer='json', request_method='GET')
def observable_locus_details_all(request):
    id = extract_id_request(request, 'apo')
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.annotations_and_children_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go', renderer='json', request_method='GET')
def go(request):
    id = extract_id_request(request, 'go', param_name="format_name")
    go = get_go_by_id(id)
    if go:
        return go.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go_ontology_graph', renderer='json', request_method='GET')
def go_ontology_graph(request):
    id = extract_id_request(request, 'go')
    go = get_go_by_id(id)
    if go:
        return go.ontology_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='go_locus_details', renderer='json', request_method='GET')
def go_locus_details(request):
    id = extract_id_request(request, 'go')
    go = get_go_by_id(id)
    if go:
        return go.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go_locus_details_all', renderer='json', request_method='GET')
def go_locus_details_all(request):
    id = extract_id_request(request, 'go')
    go = get_go_by_id(id)
    if go:
        return go.annotations_and_children_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus', renderer='json', request_method='GET')
def locus(request):
    id = extract_id_request(request, 'locus', param_name="sgdid")
    locus = get_locus_by_id(id)
    if locus:
        return locus.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_tabs', renderer='json', request_method='GET')
def locus_tabs(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.tabs()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_phenotype_details', renderer='json', request_method='GET')
def locus_phenotype_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_phenotype_graph', renderer='json', request_method='GET')
def locus_phenotype_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.phenotype_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_go_graph', renderer='json', request_method='GET')
def locus_go_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.go_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_expression_graph', renderer='json', request_method='GET')
def locus_expression_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.expression_graph()
    else:
        return HTTPNotFound()
    
@view_config(route_name='locus_literature_details', renderer='json', request_method='GET')
def locus_literature_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.literature_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_literature_graph', renderer='json', request_method='GET')
def locus_literature_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.literature_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_interaction_graph', renderer='json', request_method='GET')
def locus_interaction_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.interaction_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_regulation_graph', renderer='json', request_method='GET')
def locus_regulation_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)

    if locus:
        return locus.regulation_graph()
    else:
        return HTTPNotFound()
    
@view_config(route_name='locus_go_details', renderer='json', request_method='GET')
def locus_go_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.go_to_dict()
    else:
        return HTTPNotFound()
    
@view_config(route_name='locus_interaction_details', renderer='json', request_method='GET')
def locus_interaction_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.interactions_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_expression_details', renderer='json', request_method='GET')
def locus_expression_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.expression_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_neighbor_sequence_details', renderer='json', request_method='GET')
def locus_neighbor_sequence_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.neighbor_sequence_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_sequence_details', renderer='json', request_method='GET')
def locus_sequence_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
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
    id = extract_id_request(request, 'dataset')
    
    dataset = DBSession.query(Dataset).filter_by(dataset_id=id).one_or_none()
    if dataset:
        return dataset.to_dict(add_conditions=True, add_resources=True)
    else:
        return HTTPNotFound()

@view_config(route_name='keyword', renderer='json', request_method='GET')
def keyword(request):
    id = extract_id_request(request, 'keyword')
    
    keyword = DBSession.query(Keyword).filter_by(keyword_id=id).one_or_none()
    if keyword:
        return keyword.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='keywords', renderer='json', request_method='GET')
def keywords(request):
    keyword_ids = DBSession.query(distinct(DatasetKeyword.keyword_id)).all()
    
    keywords = DBSession.query(Keyword).filter(Keyword.keyword_id.in_(keyword_ids)).all()
    simple_keywords = [k.to_simple_dict() for k in keywords]
    for k in simple_keywords:
        k['name'] = k['display_name']
    return simple_keywords

@view_config(route_name='contig', renderer='json', request_method='GET')
def contig(request):
    id = extract_id_request(request, 'contig', param_name="format_name")

    contig = DBSession.query(Contig).filter_by(contig_id=id).one_or_none()
    if contig:
        return contig.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='contig_sequence_details', renderer='json', request_method='GET')
def contig_sequence_details(request):
    id = extract_id_request(request, 'contig')

    contig = DBSession.query(Contig).filter_by(contig_id=id).one_or_none()
    if contig:
        return contig.sequence_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_posttranslational_details', renderer='json', request_method='GET')
def locus_posttranslational_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.posttranslational_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_ecnumber_details', renderer='json', request_method='GET')
def locus_ecnumber_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.ecnumber_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_protein_experiment_details', renderer='json', request_method='GET')
def locus_protein_experiment_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.protein_experiment_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_protein_domain_details', renderer='json', request_method='GET')
def locus_protein_domain_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.protein_domain_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_binding_site_details', renderer='json', request_method='GET')
def locus_binding_site_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.binding_site_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_regulation_details', renderer='json', request_method='GET')
def locus_regulation_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)

    if locus:
        return locus.regulation_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_regulation_target_enrichment', renderer='json', request_method='GET')
def locus_regulation_target_enrichment(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.regulation_target_enrichment()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_protein_domain_graph', renderer='json', request_method='GET')
def locus_protein_domain_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.protein_domain_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='domain', renderer='json', request_method='GET')
def domain(request):
    id = extract_id_request(request, 'proteindomain', param_name="format_name")

    proteindomain = DBSession.query(Proteindomain).filter_by(proteindomain_id=id).one_or_none()
    if proteindomain:
        return proteindomain.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='domain_locus_details', renderer='json', request_method='GET')
def domain_locus_details(request):
    id = extract_id_request(request, 'proteindomain')

    proteindomain = DBSession.query(Proteindomain).filter_by(proteindomain_id=id).one_or_none()
    if proteindomain:
        return proteindomain.locus_details()
    else:
        return HTTPNotFound()

@view_config(route_name='domain_enrichment', renderer='json', request_method='GET')
def domain_enrichment(request):
    id = extract_id_request(request, 'proteindomain')
        
    proteindomain = DBSession.query(Proteindomain).filter_by(proteindomain_id=id).one_or_none()
    if proteindomain:
        return proteindomain.enrichment()
    else:
        return HTTPNotFound()

@view_config(route_name='ecnumber', renderer='json', request_method='GET')
def ecnumber(request):
    id = extract_id_request(request, 'ec')

    ec = DBSession.query(Ec).filter_by(ec_id=id).one_or_none()

    if ec:
        return ec.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='ecnumber_locus_details', renderer='json', request_method='GET')
def ecnumber_locus_details(request):
    id = extract_id_request(request, 'ec')

    ec = DBSession.query(Ec).filter_by(ec_id=id).one_or_none()

    if ec:
        return ec.locus_details()
    else:
        return HTTPNotFound()

# check for basic rad54 response
@view_config(route_name='healthcheck', renderer='json', request_method='GET')
def healthcheck(request):
    locus = get_locus_by_id(1268789)
    return locus.to_dict()
