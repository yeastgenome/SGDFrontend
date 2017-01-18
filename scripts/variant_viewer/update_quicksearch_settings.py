from elasticsearch import Elasticsearch
import time
es = Elasticsearch()

index_name = 'sgdlite'

# drop index and recreate
es.indices.delete(index=index_name)
es.indices.create(index=index_name)
time.sleep(2)

# define autocomplete filter
new_settings = {
	"analysis": {
		"filter": {
			"autocomplete_filter": { 
				"type":     "edge_ngram",
				"min_gram": 1,
				"max_gram": 20
			}
		},
		"analyzer": {
			"autocomplete": {
				"type":      "custom",
				"tokenizer": "standard",
				"filter": [
					"lowercase",
					"autocomplete_filter" 
				]
			},
			"raw": {
				"type": "custom",
				"tokenizer": "keyword",
				"filter": [
					"lowercase"
				]
			}
		}
	}
}

# add autocomplete setting, needs to close and reopen
es.indices.close(index=index_name)
es.indices.put_settings(index=index_name, body=new_settings)
es.indices.open(index=index_name)

# update mapping
# AFTER THIS, documents must be reindexed
def index_doc_type(doc_type):
	other_mapping_settings = {
		"properties": {
			"term": {
				"type": "string",
				"analyzer": "autocomplete",
				"fields": {
					"raw": {
						"type": "string",
						"analyzer": "raw"
					}
				}
			},
			"link_url": {
				"type": "string",
				"index": "not_analyzed"
			}
		}
	}
	full_settings = {}
	full_settings[doc_type] = other_mapping_settings
	es.indices.put_mapping(index=index_name, body=full_settings, doc_type=doc_type)


# apply mapping settings to these doc types
mapped_doc_types = ['gene_name', 'GO', 'phenotype', 'author', 'colleague', 'strain', 'contig', 'paper', 'description']
for doc_type in mapped_doc_types:
	index_doc_type(doc_type)
