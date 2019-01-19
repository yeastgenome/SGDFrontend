import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib2 import Request, urlopen, URLError

rest_url = "https://patmatch.yeastgenome.org/"
validate_url = "https://www.yeastgenome.org/backend/locus/"
            
def do_restmap(request):

    p = dict(request.params)

    data = _run_restrictionmap(p)
    return Response(body=json.dumps(data), content_type='application/json')

def _run_restrictionmap(p):

    paramData = _construct_parameters(p)

    url = rest_url + "cgi-bin/aws-restrictionmapper2" 
   
    req = Request(url=url, data=paramData)
    res = urlopen(req)
    result = res.read();

    dataSet = result.split("\t")
 
    if dataSet[1]:
        data = { "data": json.loads(dataSet[0]),
                 "seqName": dataSet[1],
                 "chrCoords": dataSet[2],
                 "seqLength": dataSet[3],
                 "notCutEnzyme": json.loads(dataSet[4]),
                 "downloadUrl": dataSet[5],
                 "downloadUrl4notCutEnzyme": dataSet[6] }
    else:
        data = { "ERROR": json.loads(dataSet[0]),
                 "seqName": dataSet[1],
                 "chrCoords": dataSet[2],
                 "seqLength": dataSet[3],
                 "notCutEnzyme": [],
                 "downloadUrl": '',
                 "downloadUrl4notCutEnzyme": ''}

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
    else:
        url = validate_url + name
        res = _get_json_from_server(url)
        if res != 404 and 'sgdid' in res:
            name = res.get('sgdid')
            
    paramData = urllib.urlencode({ 'seq': seq,
                                   'type': type,
                                   'name': name })

    return paramData


def _get_json_from_server(url):

    try:
        req = Request(url)
        res = urlopen(req)
        data = json.loads(res.read())
        return data
    except HTTPError:
        return 404
             

