from pyramid.httpexceptions import HTTPFound
from pyramid.response import Response, FileResponse
from pyramid.response import FileResponse
from pyramid.view import view_config

from werkzeug import secure_filename
import os
import shutil

from celery_tasks import upload_to_s3
from common.helpers import allowed_file


@view_config(route_name='home')
def home_view(request):
    return FileResponse('static/index.html', request=request)

@view_config(route_name='upload', request_method='POST')
def upload_file(request):
    root_dir = os.path.dirname(os.getcwd())
	
    file = request.POST['file'].file
    filename = request.POST['file'].filename
	
    if file and allowed_file(filename):
        filename = secure_filename(filename)
	temp_file_path = os.path.join('/tmp', filename)

	file.seek(0)
	with open(temp_file_path, 'wb') as output_file:
	    shutil.copyfileobj(file, output_file)

        settings = request.registry.settings
	upload_to_s3.delay(filename, temp_file_path, settings['s3_access_key'], settings['s3_secret_key'], settings['s3_bucket'])

	return Response('Upload complete')
    else:
	return Response('Extension not suported')
