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
    
    genes = p.get('genes', '')
    aspect = p.get('aspect', 'F')
    if genes == '':
        return { " ERROR": "NO GENE NAME PASSED IN" }
    genes4bg = p.get('genes4bg', '')
    pvalue = p.get('pvalue', '0.01')
    FDR = p.get('FDR', 0)
    evidence = p.get('evidence', '')
        
    ## add code later to handle pvalue + exclude evidence list etc
    # url = gotools_url + "?aspect=" + aspect + "&genes=" + genes 

    import urllib

    paramData = urllib.urlencode({ 'genes': genes,
                                   'genes4bg': genes4bg,
                                   'aspect': aspect,
                                   'pvalue': pvalue,
                                   'FDR': FDR,
                                   'evidenceToExclude': evidence });
    
    res = _get_json_from_server(gotools_url, paramData)

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
    imageHtml = "<br><br><b><Nodes" + imageHtml.split("</font><br><br><b>Nodes")[1]
    
    response = urlopen(htmlUrl)
    html = response.read() 
    html = html.replace("<html><body>", "").replace("</body></html>", "")
    
    return { "html": html,
             "image_html": imageHtml,
             "tab_page": res['tab'],
             "term_page": res['terms'],
             "image_page": res['imageHtml'],
             "table_page": res['html'] }
             

def _get_json_from_server(url, paramData):
    
    try:
        req = Request(url=url, data=paramData)
        res = urlopen(req)
        data = json.loads(res.read())
        return data
    except HTTPError:
        return 404

