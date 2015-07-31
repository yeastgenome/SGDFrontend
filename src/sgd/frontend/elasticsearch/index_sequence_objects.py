from elasticsearch import Elasticsearch
from multiprocessing import Process
import requests
es = Elasticsearch()

INDEX_NAME = 'sequence_objects'
DOC_TYPE = 'sequence_object'
BASE_URL = 'http://sgd-qa.stanford.edu'
ALIGNMENT_URL = BASE_URL + '/webservice/alignments'
LOCUS_BASE_URL = BASE_URL + '/webservice/locus/'
FILTERED_GO_TERMS = ['biological process', 'cellular component', 'molecular function']
NUM_THREADS = 10

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

def index_set_of_loci(loci, process_index):
	# index loci
	print 'indexing list of ' + str(len(loci)) + ' loci'
	for locus in loci:
		# set name
		if locus['display_name'] == locus['format_name']:
			name = locus['display_name']
		else:
			name = str(locus['display_name']) + ' / ' + str(locus['format_name'])

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

		# get domains
		domain_url = LOCUS_BASE_URL + locus['sgdid'] + '/protein_domain_details'
		# domain_response = requests.get(domain_url).json()

		# format obj and index
		body = {
			'sgdid': locus['sgdid'],
			'name': name,
			'category': 'locus',
			'url': locus['link'],
			'description': locus['headline'],
			'go_terms': go_terms,
			'dna_scores': locus['dna_scores']
		}
		es.index(index=INDEX_NAME, doc_type=DOC_TYPE, id=locus['sgdid'], body=body)

def index_loci():
	# get list of genes from alignment webservice
	print '*** FETCHING ALL LOCI ***'
	raw_alignment_data = requests.get(ALIGNMENT_URL).json()
	loci = raw_alignment_data['loci']

	# split into chunks for parallel processing
	chunked_loci = chunk_list(loci, NUM_THREADS)
	processes = []
	i = 0
	for chunk in chunked_loci:
		p = Process(target=index_set_of_loci, args=(chunk, i))
		i += 1
		p.start()
		processes.append(p)

	for p in processes:
		p.join()

def main():
	# reset_index()
	index_loci()

main()
