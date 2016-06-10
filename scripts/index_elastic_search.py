from src.models import DBSession, Base, Colleague
from sqlalchemy import create_engine
from elasticsearch import Elasticsearch
from es_mapping import es_mapping
import os
import requests

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = 'searchable_items'
DOC_TYPE = 'searchable_item'
es = Elasticsearch(os.environ['ES_URI'], retry_on_timeout=True)

def delete_mapping():
    print "Deleting mapping..."
    response = requests.delete(os.environ['ES_URI'] + INDEX_NAME + "/")
    if response.status_code != 200:
        print "ERROR: " + str(response.json())
    else:
        print "SUCESS"
        

def put_mapping():
    print "Putting mapping... "
    response = requests.put(os.environ['ES_URI'] + INDEX_NAME + "/", json=es_mapping)
    if response.status_code != 200:
        print "ERROR: " + str(response.json())
    else:
        print "SUCESS"

def index_colleagues():
    print "Indexing colleagues..."
    colleagues = DBSession.query(Colleague).all()

    for c in colleagues:
        obj = {
            'name': c.first_name + " " + c.last_name,
            'category': 'colleagues',
            'href': '/colleagues/' + c.format_name,

            'first_name': c.first_name,
            'last_name': c.last_name,
            'institution': c.institution,
            'work_phone': c.work_phone
        }
    
        es.index(index=INDEX_NAME, doc_type=DOC_TYPE, body=obj, id=c.format_name)

delete_mapping()
put_mapping()

index_colleagues()
