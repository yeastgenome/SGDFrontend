from elasticsearch import Elasticsearch
from multiprocessing import Process
from time import sleep
from random import shuffle
import requests
from collections import OrderedDict
import os

es = Elasticsearch(os.environ['ES_URI'], retry_on_timeout=True)

INDEX_NAME = 'sequence_objects'
DOC_TYPE = 'sequence_object'
BASE_URL = 'http://yeastgenome.org'
ALIGNMENT_URL = BASE_URL + '/webservice/alignments'
LOCUS_BASE_URL = BASE_URL + '/webservice/locus/'
FILTERED_GO_TERMS = ['biological process', 'cellular component', 'molecular function']
NUM_THREADS = 4

RESET_INDEX = False
IGNORE_IF_EXISTS = True

def setup_index():
    exists = es.indices.exists(INDEX_NAME)
    if RESET_INDEX and exists:
        es.indices.delete(INDEX_NAME)
    exists = es.indices.exists(INDEX_NAME)
    if not exists:
        es.indices.create(INDEX_NAME)
        put_mapping()
    return

def put_mapping():
    other_mapping_settings = {
        'properties': {
            'contig_name': {
                'type': 'string',
                'index': 'not_analyzed'
            }
        }
    }
    full_settings = {}
    full_settings[DOC_TYPE] = other_mapping_settings
    es.indices.put_mapping(index=INDEX_NAME, body=full_settings, doc_type=DOC_TYPE)

def add_go_term_from_obj(go_overview_obj, key, lst):
    for term in go_overview_obj[key]:
	trm = term['term']['display_name']
	if trm not in FILTERED_GO_TERMS:
	    lst.append(trm)
    return lst

# split list into num lists of roughly equal size
def chunk_list(seq, num):
    avg = len(seq) / float(num)
    out = []
    last = 0.0

    while last < len(seq):
	out.append(seq[int(last):int(last + avg)])
	last += avg

    return out

def aligned_sequence_to_snp_sequence(aligned_sequence_obj, variants):
    aligned_sequence = aligned_sequence_obj['sequence']
    snp_sequence = ''
    # add SNP chars to snp_sequence
    for var in variants:
        if var['variant_type'] == 'SNP':
            start = int(var['start']) - 1
            end = int(var['end']) - 1
            snp = aligned_sequence[start:end]
            snp_sequence = snp_sequence + snp
        else:
            start = int(var['start']) - 1
            end = start + 1
            snp = aligned_sequence[start:end]
            snp_sequence = snp_sequence + snp

    obj = {
        'name': aligned_sequence_obj['strain_display_name'],
        'id': aligned_sequence_obj['strain_id'],
        'snp_sequence': snp_sequence
    }
    return obj

