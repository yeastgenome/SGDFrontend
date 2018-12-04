import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib2 import Request, urlopen, URLError

rest_url = "https://patmatch.yeastgenome.org/"
            
def do_restmap(request):

    p = dict(request.params)

    data = _run_restrictionmap(p)
    return Response(body=json.dumps(data), content_type='application/json')

def _run_restrictionmap(p):

    paramData = _construct_parameters(p)

    url = rest_url + "cgi-bin/aws-restrictionmapper" 
   
    req = Request(url=url, data=paramData)
    res = urlopen(req)
    result = res.read();

    dataSet = result.split("\t")
 
    if dataSet[1]:
        data = { "data": json.loads(dataSet[0]),
                 "seqName": dataSet[1],
                 "chrCoords": dataSet[2],
                 "seqLength": dataSet[3],
                 "notCutEnzyme": json.loads(dataSet[4]) }
    else:
        data = { "ERROR": json.loads(dataSet[0]),
                 "seqName": dataSet[1],
                 "chrCoords": dataSet[2],
                 "seqLength": dataSet[3],
                 "notCutEnzyme": [] }

    return data


def _construct_parameters(p):

    import urllib
    
    seq = p.get('seq')
    if seq is None:
        seq = ""
    type = p.get('type')
    if type is None:
        type = ""
    name = p.get('name')
    if name is None:
        name = ""
        
    paramData = urllib.urlencode({ 'seq': seq,
                                   'type': type,
                                   'name': name })

    return paramData



             

