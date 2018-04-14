import json
from pyramid.response import Response
from urllib2 import Request, urlopen, URLError

seq_url = "https://www.yeastgenome.org/backend/locus/_REPLACE_NAME_HERE_/sequence_details"
contig_url = "https://www.yeastgenome.org/backend/contig/_REPLACE_CONTIG_NAME_HERE_"

def do_seq_analysis(request):

    p = dict(request.params)

    if p.get('chr'):
        data = get_sequence_for_chr(p)
        return Response(body=json.dumps(data), content_type='application/json')

    if p.get('seq'):
        data = manipulate_sequence(p)
        return Response(body=json.dumps(data), content_type='application/json')

    data = get_sequence_for_genes(p)
    return Response(body=json.dumps(data), content_type='application/json')


def get_sequence_for_chr(p):

    # http://0.0.0.0:6545/run_seqtools?chr=6&start=54696&end=53260

    chr = p.get('chr')
    strand = '+'
    start = p.get('start')
    end = p.get('end')
    if start is not None:
        start = int(start)
    else:
        start = 1
    if end is not None:
        end = int(end)
    else:
        end = 10000000 # get a whole chr seq
    if start > end:
        (start, end) = (end, start)
        strand = '-'
    contig = _map_contig_name_for_chr(chr)
    seq = _get_sequence_from_contig(contig, start, end, strand)

    return { "seq": seq }
    
def get_sequence_for_genes(p):

    genes = p.get('genes')
    strains = p.get('strains')
    if strains is None:
        strains = 'S288C'
    if genes is None:
        return { "ERROR": "NO GENE NAME PASSED IN" }
    genes = genes.split(':')
    strains = strains.split(':')
    type = p.get('type')
    up = p.get('up')
    down = p.get('down')
    if up is None:
        up = 0
    if down is None:
        down = 0
    if up == 0 and down == 0:
        return _get_genomic_or_protein_seq(genes, strains, type)

    return _get_genomic_with_up_down_seq(genes, strains, up, down)


def manipulate_sequence(p):                                                                                                                
    # http://0.0.0.0:6545/run_seqtools?seq=ATGGATTCTGGTATGTTCTAGCGCTTGCACCATCCCATTTAACTGTAA&rev=1

    seq = p.get('seq')
    rev = p.get('rev')
    if rev is not None:
        seq = _reverse_complement(seq)
    return { 'seq': seq }

    ## do more stuff here



def _get_sequence_from_contig(contig, start, end, strand):

    url = contig_url.replace("_REPLACE_CONTIG_NAME_HERE_", contig)
    res = _get_json_from_server(url)
    contig_name = res['display_name']
    contig_seq = res['residues']
    seq = contig_seq[start-1:end]
    if strand == '-':
        seq = _reverse_complement(seq)
    return seq


def _get_genomic_or_protein_seq(genes, strains, type):

    # http://0.0.0.0:6545/run_seqtools?genes=ACT1:BUD2&strains=W303:S288C&type=nuc
    # http://0.0.0.0:6545/run_seqtools?genes=ACT1:BUD2&strains=W303:S288C

    data = {}
    for name in genes:
        name = name.replace("SGD:", "")
        url = seq_url.replace("_REPLACE_NAME_HERE_", name)
        res = _get_json_from_server(url)

        rows = []
        if type in ['nuc', 'dna']:
            rows = res['genomic_dna']
        else:
            rows = res['protein']

        for row in rows:
            strain = row['strain']
            if strain['display_name'] in strains:
                seq = row['residues']
                key = name + ":" + strain['display_name']
                data[key] = seq
                
    return data


def _get_genomic_with_up_down_seq(genes, strains, up, down):

    # http://0.0.0.0:6545/run_seqtools?genes=ACT1:BUD2&strains=W303:S288C&type=nuc&up=10&down=10

    contig_coordinate_data = _get_contig_coordinates(genes, strains)

    data = {}
    for (name, strain) in contig_coordinate_data:
        (start, end, strand, contig, format_name, gene_name, headline, sgdid) = contig_coordinate_data[(name, strain)]

        up_bp = int(up)
        down_bp = int(down)
        if strand == '-':
            (up_bp, down_bp) = (down_bp, up_bp)
        start = start - up_bp
        end = end + down_bp

        seq = _get_sequence_from_contig(contig, start, end, strand)
        
        data[name + ':' + strain] = seq 

    return data


def _get_contig_coordinates(genes, strains):

    data = {}

    for name in genes:
        name = name.replace("SGD:", "")
        url = seq_url.replace("_REPLACE_NAME_HERE_", name)
        res = _get_json_from_server(url)
        rows = res['genomic_dna']
        for row in rows:
            strain = row['strain']
            if strain['display_name'] in strains:
                strain_name = strain['display_name']
                start = row['start']
                end = row['end']
                strand = row['strand']
                contig = row['contig']['format_name']
                locus = row['locus']
                format_name = locus['format_name']
                gene_name = locus.get('display_name')
                headline = locus.get('headline')
                sgdid = locus['link'].replace("/locus/", "")

                data[(name, strain_name)] = (start, end, strand, contig, format_name, gene_name, headline, sgdid)

    return data


def _reverse_complement(seq):

    complement = {'A': 'T', 'C': 'G', 'G': 'C', 'T': 'A'}
    bases = list(seq)
    bases = reversed([complement.get(base,base) for base in bases])
    bases = ''.join(bases)
    return bases


def _get_json_from_server(url):

    # print "URL: ", url

    req = Request(url)
    res = urlopen(req)
    data = json.loads(res.read())
    return data
             
def _map_contig_name_for_chr(chr):
    
    chr_to_contig_chrom = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', 
                            '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
                            '11': 'XI', '12': 'XII', '13': 'XIII', '14': 'XIV',
                            '15': 'XV', '16': 'XVI', '17': 'Mito' }

    if chr in chr_to_contig_chrom:
        return 'Chromosome_' + chr_to_contig_chrom[chr]
    return chr
