from elasticsearch import helpers
from elasticsearch import Elasticsearch

SRC_CLIENT_ADDRESS = 'http://localhost:9200'
TARGET_CLIENT_ADDRESS = 'http://localhost:9200'
SRC_INDEX = 'sequence_objects5'
TARGET_INDEX = 'sequence_objects'

src_client = Elasticsearch(SRC_CLIENT_ADDRESS)
target_client = Elasticsearch(TARGET_CLIENT_ADDRESS)

# transfer sequence objects between clusters or index based on statics
helpers.reindex(client=src_client, source_index=SRC_INDEX, target_index=TARGET_INDEX, target_client=target_client)
