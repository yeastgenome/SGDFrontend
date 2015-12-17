from pyramid.httpexceptions import HTTPFound, HTTPBadRequest
from pyramid.response import Response, FileResponse
from pyramid.response import FileResponse
from pyramid.view import view_config
from celery_tasks import upload_to_s3
from common.helpers import allowed_file, secure_save_file

import os


@view_config(route_name='home')
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
	upload_to_s3.delay(filename, temp_file_path, settings['s3_access_key'], settings['s3_secret_key'], settings['s3_bucket'])
	return Response('Upload complete')
    else:
        return HTTPBadRequest('File extension is invalid')
