from elasticsearch import helpers
from elasticsearch import Elasticsearch
from collections import OrderedDict

CLIENT_ADDRESS = 'http://localhost:9200'
INDEX = 'sequence_objects5'
DOC_TYPE = 'sequence_object'
RESET_INDEX = False
# TEMP, trigger runscope test, should be ENV var with default to False
TEST = False
RUNSCOPE_TRIGGER_URL = ''

es = Elasticsearch(CLIENT_ADDRESS)

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

def setup_index():
	exists = es.indices.exists(INDEX)
	if RESET_INDEX and not exists:
		es.indices.delete(INDEX)
		es.indices.create(INDEX)
	elif not exists:
		es.indices.create(INDEX)
	put_mapping()

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
	es.indices.put_mapping(index=INDEX, body=full_settings, doc_type=DOC_TYPE)

def index_locus(old_data):
	# # add absolute_genetic_start
	# contig_numeral = old_data['contig_name'].split('_')[1]
	# contig_index = CONTIG_LENGTHS.keys().index(contig_numeral)
	# _absolute_genetic_start = 0
	# for contig in CONTIG_LENGTHS.keys():

	# 	if contig == contig_numeral:
	# 		break
	# 	_absolute_genetic_start += CONTIG_LENGTHS[contig]
	# _absolute_genetic_start += old_data['chrom_start']

	_contig_name = old_data['contig_name'].replace('_', ' ')
	print _contig_name

	# assign new data
	old_data['contig_name'] = _contig_name
	# es.index(index=INDEX, doc_type=DOC_TYPE, id=old_data['sgdid'], body=old_data)
	return

# fetch all the loci, index in index_locus
def index_loci():
	# fetch all
	body = { 'query': { 'match_all': { }}}
	res = es.search(index=INDEX, body=body, size=10)
	for hit in res['hits']['hits']:
		data = hit['_source']
		index_locus(data)

def main():
	setup_index()
	index_loci()
	# index_test_locus()

	if TEST:
		requests.get(RUNSCOPE_TRIGGER_URL)
main()
