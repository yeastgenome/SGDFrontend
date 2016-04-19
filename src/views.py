from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from pyramid.session import check_csrf_token

from oauth2client import client, crypt
import os

from .models import DBSession, Colleague, Filedbentity, Filepath, Dbentity, Edam, Referencedbentity, ReferenceFile, FileKeyword, Keyword
from .celery_tasks import upload_to_s3
from .helpers import allowed_file, secure_save_file, curator_or_none, authenticate, extract_references, extract_keywords, get_or_create_filepath, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file

import transaction

import datetime
import math
import logging
log = logging.getLogger(__name__)

@view_config(route_name='home', request_method='GET', renderer='home.jinja2')
def home_view(request):
    return {'google_client_id': os.environ['GOOGLE_CLIENT_ID']}

@view_config(route_name='upload', request_method='POST')
@authenticate
def upload_file(request):
    keys = ["file", "old_filepath", "new_filepath", "previous_file_name", "display_name", "status", "topic", "topic_id", "format", "format_id", "extension", "extension_id", "file_date", "is_public", "for_spell", "for_browser", "readme_name", "pmids", "keywords"]

    for k in keys:
        if request.POST.get(k) is None:
            return HTTPBadRequest('Field \'' + k + '\' is missing')

    file = request.POST['file'].file
    filename = request.POST['file'].filename

    if not file:
        log.info('No file was sent.')
        return HTTPBadRequest('No file was sent.')

    if not allowed_file(filename):
        log.info('Upload error: File ' + request.POST.get("display_name") + ' has an invalid extension.')
        return HTTPBadRequest('File extension is invalid')
    
    try:
        references = extract_references(request)
        keywords = extract_keywords(request)
        topic = extract_topic(request)
        format = extract_format(request)
        filepath = get_or_create_filepath(request)
    except HTTPBadRequest as bad_request:
        return bad_request

    if file_already_uploaded(request):
        return HTTPBadRequest("Upload error: File " + request.POST.get("display_name") + " already exists.")

    fdb = Filedbentity(
        # Filedbentity params
        md5sum=None,
        previous_file_name=request.POST.get("previous_file_name"),
        topic_id=topic.edam_id,
        format_id=format.edam_id,
        file_date=datetime.datetime.strptime(request.POST.get("file_date"), "%Y-%m-%d %H:%M:%S"),
        is_public=request.POST.get("is_public"),
        is_in_spell=request.POST.get("for_spell"),
        is_in_browser=request.POST.get("for_browser"),
        filepath_id=filepath.filepath_id,
        readme_url=request.POST.get("readme_name"),
        file_extension=request.POST.get("extension"),        

        # DBentity params
        format_name=request.POST.get("display_name"),
        display_name=request.POST.get("display_name"),
        s3_url=None,
        source_id=339,
        dbentity_status=request.POST.get("status")
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
    return Response('Upload complete')

@view_config(route_name='colleagues', renderer='json', request_method='GET')
def colleagues_by_last_name(request):
    if request.params.get('last_name') is None:
        return HTTPBadRequest('Query string field is missing: last_name')

    last_name = request.params['last_name']
    colleagues = DBSession.query(Colleague).filter(Colleague.last_name.like(last_name.capitalize() + "%")).all()

    return [c.to_search_results_dict() for c in colleagues]

@view_config(route_name='colleague', renderer='json', request_method='GET')
def colleague_by_format_name(request):
    format_name = request.matchdict['format_name']

    colleague = DBSession.query(Colleague).filter(Colleague.format_name == format_name).one_or_none()
    
    if colleague:
        return colleague.to_info_dict()
    else:
        return HTTPNotFound('Colleague not found')

@view_config(route_name='keywords', renderer='json', request_method='GET')
def keywords(request):
    keywords_db = DBSession.query(Keyword).all()
    return {'options': [k.to_dict() for k in keywords_db]}
    
@view_config(route_name='sign_in', request_method='POST')
def sign_in(request):
    if not check_csrf_token(request, raises=False):
        return HTTPBadRequest('Bad CSRF Token')

    if request.POST.get('token') is None:
        return HTTPForbidden('Expected authentication token not found')
    
    try:
        idinfo = client.verify_id_token(request.POST.get('token'), os.environ['GOOGLE_CLIENT_ID'])

        if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return HTTPForbidden('Authentication token has an invalid ISS')
        
        if idinfo.get('email') is None:
            return HTTPForbidden('Authentication token has no email')

        log.info("User " + idinfo['email'] + " trying to authenticate from " + (request.remote_addr or "(no remote address)"))

        curator = curator_or_none(idinfo['email'])

	if curator is None:
            return HTTPForbidden('User ' + idinfo['email'] + ' is not authorized on SGD')
        
        session = request.session

        if 'email' not in session:
            session['email'] = curator.email

        if 'username' not in session:
            session['username'] = curator.username

        log.info("User " + idinfo['email'] + " was successfuly authenticated.")

        return HTTPOk()

    except crypt.AppIdentityError:
        return HTTPForbidden('Authentication token is invalid')

@view_config(route_name='sign_out', request_method='DELETE')
def sign_out(request):
    request.session.invalidate()
    return HTTPOk()
