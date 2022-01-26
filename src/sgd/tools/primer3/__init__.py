import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib.request import Request, urlopen
from urllib.error import URLError
from urllib.parse import urlencode

url = config.backend_url + '/primer3'

def do_primer3(request):

    p = dict(request.params)

    paramData = urlencode(p)

    req = Request(url=url, data=paramData.encode('utf-8'))
    res = urlopen(req)
    result = res.read().decode('utf-8')
    data = json.loads(result)
    
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')

    
