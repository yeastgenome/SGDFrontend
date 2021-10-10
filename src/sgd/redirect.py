import json
from pyramid.response import Response
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from src.sgd.frontend import config
import os

def do_redirect(request):

    p = dict(request.params)
    data = {'p': p}
    return Response(body=json.dumps(data), content_type='application/json')

    if p.get('param'):
        url = config.backend_url + '/' + p.get('param')
        data = { 'url': url }
        return Response(body=json.dumps(data), content_type='application/json')
        try:
            req = Request(url=url)
            res = urlopen(req)
            data = json.loads(res.read())
        except HTTPError:
            return 404
    return Response(body=json.dumps(data), content_type='application/json')


