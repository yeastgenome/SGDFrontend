import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib2 import Request, urlopen, URLError

patmatch_url = "http://patmatch.dev.yeastgenome.org/"
               
def do_patmatch(request):

    p = dict(request.params)

    if p.get('conf'):
        data = _get_config(p.get('conf'))
        return Response(body=json.dumps(data), content_type='application/json')
        
    data = _run_patmatch(p)

    return Response(body=json.dumps(data), content_type='application/json')

def _run_patmatch(p):

    from urllib2 import Request, urlopen, URLError

    paramData = _construct_patmatch_parameters(p)

    # url = config.patmatch_url + "cgi-bin/aws-patmatch"
    url = patmatch_url + "cgi-bin/aws-patmatch" 

    req = Request(url=url, data=paramData)

    res = urlopen(req)

    result = res.read()

    dataSet = result.split("\t")
    
    if dataSet[1]:
        data = { "result": dataSet[0],
                 "hits":   json.loads(dataSet[1]),
                 "totalHits": dataSet[2],
                 "showHits": dataSet[3]}
    else:
        data = { "result": dataSet[0],
                 "hits": "",
                 "totalHits": 0,
                 "showHits": 0}

    return data

def _construct_patmatch_parameters(p):

    insertion = p.get('insertion') if p.get('insertion') else 0 
    deletion = p.get('deletion') if p.get('deletion') else 0
    substitution = p.get('substitution') if p.get('substitution') else 0
    
    if strand.startswith('Both'):
        strand = 'both'
    elif strand.startswith('Reverse'):
        strand = 'crick'
    else:
        strand = 'watson'

    import urllib
    
    paramData = urllib.urlencode({ 'pattern': p.get('pattern'),
                                   'strain': p.get('strain'),
                                   'seqtype': p.get('seqtype'),
                                   'dataset': p.get('dataset'),
                                   'maxhits': p.get('maxhits'),
                                   'strand': strand,
                                   'mismatch': p.get('mismatch'),
                                   'insertion': insertion,
                                   'deletion': deletion,
                                   'substitution': substitution })
    return paramData


def _get_config(conf):

    test_data = {
        'genome': [
            {
                'strain': 'S288C',
                'label':  'S. cerevisiae Reference Strain S288C'
                },
            {
                'strain': 'AWRI1631_AWRI_2008_ABSV01000000',
                'label':  'S. cerevisiae Strain AWRI1631_ABSV01000000 (AWRI)'
                },
            {
                'strain': 'AWRI796_AWRI_2010_ADVS01000000',
                'label':  'S. cerevisiae Strain AWRI796_ADVS01000000 (AWRI)'
                },
            {
                'strain': 'BC187_Stanford_2014_JRII00000000',
                'label':  'S. cerevisiae Strain BC187_JRII00000000 (Stanford)'
                },
            {
                'strain': 'BY4741_Stanford_2014_JRIS00000000',
                'label':  'S. cerevisiae Strain BY4741_JRIS00000000 (Stanford)'
                }
            ]
    }

    # return test_data

    # url = config.patmatch_url + "patmatch/" + conf
    # url = patmatch_url + "patmatch/patmatch.json"
    url = "https://blast.yeastgenome.org/blast/blast-sgd.json"

    req = Request(url)
    res = urlopen(req)
    data = json.loads(res.read())

    return { "genome": [ { "strain": "S288C", 
                           "label": url }, 
                         { 'strain': 'BY4741_Stanford_2014_JRIS00000000',
                           'label':  req },
                         { 'strain': "W303",
                           'label': res }
                    ]
             }
 
    return data


             

