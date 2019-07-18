import json
from pyramid.response import Response
from src.sgd.frontend import config
from urllib.request import Request, urlopen
from urllib.error import URLError
from urllib.parse import urlencode

compute_url = "https://blast.yeastgenome.org/"

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

    paramData = _construct_blast_parameters(p)

    url = compute_url + "cgi-bin/aws-blast"

    req = Request(url=url, data=paramData.encode('utf-8'))

    res = urlopen(req)

    result = res.read().decode('utf-8')

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

def _construct_blast_parameters(p):

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

    database = database.replace(',', ' ')
    database = database.replace('  ', ' ')
    database = database.replace(' ', '+')

    blastOptions = blastOptions.replace(' ', '+')
    
    paramData = urlencode({ 'program': program,
                            'dataset': database,
                            'sequence': seq,
                            'seqname': seqname,
                            'config': confFile,
                            'options': blastOptions,
                            'filtering': filtering,
                            'alignToShow': p['alignToShow'] })
    return paramData

    
def _get_seq(name, type):

    data = {}
    if type == None or type == '' or type == 'undefined':
        type = 'dna'

    url = config.backend_url + "/locus/" + name + "/sequence_details"
    res = _get_json_from_server(url)
    
    rows = []
    if type in ('nuc', 'dna'):
        rows = res['genomic_dna']
    else:
        rows = res['protein']
        
    for row in rows:
        strain = row['strain']
        if strain['display_name'] == 'S288C':
            data['seq'] = row['residues']
    
    return data


def _get_config(conf):

    url = compute_url + "blast/" + conf + ".json"
    data = _get_json_from_server(url)
    
    return data


def _get_json_from_server(url):

    req = Request(url)
    res = urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
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
    
    options = "-evalue " + cutoffScore + " -num_alignments " + alignToShow 

    if (database == 'Sc_mito_chr' and (program == 'blastn' or program == 'tblastx')):
        # default is 1                      
        options = options + " -query_genetic_code 3"

    if program != 'blastn' and threshold and threshold != 'default':
        options = options + " -threshold " + threshold

    if program != 'blastn' and matrix != "BLOSUM62":
        options = options + " -matrix " + matrix
                
    if wordLength != 'default':
        options = options + " -word_size " + wordLength
    else:
        if program == 'blastn':
            options = options + " -word_size 11"
        else:
            options = options + " -word_size 3"

    # options = options + " -outfmt 0 -html"

    options = options + " -outfmt 0"

    if outFormat.startswith("ungapped"):
        options = options + " -ungapped"

    # blastn: DUST and is on by default
    # blastp: SEG and is off by default
    # blastx: SEG and is on by default
    # tblastx: SEG and is on by default
    # tblastn: SEG and is on by default
    if filter == 'on':
        if program == 'blastp':
            options = options + " -seg yes"
    else:
        if program == 'blastn':
            options = options + " -dust 'no'"
        elif program != 'blastp':
            options = options + " -seg 'no'"
            
    return options;
    
