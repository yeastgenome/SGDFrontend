import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

rest_url = "https://patmatch.yeastgenome.org/cgi-bin/aws-restrictionmapper2"
validate_url = "https://www.yeastgenome.org/backend/locus/"
            
def do_restmap(request):

    p = dict(request.params)

    data = _run_restrictionmap(p)
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')

def _run_restrictionmap(p):

    [display_name, paramData] = _construct_parameters(p)

    if display_name is None:
        return { "ERROR": "not valid name" }

    req = Request(url=rest_url, data=paramData.encode('utf-8'))
    res = urlopen(req)
    result = res.read().decode('utf-8');

    dataSet = result.split("\t")
 
    if dataSet[1]:
        data = { "data": json.loads(dataSet[0]),
                 "seqName": display_name,
                 "chrCoords": dataSet[2],
                 "seqLength": dataSet[3],
                 "notCutEnzyme": json.loads(dataSet[4]),
                 "downloadUrl": dataSet[5],
                 "downloadUrl4notCutEnzyme": dataSet[6] }
    else:
        data = { "ERROR": json.loads(dataSet[0]),
                 "seqName": display_name,
                 "chrCoords": dataSet[2],
                 "seqLength": dataSet[3],
                 "notCutEnzyme": [],
                 "downloadUrl": '',
                 "downloadUrl4notCutEnzyme": ''}

    return data


def _construct_parameters(p):

    import urllib.request, urllib.parse, urllib.error
    
    seq = p.get('seq')
    if seq is None:
        seq = ""
    type = p.get('type')
    if type is None:
        type = ""
    name = p.get('name')
    sgdid = ""
    display_name = ""
    if name is not None:
        name = name.replace("SGD:", "")
        url = validate_url + name
        res = _get_json_from_server(url)
        if res and res != 404 and res != "null" and 'sgdid' in res:
            gene_name = res.get('display_name')
            if gene_name:
                gene_name = gene_name.upper()
            format_name = res.get('format_name').upper()
            if name.upper() in [res.get('sgdid'), gene_name, format_name]:
                sgdid = res.get('sgdid')
                if gene_name and gene_name != format_name:
                    display_name = res.get('display_name') + '/' + res.get('format_name')
                else:
                    display_name = res.get('format_name')
    if sgdid or seq:
        paramData = urllib.parse.urlencode({ 'seq': seq,
                                       'type': type,
                                       'name': sgdid })
        return [display_name, paramData]
    else:
        return [None, None]


def _get_json_from_server(url):

    try:
        req = Request(url)
        res = urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        return data
    except HTTPError:
        return 404
             

