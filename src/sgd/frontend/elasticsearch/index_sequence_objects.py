from elasticsearch import Elasticsearch
import multiprocessing
import requests
es = Elasticsearch()

INDEX_NAME = 'sequence_objects'
DOC_TYPE = 'sequence_object'
ALIGNMENT_URL = 'http://yeastgenome.org/webservice/alignments'
LOCUS_BASE_URL = 'http://yeastgenome.org/webservice/locus/'
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

def index_set_of_loci(loci):
	# index loci
	print '*** INDEXING ALL LOCI ***'
	i = 0
	for locus in loci:
		# set name
		if locus['display_name'] == locus['format_name']:
			name = locus['display_name']
		else:
			name = str(locus['display_name']) + ' / ' + str(locus['format_name'])

		# fetch basic data
		print 'fetching ' + name
		basic_url = LOCUS_BASE_URL + locus['sgdid'] + '/overview'
		basic_response = requests.get(basic_url).json()

		# add raw GO term (strings) to indexed obj
		go_terms = []
		go_overview = basic_response['go_overview']
		go_terms = add_go_term_from_obj(go_overview, 'manual_biological_process_terms', go_terms)
		go_terms = add_go_term_from_obj(go_overview, 'htp_biological_process_terms', go_terms)
		go_terms = add_go_term_from_obj(go_overview, 'manual_cellular_component_terms', go_terms)
		go_terms = add_go_term_from_obj(go_overview, 'htp_biological_process_terms', go_terms)
		go_terms = add_go_term_from_obj(go_overview, 'manual_molecular_function_terms', go_terms)
		go_terms = add_go_term_from_obj(go_overview, 'htp_biological_process_terms', go_terms)

		# get domains
		domain_url = LOCUS_BASE_URL + locus['sgdid'] + '/protein_domain_details'
		domain_response = requests.get(domain_url).json()

		body = {
			'sgdid': locus['sgdid'],
			'name': name,
			'category': 'locus',
			'url': locus['link'],
			'description': locus['headline'],
			'go_terms': go_terms
		}

def index_loci():
	# get list of genes from alignment webservice
	print '*** FETCHING ALL LOCI ***'
	raw_alignment_data = requests.get(ALIGNMENT_URL).json()
	loci = raw_alignment_data['loci']

	# split into chunks for pooling
	index_set_of_loci(loci[:100]) # TEMP just 100



		
		# es.index(index=INDEX_NAME, doc_type=DOC_TYPE, id=i, body=body)
		# i += 1

def main():
	reset_index()
	index_loci()

main()