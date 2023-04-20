import os
import json
import requests
from pyramid.response import Response

# http://0.0.0.0:6545/run_gotools?aspect=C&genes=COR5|CYT1|Q0105|QCR2|S000001929|S000002937|S000003809|YEL024W|YEL039C|YGR183C|YHR001W-A

gotermfinder_url = os.environ['GOTOOLS_SERVER'] + "/gotermfinder"

goslimmapper_url = os.environ['GOTOOLS_SERVER'] + "/goslimmapper"

# http://gotermfinder.yeastgenome.org/gotermfinder?aspect=F&genes=COR5|CYT1|Q0105|QCR2|S000001929|S000002937|S000003809|YEL024W|YEL039C|YGR183C|YHR001W-A

def do_gosearch(request):

    p = dict(request.params)

    data = {}
    if p.get('mapper'):
        data = run_search(request, goslimmapper_url)
    else:
        data = run_search(request, gotermfinder_url)
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')


def run_search(request, search_url):

    # return { "url": search_url }
    post_data = request.POST
    response = requests.post(search_url, data=post_data)
    data = json.loads(response.text)
    return data
