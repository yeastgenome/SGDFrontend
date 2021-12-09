import json
from pyramid.response import Response
# from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from src.sgd.frontend import config
import requests

def do_redirect(request):

    p = dict(request.params)
    data = {"url": config.backend_url}
    return Response(body=json.dumps(data), content_type='application/json')


