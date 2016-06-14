from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from pyramid.session import check_csrf_token

from oauth2client import client, crypt
import os

from .models import DBSession, ESearch, Colleague, Filedbentity, Filepath, Dbentity, Edam, Referencedbentity, ReferenceFile, FileKeyword, Keyword, ReferenceDocument, Chebi, ChebiUrl, PhenotypeannotationCond, Phenotypeannotation
from .celery_tasks import upload_to_s3
from .helpers import allowed_file, secure_save_file, curator_or_none, authenticate, extract_references, extract_keywords, get_or_create_filepath, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file, FILE_EXTENSIONS

import transaction

import datetime
import math
import logging
import json
log = logging.getLogger(__name__)

@view_config(route_name='home', request_method='GET', renderer='home.jinja2')
def home_view(request):
    return {'google_client_id': os.environ['GOOGLE_CLIENT_ID']}

@view_config(route_name='upload', request_method='POST', renderer='json')
@authenticate
def upload_file(request):
    keys = ['file', 'old_filepath', 'new_filepath', 'previous_file_name', 'display_name', 'status', 'topic_id', 'format_id', 'extension_id', 'file_date', 'readme_name', 'pmids', 'keyword_ids']
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
        readme_url=request.POST.get('readme_name'),
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
    return Response({ 'success': True })

@view_config(route_name='colleagues', renderer='json', request_method='GET')
def colleagues_by_last_name(request):
    if request.params.get('last_name') is None:
        return HTTPBadRequest(body=json.dumps({'error':'Query string field is missing: last_name'}))

    last_name = request.params['last_name']
    colleagues = DBSession.query(Colleague).filter(Colleague.last_name.like(last_name.capitalize() + '%')).all()

    return [c.to_search_results_dict() for c in colleagues]

@view_config(route_name='colleague', renderer='json', request_method='GET')
def colleague_by_format_name(request):
    format_name = request.matchdict['format_name']

    colleague = DBSession.query(Colleague).filter(Colleague.format_name == format_name).one_or_none()
    
    if colleague:
        return colleague.to_info_dict()
    else:
        return HTTPNotFound(body=json.dumps({'error': 'Colleague not found'}))

@view_config(route_name='search_colleagues', renderer='json', request_method='GET')
def search_colleagues(request):
    limit = request.params.get('limit', 10)
    offset = request.params.get('offset', 0)
    
    if request.params.get('q') is None:
        query = {'match_all': {}}
    else:
        query = {
            "bool": {
                "should": [
                    {
                        "match_phrase_prefix": {
                            "name": {
                                "query": request.params.get('q'),
                                "boost": 4,
                                "max_expansions": 30,
                                "analyzer": "standard"
                            }
                        }
                    },
                    {
                        "match_phrase": {
                            "name": {
                                "query": request.params.get('q'),
                                "boost": 10,
                                "analyzer": "standard"
                            }
                        }
                    }
                ]
            }
        }
    
    es_query = {
        'query': {
            'filtered': {
                'query': query,
                'filter': {
                    'bool': {
                        'must': [{'term': { 'category': 'colleagues'}}]
                    }
                }
            }
        }
    }

    search_results = ESearch.search(index=request.registry.settings['elasticsearch.index'], body=es_query, size=limit, from_=offset)

    json_response = []
    for r in search_results['hits']['hits']:
        json_response.append(r['_source'])

    return {'results': json_response, 'total': search_results['hits']['total']}

@view_config(route_name='keywords', renderer='json', request_method='GET')
def keywords(request):
    keywords_db = DBSession.query(Keyword).all()
    return {'options': [k.to_dict() for k in keywords_db]}

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
            references = DBSession.query(ReferenceDocument.reference_id, ReferenceDocument.text).filter(ReferenceDocument.reference_id.in_(reference_ids), ReferenceDocument.document_type == 'Medline').all()

            if len(references) == 0:
                return HTTPNotFound(body=json.dumps({'error': "Reference_ids do not exist."}))
            
            return [{'id': r.reference_id, 'text': r.text} for r in references]
        except ValueError:
            return HTTPBadRequest(body=json.dumps({'error': "IDs must be string format of integers. Example JSON object expected: {\"reference_ids\": [\"1\", \"2\"]}"}))

@view_config(route_name='chemical', renderer='json', request_method='GET')
def chemical(request):
    id = request.matchdict['id']
    
    try:
        float(id)
        filter_by = Chebi.chebi_id == id
    except ValueError:
        filter_by = Chebi.format_name == id

    chemical = DBSession.query(Chebi.chebi_id, Chebi.display_name, Chebi.chebiid, Chebi.format_name).filter(filter_by).one_or_none()
        
    if chemical:
        chemical_url = DBSession.query(ChebiUrl.obj_url).filter(ChebiUrl.chebi_id == chemical[0]).one_or_none()
        urls = []
        if chemical_url:
            urls = [{'link': chemical_url[0]}]

        return {
            'display_name': chemical[1],
            'chebi_id': chemical[2],
            'id': int(chemical[0]),
            'link': '/chemical/' + chemical[3] + '/overview/',
            'urls': urls
        }
    else:
        return HTTPNotFound(body=json.dumps({'error': 'Chemical not found'}))

@view_config(route_name='chemical_phenotype_details', renderer='json', request_method='GET')
def chemical_phenotype_details(request):
    id = request.matchdict['id']
    
    try:
        float(id)
        filter_by = Chebi.chebi_id == id
    except ValueError:
        filter_by = Chebi.format_name == id

    chemical_name = DBSession.query(Chebi.display_name).filter(filter_by).one_or_none()

    if chemical:
        phenotype_annotation_conditions = DBSession.query(PhenotypeannotationCond.annotation_id).filter(PhenotypeannotationCond.condition_name == chemical_name.display_name, PhenotypeannotationCond.condition_class == 'chemical').all()
        
        if len(phenotype_annotation_conditions) == 0:
            return []
        else:
            annotation_ids = [id[0] for id in phenotype_annotation_conditions]
            phenotype_annotation = DBSession.query(Phenotypeannotation).filter(Phenotypeannotation.annotation_id.in_(annotation_ids)).all()
            return [p.to_dict() for p in phenotype_annotation]
    else:
        return HTTPNotFound(body=json.dumps({'error': 'Chemical not found'}))

@view_config(route_name='sign_in', request_method='POST')
def sign_in(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest(body=json.dumps({'error':'Bad CSRF Token'}))

    if request.POST.get('google_token') is None:
        return HTTPForbidden(body=json.dumps({'error': 'Expected authentication token not found'}))
    
    try:
        idinfo = client.verify_id_token(request.POST.get('google_token'), os.environ['GOOGLE_CLIENT_ID'])

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

        return HTTPOk()

    except crypt.AppIdentityError:
        return HTTPForbidden(body=json.dumps({'error': 'Authentication token is invalid'}))

@view_config(route_name='sign_out', request_method='DELETE')
def sign_out(request):
    request.session.invalidate()
    return HTTPOk()
