import os
import json
import requests
from pyramid.response import Response

patmatch_url = os.environ['PATMATCH_SERVER'] + "/patmatch"


def do_patmatch(request):

    p = dict(request.params)

    if p.get('conf'):
        data = _get_config()
        return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
        
    if p.get('seqname'):
        data = _get_seq(p.get('seqname'), p.get('dataset'))
        return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')

    data = _run_patmatch(request)
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
    
    
def _get_seq(seqname, dataset):

    search_url = patmatch_url + "?dataset=" + dataset + "&seqname=" + seqname
    return _get_data_from_server(search_url)


def _run_patmatch(request):

    post_data = request.POST

    response = requests.post(patmatch_url, data=post_data)
    data = json.loads(response.text)
    return data


def _get_config():

    search_url = patmatch_url + "?conf=patmatch.json" 
    return _get_data_from_server(search_url)


def _get_data_from_server(url):

    response = requests.get(url)
    data = json.loads(response.text)    
    return data

             

