import json
from pyramid.response import Response
# from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from src.sgd.frontend import config
import requests

def do_redirect(request):

    p = dict(request.params)
    data = {}
    if p.get('param'):
        url = config.backend_url
        if url[-1] == '/':
            url[0:-1]
        if p.get('param').startswith('/'):
            url = url + p.get('param')
        else:
            url = url + '/' + p.get('param')        
        try:
            #req = Request(url=url)
            #res = urlopen(req)
            #data = json.loads(res.read())
            res = requests.get(url)
            data = json.loads(res.text)
        except HTTPError:
            return 404
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')


