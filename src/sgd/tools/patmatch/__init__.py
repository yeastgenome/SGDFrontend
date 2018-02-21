import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib2 import Request, urlopen, URLError

patmatch_url = "http://patmatch.dev.yeastgenome.org/"
                
def do_patmatch(request):

    p = dict(request.params)

    if p.get('conf'):
        data = _get_config()
        return Response(body=json.dumps(data), content_type='application/json')
        
    data = _run_patmatch(p)
    return Response(body=json.dumps(data), content_type='application/json')

def _run_patmatch(p):

    paramData = _construct_patmatch_parameters(p)

    url = patmatch_url + "cgi-bin/aws-patmatch" 
   
    req = Request(url=url, data=paramData)
    res = urlopen(req)
    data = json.loads(res.read())
    return data

def _construct_patmatch_parameters(p):

    # insertion = 1 if p.get('insertion') else 0 
    # deletion = 1 if p.get('deletion') else 0
    # substitution = 1  if p.get('substitution') else 0
    # strain = p.get('strain')
    # if strand.startswith('Both'):
    #    strand = 'both'
    # elif strand.startswith('Reverse'):
    #    strand = 'crick'
    # else:
    #    strand = 'watson'

    import urllib
    
    paramData = urllib.urlencode({ 'pattern': p.get('pattern'),
                                   'strain': p.get('strain'),
                                   'seqtype': p.get('seqtype'),
                                   'dataset': p.get('dataset'),
                                   'maxhits': p.get('max_hits'),
                                   'strand': p.get('strand'),
                                   'mismatch': p.get('mismatch'),
                                   'insertion': p.get('insertion'),
                                   'deletion': p.get('deletion'),
                                   'substitution': p.get('substitution') })
    return paramData


def _get_config():

    url = patmatch_url + "patmatch/patmatch.json"
    req = Request(url)
    res = urlopen(req)
    data = json.loads(res.read()) 
    return data


             

