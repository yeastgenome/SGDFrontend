import json
import os

import requests
from pyramid.response import Response

from src.sgd.frontend.yeastgenome.views.misc_views import BACKEND_TIMEOUT

# Annotation tables (e.g. /go/{id}/locus_details for GO:0005634 nucleus or
# /disease/{id}/locus_details_all for DOID:162 cancer) take 30-80 s to build,
# so these table loads get a longer read timeout than page renders (still
# under the ALB idle timeout of 300 s).
TABLE_TIMEOUT = (BACKEND_TIMEOUT[0], float(os.getenv('BACKEND_TABLE_READ_TIMEOUT', '180')))


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
            res = requests.get(url, timeout=TABLE_TIMEOUT)
            if res.status_code == 200:
                data = json.loads(res.text)
        except (requests.exceptions.RequestException, ValueError):
            data = {}
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
