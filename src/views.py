from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from pyramid.session import check_csrf_token

from oauth2client import client, crypt
import os

from .models import DBSession, Colleague
from .celery_tasks import upload_to_s3
from .helpers import allowed_file, secure_save_file, curator_or_none, authenticate

import logging
log = logging.getLogger(__name__)

@view_config(route_name='home', request_method='GET', renderer='home.jinja2')
def home_view(request):
    return {'google_client_id': os.environ['GOOGLE_CLIENT_ID']}

@view_config(route_name='upload', request_method='POST')
@authenticate
def upload_file(request):
    root_dir = os.path.dirname(os.getcwd())

    if request.POST.get('file') is None:
        return HTTPBadRequest('Field \'file\' is missing')
    
    file = request.POST['file'].file
    filename = request.POST['file'].filename

    if file and allowed_file(filename):
        temp_file_path = secure_save_file(file, filename)
        settings = request.registry.settings
	upload_to_s3.delay(filename, temp_file_path, os.environ['S3_ACCESS_KEY'], os.environ['S3_SECRET_KEY'], os.environ['S3_BUCKET'])
	return Response('Upload complete')
    else:
        return HTTPBadRequest('File extension is invalid')

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
