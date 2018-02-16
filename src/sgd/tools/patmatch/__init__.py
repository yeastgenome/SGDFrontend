import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib2 import Request, urlopen, URLError

patmatch_url = "https://patmatch.dev.yeastgenome.org/";

def do_patmatch(request):

    p = dict(request.params)

    if p.get('conf'):
        data = _get_config(p.get('conf'))
        return Response(body=json.dumps(data), content_type='application/json')
        
    data = _run_patmatch(p)

    return Response(body=json.dumps(data), content_type='application/json')

def _run_patmatch(p):

    from urllib2 import Request, urlopen, URLError

    paramData = _construct_patmatch_parameters(p)

    # url = config.patmatch_url + "cgi-bin/aws-patmatch"
    url = patmatch_url + "cgi-bin/aws-patmatch" 

    req = Request(url=url, data=paramData)

    res = urlopen(req)

    result = res.read()

    dataSet = result.split("\t")
    
    if dataSet[1]:
        data = { "result": dataSet[0],
                 "hits":   json.loads(dataSet[1]),
                 "totalHits": dataSet[2],
                 "showHits": dataSet[3]}
    else:
        data = { "result": dataSet[0],
                 "hits": "",
                 "totalHits": 0,
                 "showHits": 0}

    return data

def _construct_patmatch_parameters(p):

    insertion = p.get('insertion') if p.get('insertion') else 0 
    deletion = p.get('deletion') if p.get('deletion') else 0
    substitution = p.get('substitution') if p.get('substitution') else 0
    
    if strand.startswith('Both'):
        strand = 'both'
    elif strand.startswith('Reverse'):
        strand = 'crick'
    else:
        strand = 'watson'

    import urllib
    
    paramData = urllib.urlencode({ 'pattern': p.get('pattern'),
                                   'strain': p.get('strain'),
                                   'seqtype': p.get('seqtype'),
                                   'dataset': p.get('dataset'),
                                   'maxhits': p.get('maxhits'),
                                   'strand': strand,
                                   'mismatch': p.get('mismatch'),
                                   'insertion': insertion,
                                   'deletion': deletion,
                                   'substitution': substitution })
    return paramData


def _get_config(conf):

    # url = config.patmatch_url + "patmatch/" + conf
    url = patmatch_url + "patmatch/" + conf  
 
    data = _get_json_from_server(url)

    return data


def _get_json_from_server(url):

    req = Request(url)
    res = urlopen(req)
    data = json.loads(res.read())
    return data
             

