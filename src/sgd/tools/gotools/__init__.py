import json
from pyramid.response import Response
from urllib2 import Request, urlopen, URLError, HTTPError
import os

# http://0.0.0.0:6545/run_gotools?aspect=C&genes=COR5|CYT1|Q0105|QCR2|S000001929|S000002937|S000003809|YEL024W|YEL039C|YGR183C|YHR001W-A

gotools_url = "http://gotermfinder.dev.yeastgenome.org/cgi-bin/gotermfinder"

# http://gotermfinder.dev.yeastgenome.org/cgi-bin/gotermfinder?aspect=F&genes=COR5|CYT1|Q0105|QCR2|S000001929|S000002937|S000003809|YEL024W|YEL039C|YGR183C|YHR001W-A


def do_gosearch(request):

    p = dict(request.params)

    data = run_gotermfinder(p)
   
    return Response(body=json.dumps(data), content_type='application/json')
 
def run_gotermfinder(p):
    
    genes = p.get('genes')
    aspect = p.get('aspect')
    if genes is None or genes == '':
        return { " ERROR": "NO GENE NAME PASSED IN" }
    if aspect is None or aspect == '':
        aspect = 'F'

    ## add code later to handle pvalue + exclude evidence list etc
    url = gotools_url + "?aspect=" + aspect + "&genes=" + genes 

    res = _get_json_from_server(url)

    htmlUrl = res['html']
    rootUrl = res['rootUrl']
    imageHtmlUrl = res['imageHtml']

    # <center><img src='./11519.png' usemap='#goPathImage'></center><p>
    # <html><body>
    # </body></html>

    response = urlopen(imageHtmlUrl)
    imageHtml = response.read()
    imageHtml = imageHtml.replace("<html><body>", "").replace("</body></html>", "")
    imageHtml = imageHtml.replace("<img src='./", "<img src='" + rootUrl + "/")
    
    response = urlopen(htmlUrl)
    html = response.read() 
    html = html.replace("<html><body>", "").replace("</body></html>", "")
    
    return { "html": html,
             "image_html": imageHtml,
             "tab_page": res['tab'],
             "term_page": res['terms'],
             "image_page": res['imageHtml'],
             "table_page": res['html'] }
             

def _get_json_from_server(url):
    
    try:
        req = Request(url)
        res = urlopen(req)
        data = json.loads(res.read())
        return data
    except HTTPError:
        return 404

