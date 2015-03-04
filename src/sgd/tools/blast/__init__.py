import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib2 import Request, urlopen, URLError

def do_blast(request):
    
    p = dict(request.params)

    if p.get('name'):
        data = _get_seq(p.get('name'), p.get('type'))
        return Response(body=json.dumps(data), content_type='application/json')

    if p.get('conf'):
        data = _get_config(p.get('conf')) 
        return Response(body=json.dumps(data), content_type='application/json')
        
    data = _run_blast(p)

    return Response(body=json.dumps(data), content_type='application/json')


def _run_blast(p):

    from urllib2 import Request, urlopen, URLError

    url = _construct_blast_url(p)
    
    req = Request(url)

    res = urlopen(req)

    result = res.read()

    dataSet = result.split("\t")

    hits = json.loads(dataSet[1])

    data = { "result": dataSet[0],
             "hits": hits }

    return data


def _construct_blast_url(p):

    program = p.get('program')
    database = p.get('database')
    seq = p.get('seq')
    seqname = p.get('seqname')
    if seqname == None:
        seqname = ''
    confFile = 'blast-sgd.conf'
    if p.get('blastType') == 'fungal':
        confFile = 'blast-fungal.conf'
    filtering = 0
    if p.get(filter) == 'on':
        filtering = 1

    blastOptions = _get_blast_options(p)

    url = config.compute_url + "cgi-bin/blast2.pl?"

    database = database.replace(',', ' ');
    database = database.replace('  ', ' ');
    database = database.replace(' ', '+')

    blastOptions = blastOptions.replace(' ', '+')
    url = url + "program=" + program + "&dataset=" + database + "&sequence=" + seq + "&seqname=" + seqname + "&config=" + confFile + "&options=" + blastOptions + "&filtering=" + str(filtering)
    
    return url

    
def _get_seq(name, type):

    data = {}
    if type == None or type == '' or type == 'undefined':
        type = 'dna'

    url = config.backend_url + "/locus/" + name + "/sequence_details"
    res = _get_json_from_server(url)
    if type in ('nuc', 'dna'):
        data['seq'] = res['genomic_dna'][0]['residues']
    else:
        data['seq'] = res['protein'][0]['residues']
        
    return data


def _get_config(conf):

    url = config.compute_url + "blast/" + conf + ".json"
    data = _get_json_from_server(url)
    
    return data


def _get_json_from_server(url):

    req = Request(url)
    res = urlopen(req)
    data = json.loads(res.read())
    return data

def _get_blast_options(p):
    
    seq = p.get('seq')
    program = p.get('program')
    database = p.get('database')
    outFormat = p.get('outFormat')
    matrix = p.get('matrix')
    threshold = p.get('threshold')
    cutoffScore = p.get('cutoffScore')
    alignToShow = p.get('alignToShow')
    wordLength = p.get('wordLength')
    filter = p.get('filter')

    hspmax = 6000
    gapmax = 3000
    if len(seq) < 10000:
        if program == 'blastn':
            hspmax = 6000
            gapmax = 3000
        else:
            hspmax = 2000
            gapmax = 1000
    else:
        hspmax = 10000
        if program == 'blastn':
            gapmax = 3000
        else:
            gapmax = 1000
        
    otmp = ''
    if (database == 'Sc_mito_chr' and (program == 'blastn' or program == 'tblastx')):
        # default is 1
        otmp = " -dbgcode 3 "
   
                
    options = " -hspsepsmax=" + str(hspmax) + " -hspsepqmax=" + str(gapmax) + ' ' + otmp
               
    if threshold and threshold != 'default':
        options = options + " E=" + threshold
                    
    if cutoffScore and cutoffScore != 'default':
        options = options + " S=" + cutoffScore
    
    options = options + " B=" + alignToShow + " V=" + alignToShow

    if outFormat != "gapped alignments":
        options = options + " -nongap"
                   
    if program != 'blastn' and matrix != "BLOSUM62":
        options = options + " -matrix=" + matrix
                
    if wordLength != 'default':
        options = options + " -W=" + wordLength
                        
    if filter == 'on':
        if program != 'blastn':
            options = options + " -filter=seg"
        else:
            options = options + " -filter=dust"
    
    return options;

             

