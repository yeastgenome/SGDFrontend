import json
import os

import requests
from pyramid.response import Response


def do_redirect(request):

    p = dict(request.params)

    data = {}
    if p.get('param'):
        if p.get('param') == 'go_release':
            url = 'http://current.geneontology.org/metadata/release-date.json'
        else:
            url = os.environ['BACKEND_URL']
            if url[-1] == '/':
                url[0:-1]
            if p.get('param').startswith('/'):
                url = url + p.get('param')
            else:
                url = url + '/' + p.get('param')
            if not p.get('param').endswith('locus_details_all') and not p.get('param').startswith('go/'):
                for key in p:
                    if key == 'param':
                        continue
                    url = url + "&" + key + "=" + p.get(key)
        try:
            res = requests.get(url)
            if res.status_code == 200:
                data = json.loads(res.text)
        except (requests.exceptions.RequestException, ValueError):
            data = {}
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')


