from elasticsearch import helpers
from elasticsearch import Elasticsearch

SRC_CLIENT_ADDRESS = 'http://localhost:9200'
TARGET_CLIENT_ADDRESS = 'http://localhost:9200'
SRC_INDEX = 'sequence_objects'
TARGET_INDEX = 'sequence_objects'

RESET_INDEX = False

src_client = Elasticsearch(SRC_CLIENT_ADDRESS)
target_client = Elasticsearch(TARGET_CLIENT_ADDRESS)

def put_settings():
	return

def setup_index():
	exists = target_client.indices.exists(TARGET_INDEX)
	if RESET_INDEX and exists:
		target_client.indices.delete(TARGET_INDEX)
	exists = target_client.indices.exists(TARGET_INDEX)
	if not exists:
		target_client.indices.create(TARGET_INDEX)
		put_settings()

def transfer():
	# transfer sequence objects between clusters or index based on statics
	helpers.reindex(client=src_client, source_index=SRC_INDEX, target_index=TARGET_INDEX, target_client=target_client)

def main():
	setup_index()
	transfer()

main()
