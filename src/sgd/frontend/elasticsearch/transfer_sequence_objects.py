from elasticsearch import helpers
from elasticsearch import Elasticsearch

SRC_CLIENT_ADDRESS = 'http://localhost:9200'
TARGET_CLIENT_ADDRESS = 'http://localhost:9200'
SRC_INDEX = 'sequence_objects6'
TARGET_INDEX = 'sequence_objects'
DOC_TYPE = 'sequence_object'

RESET_INDEX = False

src_client = Elasticsearch(SRC_CLIENT_ADDRESS)
target_client = Elasticsearch(TARGET_CLIENT_ADDRESS)

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
	target_client.indices.put_mapping(index=TARGET_INDEX, body=full_settings, doc_type=DOC_TYPE)

def setup_index():
    exists = target_client.indices.exists(TARGET_INDEX)
    if RESET_INDEX and exists:
        target_client.indices.delete(TARGET_INDEX)
    exists = target_client.indices.exists(TARGET_INDEX)
    if not exists:
        target_client.indices.create(TARGET_INDEX)
        put_mapping()
    return

def transfer():
	# transfer sequence objects between clusters or index based on statics
	helpers.reindex(client=src_client, source_index=SRC_INDEX, target_index=TARGET_INDEX, target_client=target_client)

def main():
	setup_index()
	transfer()

main()
