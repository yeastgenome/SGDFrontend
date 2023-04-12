import os
import json
import requests
from pyramid.response import Response

blast_url = os.environ['BLAST_SERVER'] + "/blast_search"

def do_blast(request):

    p = dict(request.params)

    if p.get('name'):
        data =  _get_seq(p.get('name'), p.get('type'))
        return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
    
    if p.get('conf'):
        data = _get_config(p.get('conf')) 
        return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
    
    data = _run_blast(request)
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
    
def _get_seq(name, type):

    # url = blast_url + "?name=" + name
    # if type:
    #    url = url + "&type=" + type
    # return _get_data_from_server(url)

    data = {}
    if type == None or type == '' or type == 'undefined':
        type = 'dna'

    url = os.environ['BACKEND_URL'] + "/locus/" + name + "/sequence_details"
    res = _get_data_from_server(url)
    
    rows = []
    if type in ('nuc', 'dna'):
        rows = res['genomic_dna']
    else:
        rows = res['protein']
        
    for row in rows:
        strain = row['strain']
        if strain['display_name'] == 'S288C':
            data['seq'] = row['residues']
    
    return data

    
def _get_config(conf):
    
    url = blast_url + "?conf=" + conf
    return _get_data_from_server(url)

def _get_data_from_server(url):

    response = requests.get(url)
    data = json.loads(response.text)    
    return data

def _run_blast(request):

    # Extract the POST data from the request
    post_data = request.POST

    # Make a POST request to the Flask endpoint with the POST data
    response = requests.post(blast_url, data=post_data)
    data = json.loads(response.text)
    return data
