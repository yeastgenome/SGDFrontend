import os
import json
import requests
from pyramid.response import Response

rest_url = os.environ['PATMATCH_SERVER'] + "/restrictionmapper"

            
def do_restmap(request):

    data = _run_restrictionmap(request)
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')


def _run_restrictionmap(request):
    
    post_data = request.POST
    response = requests.post(rest_url, data=post_data)
    data = json.loads(response.text)
    return data


def _get_data_from_server(url):

    response = requests.get(url)
    data = json.loads(response.text)    
    return data