def fetch_and_index_locus(locus, name):
    if IGNORE_IF_EXISTS:
        try:
            exists = es.get(index=INDEX_NAME, doc_type=DOC_TYPE, id=locus['sgdid'], _source=['name'])
            if exists:
                return
        except:
            pass
        
    overview_url = '/locus/' +  locus['sgdid'] + '/overview'
    
    basic_response_url = BASE_URL + '/webservice' + overview_url
    basic_response = requests.get(basic_response_url).json()

    go_terms = []
    go_overview = basic_response['go_overview']
    go_terms = add_go_term_from_obj(go_overview, 'manual_biological_process_terms', go_terms)
    go_terms = add_go_term_from_obj(go_overview, 'htp_biological_process_terms', go_terms)
    go_terms = add_go_term_from_obj(go_overview, 'manual_cellular_component_terms', go_terms)
    go_terms = add_go_term_from_obj(go_overview, 'htp_cellular_component_terms', go_terms)
    go_terms = add_go_term_from_obj(go_overview, 'manual_molecular_function_terms', go_terms)
    go_terms = add_go_term_from_obj(go_overview, 'htp_molecular_function_terms', go_terms)

    alignment_show_url = ALIGNMENT_URL + '/' + locus['sgdid']
    alignment_response = requests.get(alignment_show_url).json()

    seq_details_url = LOCUS_BASE_URL + locus['sgdid'] + '/sequence_details'
    seq_details_response = requests.get(seq_details_url).json()
    
    ref_obj = filter(lambda x: x['strain']['status'] == 'Reference', seq_details_response['genomic_dna'])[0]
    chrom_start = ref_obj['start']
    chrom_end = ref_obj['end']
    contig_data = seq_details_response['genomic_dna'][0]['contig']
    contig_name = contig_data['format_name'].replace('_', ' ')
    contig_href = contig_data['link']
    intron_data = format_introns(seq_details_response)

    domain_url = 'http://yeastgenome.org/webservice/locus/' + locus['sgdid'] + '/protein_domain_details'
    domain_response = requests.get(domain_url).json()
    formatted_domains = format_domains(domain_response)

    locus['contig_name'] = contig_name
    locus['chrom_start'] = chrom_start
    _absolute_genetic_start = get_absolute_genetic_start(locus)

    if 'protein_length' in alignment_response.keys():
        _protein_length = alignment_response['protein_length']
    else:
        _protein_length = 0

    if 'variant_data_dna' in alignment_response.keys():
        _variant_data_dna = alignment_response['variant_data_dna']
    else:
        _variant_data_dna = []

    if 'variant_data_protein' in alignment_response.keys():
        _variant_data_protein = alignment_response['variant_data_protein']
    else:
        _variant_data_protein = []

    dna_seqs = alignment_response['aligned_dna_sequences']
    snp_seqs = [aligned_sequence_to_snp_sequence(seq, _variant_data_dna) for seq in dna_seqs]

    body = {
        'sgdid': locus['sgdid'],
        'name': name,
        'format_name': basic_response['format_name'],
        'category': 'locus',
        'url': basic_response['link'],
        'href': basic_response['link'],
        'absolute_genetic_start': _absolute_genetic_start,
        'description': basic_response['headline'],
        'strand': seq_details_response['genomic_dna'][0]['strand'],
        'go_terms': go_terms,
        'dna_scores': locus['dna_scores'],
        'protein_scores': locus['protein_scores'],
        'aligned_dna_sequences': alignment_response['aligned_dna_sequences'],
        'aligned_protein_sequences': alignment_response['aligned_protein_sequences'],
        'dna_length': alignment_response['dna_length'],
        'protein_length': _protein_length,
        'variant_data_dna': _variant_data_dna,
        'variant_data_protein': _variant_data_protein,
        'protein_domains': formatted_domains,
        'snp_seqs': snp_seqs,
        'chrom_start': chrom_start,
        'chrom_end': chrom_end,
        'contig_name': contig_name,
        'contig_href': contig_href,
        'block_starts': intron_data['block_starts'],
        'block_sizes': intron_data['block_sizes']
    }

    es.index(index=INDEX_NAME, doc_type=DOC_TYPE, id=locus['sgdid'], body=body)

def get_absolute_genetic_start(locus):
    CONTIG_LENGTHS = OrderedDict([
        ('I', 230218),
        ('II', 813184),
        ('III', 316620),
        ('IV',  1531933),
        ('V', 576874),
        ('VI', 270161),
        ('VII', 1090940),
        ('VIII', 562643),
        ('IX', 439888),
        ('X', 745751),
        ('XI', 666816),
        ('XII', 1078177),
        ('XIII', 924431),
        ('XIV', 784333),
        ('XV', 1091291),
        ('XVI', 94806),
        ('Mito', 85779),
        ('2-micron', 6318)
    ])
    contig_numeral = locus['contig_name'].split(' ')[1]
    contig_index = CONTIG_LENGTHS.keys().index(contig_numeral)
    absolute_genetic_start = 0
    for contig in CONTIG_LENGTHS.keys():

        if contig == contig_numeral:
            break
        absolute_genetic_start += CONTIG_LENGTHS[contig]
    absolute_genetic_start += locus['chrom_start']
    return absolute_genetic_start

def format_introns(raw_sequence_data):
    _block_starts = []
    _block_sizes = []
    tags = raw_sequence_data['genomic_dna'][0]['tags']
    for tag in tags:
        if tag['format_name'] == 'CDS':
            _block_starts.append(tag['relative_start'] - 1)
            _block_sizes.append(tag['relative_end'] - tag['relative_start'] + 1)
    obj = {
        'block_starts': _block_starts,
        'block_sizes': _block_sizes
    }
    return obj

# translate from SGD API domain format to format expected by SGD viz
def format_domains(raw_domain_data):
    formatted = []
    for domain in raw_domain_data:
        if domain['strain']['display_name'] == 'S288C':
            obj = {
                'name': domain['domain']['display_name'],
                'id': domain['domain']['id'],
                'href': domain['domain']['link'],
                'sourceName': domain['source']['display_name'],
                'sourceId': domain['source']['id'],
                'start': domain['start'],
                'end': domain['end']
            }
            formatted.append(obj)
    return formatted

def index_set_of_loci(loci):
    for locus in loci:
        try:
            exists = es.get(index=INDEX_NAME, doc_type=DOC_TYPE, id=locus['sgdid'])
            if exists:
                next
        except:
            fetch_and_index_locus(locus, locus['display_name'])

def index_loci():
    raw_alignment_data = requests.get(ALIGNMENT_URL).json()
    
    loci = raw_alignment_data['loci']

    print "Indexing " + str(len(loci)) + " genes for variant viewer"

    for l in loci:
        fetch_and_index_locus(l, l['display_name'])

#setup_index()
index_loci()
