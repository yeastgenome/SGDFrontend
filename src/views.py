from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from pyramid.response import Response, FileResponse
from pyramid.response import FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from celery_tasks import upload_to_s3
from common.helpers import allowed_file, secure_save_file

from .models import DBSession, Colleague

import os


@view_config(route_name='home', request_method='GET')
def home_view(request):
    return FileResponse('static/index.html', request=request)

@view_config(route_name='upload', request_method='POST')
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
        return HTTPBadRequest('last_name argument is missing')

    last_name = escape(request.params['last_name'])
    return []
#    return DBSession.query(Colleague).filter(Colleague.last_name == last_name)
