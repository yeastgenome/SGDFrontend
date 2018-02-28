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

    if p.get('seqname'):
        data = _get_seq(p)
        return Response(body=json.dumps(data), content_type='application/json')

    data = _run_patmatch(p)
    return Response(body=json.dumps(data), content_type='application/json')

def _get_seq(p):

    import urllib

    paramData = urllib.urlencode({ 'seqname': p.get('seqname'),
                                   'dataset': p.get('dataset') });

    url = patmatch_url + "cgi-bin/aws-patmatch"
    req = Request(url=url, data=paramData)
    res = urlopen(req)
    result = res.read();

    return json.loads(result)


def _run_patmatch(p):

    paramData = _construct_patmatch_parameters(p)

    url = patmatch_url + "cgi-bin/aws-patmatch" 
   
    req = Request(url=url, data=paramData)
    res = urlopen(req)
    result = res.read();

    dataSet = result.split("\t")

    if dataSet[1]:
        data = { "hits": json.loads(dataSet[0]),
                 "uniqueHits": dataSet[1],
                 "totalHits": dataSet[2],
                 "downloadUrl": dataSet[3]}
    else:
        data = { "hits": json.loads(dataSet[0]),
                 "uniqueHits": 0,
                 "totalHits": 0,
                 "downloadUrl": ""}
                 
    return data

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

    seqtype = p.get('seqtype') if p.get('seqtype') is not None else 'pep'
    dataset = p.get('dataset') if p.get('dataset') is not None else 'orf_pep'
    
    import urllib

    paramData = urllib.urlencode({ 'pattern': p.get('pattern'),
                                   'strain': p.get('strain'),
                                   'seqtype': seqtype,
                                   'dataset': dataset,
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


             

