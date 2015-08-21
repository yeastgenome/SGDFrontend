from elasticsearch import Elasticsearch
from multiprocessing import Process
from time import sleep
from random import shuffle
import requests
es = Elasticsearch()

INDEX_NAME = 'sequence_objects4'
DOC_TYPE = 'sequence_object'
BASE_URL = 'http://sgd-qa.stanford.edu'
ALIGNMENT_URL = BASE_URL + '/webservice/alignments'
LOCUS_BASE_URL = BASE_URL + '/webservice/locus/'
FILTERED_GO_TERMS = ['biological process', 'cellular component', 'molecular function']
NUM_THREADS = 5

def reset_index():
	exists = es.indices.exists(INDEX_NAME)
	if exists:
		es.indices.delete(INDEX_NAME)
	es.indices.create(INDEX_NAME)

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

    obj = {
        'name': aligned_sequence_obj['strain_display_name'],
        'id': aligned_sequence_obj['strain_id'],
        'snp_sequence': snp_sequence
    }
    return obj

def fetch_and_index_locus(locus, name, process_index):
    # fetch basic data
    print 'fetching ' + name + ' on thread ' + str(process_index)
    basic_url = LOCUS_BASE_URL + locus['sgdid'] + '/overview'
    basic_response = requests.get(basic_url).json()

    # add raw GO term (strings) to indexed obj
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
    dna_seqs = alignment_response['aligned_dna_sequences']
    snp_seqs = [aligned_sequence_to_snp_sequence(seq, alignment_response['variant_data_dna']) for seq in dna_seqs]

    # get sequence details for chromStart, chromEnd, contig, and introns
    # TEMP, just chromStart and chromEnd
    seq_details_url = LOCUS_BASE_URL + locus['sgdid'] + '/sequence_details'
    seq_details_response = requests.get(seq_details_url).json()
    ref_obj = filter(lambda x: x['strain']['status'] == 'Reference', seq_details_response['genomic_dna'])[0]
    chrom_start = ref_obj['start']
    chrom_end = ref_obj['end']
    contig_name = ref_obj['contig']['format_name']

    # TEMP don't do this, yet
    # # get domains
    # domain_url = LOCUS_BASE_URL + locus['sgdid'] + '/protein_domain_details'
    # domain_response = requests.get(domain_url).json()

    # format obj and index
    body = {
      'sgdid': locus['sgdid'],
      'name': locus['display_name'],
      'format_name': locus['format_name'],
      'category': 'locus',
      'url': locus['link'],
      'description': locus['headline'],
      'go_terms': go_terms,
      'dna_scores': locus['dna_scores'],
      'snp_seqs': snp_seqs,
      'chrom_start': chrom_start,
      'chrom_end': chrom_end,
      'contig_name': contig_name
    }
    es.index(index=INDEX_NAME, doc_type=DOC_TYPE, id=locus['sgdid'], body=body)

def index_set_of_loci(loci, process_index):
    shuffle(loci)
    try:
        # index loci
        print 'indexing list of ' + str(len(loci)) + ' loci'
        for locus in loci:
            # set name
            if locus['display_name'] == locus['format_name']:
            	name = locus['display_name']
            else:
            	name = str(locus['display_name']) + ' / ' + str(locus['format_name'])

            # see if exists
            exists = es.exists(index=INDEX_NAME, doc_type=DOC_TYPE, id=locus['sgdid'])
            # if not exists:
            fetch_and_index_locus(locus, name, process_index)

    except:
        print 'Unexpected Error'
        raise

def index_loci():
    # get list of genes from alignment webservice
    print '*** FETCHING ALL LOCI ***'
    raw_alignment_data = requests.get(ALIGNMENT_URL).json()
    loci = raw_alignment_data['loci']

    # split into chunks for parallel processing
    chunked_loci = chunk_list(loci, NUM_THREADS)

    # split work into processes
    processes = {}
    i = 0
    for chunk in chunked_loci:
        p = Process(target=index_set_of_loci, args=(chunk, i))
        p.start()
        processes[i] = p # Keep the process and the app to monitor or restart
        i += 1

    while len(processes) > 0:
        for n in processes.keys():
            p = processes[n]
            sleep(0.5)
            print ('inspect process ', p.exitcode, p.is_alive())
            # if p.exitcode is None and not p.is_alive(): # Not finished and not running
            #     print 'process died, restarting'
            #     p.start()
            #     processes[i] = p
            # elif p.exitcode is None:
            #    still going
            if p.exitcode > 0 and not p.is_alive():
                print 'process died, need to restart' # ? TODO
            else:
                p.join() # Allow tidyup
                del processes[n] # Removed finished items from the dictionary 
                # When none are left then loop will end

def main():
    # reset_index()
    index_loci()

main()
