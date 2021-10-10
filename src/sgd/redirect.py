import json
from pyramid.response import Response
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from src.sgd.frontend import config
import os

def direct_backend(request):

    p = dict(request.params)
    data = {}
    if p.get('param'):
        url = config.backend_url + '/' + p.get('param')
        return url
        try:
            req = Request(url=url)
            res = urlopen(req)
            data = json.loads(res.read())
        except HTTPError:
            return 404
    return Response(body=json.dumps(data), content_type='application/json')


