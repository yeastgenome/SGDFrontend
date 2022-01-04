import json
from pyramid.response import Response
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import os

# http://0.0.0.0:6545/run_gotools?aspect=C&genes=COR5|CYT1|Q0105|QCR2|S000001929|S000002937|S000003809|YEL024W|YEL039C|YGR183C|YHR001W-A

gotermfinder_url = "https://gotermfinder.yeastgenome.org/cgi-bin/gotermfinder"

goslimmapper_url = "https://gotermfinder.yeastgenome.org/cgi-bin/goslimmapper"

# http://gotermfinder.yeastgenome.org/cgi-bin/gotermfinder?aspect=F&genes=COR5|CYT1|Q0105|QCR2|S000001929|S000002937|S000003809|YEL024W|YEL039C|YGR183C|YHR001W-A

def do_gosearch(request):

    p = dict(request.params)

    data = {}
    if p.get('mapper'):
        data = run_goslimmapper(p)
    else:
        data = run_gotermfinder(p)
    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
 
def run_goslimmapper(p):

    genes = p.get('genes', '')
    if genes == '':
        return { " ERROR": "NO GENE NAME PASSED IN" }
    aspect = p.get('aspect', '')
    if aspect == '':
        return { " ERROR": "NO GO ASPECT PASSED IN" }
    terms = p.get('terms', '')
    if terms == '':
        return { " ERROR": "NO SLIM TERMS PASSED IN" }
    
    import urllib.request, urllib.parse, urllib.error

    paramData = urllib.parse.urlencode({ 'genes': genes,
                                         'terms': terms,
                                         'aspect': aspect });

    res = _get_json_from_server(goslimmapper_url, paramData)

    if res.get('output'):
        return { "output": res['output'] }

    htmlUrl = res['html']
    rootUrl = res['rootUrl']

    response = urlopen(htmlUrl)
    html = response.read().decode('utf-8')
    html = html.replace("<html><body>", "").replace("</body></html>", "")
    html = html.replace("<br><b>", "").replace("</b><br><br><center>", "<center>")
    html = html.replace("color=red", "color=maroon")
    html = html.replace("<td colspan=5>", "<td colspan=5 bgcolor='#FFCC99'>")
    html = html.replace("<font color=#FFFFFF>", "").replace("</font>", "")
    html = html.replace("<th align=center nowrap>", "<th bgcolor='#CCCCFF' align=center nowrap>")
    html = html.replace("<th align=center>", "<th bgcolor='#CCCCFF' align=center nowrap>")
    html = html.replace('<tr bgcolor="FFE4C4">', '')
    html = html.replace(' nowrap=""', '')
    html = html.replace('( ', '(')
    html = html.replace(' )', ')')
    
    # html = html.replace("http://amigo.geneontology.org/amigo/term/", "https://www.yeastgenome.org/go/")
    html = html.replace("infowin", "_extwin")

    return { "html": html,
             "tab_page": res['tab'],
             "term_page": res['terms'],
             "table_page": res['html'],
             "gene_input_page": res['gene_input'],
             "slim_input_page": res['slim_input'] }


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
    # url = gotermfinder_url + "?aspect=" + aspect + "&genes=" + genes 

    import urllib.request, urllib.parse, urllib.error

    paramData = urllib.parse.urlencode({ 'genes': genes,
                                         'genes4bg': genes4bg,
                                         'aspect': aspect,
                                         'pvalue': pvalue,
                                         'FDR': FDR,
                                         'evidence': evidence });
    
    res = _get_json_from_server(gotermfinder_url, paramData)

    if res.get('output'):
        return { "output": res['output'] }

    htmlUrl = res['html']
    rootUrl = res['rootUrl']
    imageHtmlUrl = res['imageHtml']

    response = urlopen(imageHtmlUrl)
    imageHtml = response.read().decode('utf-8')
    imageHtml = imageHtml.replace("<html><body>", "").replace("</body></html>", "")
    imageHtml = imageHtml.replace("<img src='./", "<img src='" + rootUrl + "/")
    imageHtml = "<b>Nodes" + imageHtml.split("</font><br><br><b>Nodes")[1]
    
    response = urlopen(htmlUrl)
    html = response.read().decode('utf-8')
    html = html.replace("<html><body>", "").replace("</body></html>", "")
    html = html.replace("color=red", "color=maroon")
    html = html.replace('<a name="table" />', '')
    html = html.replace("infowin", "_extwin")

    return { "html": html,
             "image_html": imageHtml,
             "tab_page": res['tab'],
             "term_page": res['terms'],
             "image_page": res['imageHtml'],
             "table_page": res['html'],
             "svg_page": res['svg'],
             "png_page": res['png'],
             "ps_page": res['ps'],
             "input_page": res['input'] }
             

def _get_json_from_server(url, paramData):
    
    try:
        req = Request(url=url, data=paramData.encode('utf-8'))
        res = urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        return data
    except HTTPError:
        return 404

