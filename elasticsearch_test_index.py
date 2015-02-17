from datetime import datetime
from elasticsearch import Elasticsearch

es = Elasticsearch()

# test index
es.index(index="test-index", doc_type="test-type", id=42, body={
	"display_name": "rad54",
	"link": "/locus/rad54/overview",
	"timestamp": datetime.now()
})
es.index(index="test-index", doc_type="test-type", id=43, body={
	"display_name": "act1",
	"link": "/locus/act1/overview",
	"timestamp": datetime.now()
})

print 'Done indexing.'
