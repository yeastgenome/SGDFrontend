from src.models import DBSession, Base, Colleague, ColleagueLocus, Locusdbentity
from sqlalchemy import create_engine
from elasticsearch import Elasticsearch
from es_mapping import es_mapping
import os
import requests

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = 'searchable_items_red'

DOC_TYPE = 'searchable_item'
es = Elasticsearch(os.environ['ES_URI'], retry_on_timeout=True)

def delete_mapping():
    print "Deleting mapping..."
    response = requests.delete(os.environ['ES_URI'] + INDEX_NAME + "/")
    if response.status_code != 200:
        print "ERROR: " + str(response.json())
    else:
        print "SUCCESS"        

def put_mapping():
    print "Putting mapping... "
    response = requests.put(os.environ['ES_URI'] + INDEX_NAME + "/", json=es_mapping)
    if response.status_code != 200:
        print "ERROR: " + str(response.json())
    else:
        print "SUCCESS"

def index_colleagues():
    colleagues = DBSession.query(Colleague).all()

    print "Indexing " + str(len(colleagues)) + " colleagues"

    bulk_data = []
    indexed = 0
    for c in colleagues:
        description_fields = []
        for field in [c.institution, c.country]:
            if field:
                description_fields.append(field)
        description = ", ".join(description_fields)
                        
        position = "Lab Member"
        if c.is_pi == 1:
            position = "Head of Lab"

        locus = set()
        locus_ids = DBSession.query(ColleagueLocus.locus_id).filter(ColleagueLocus.colleague_id == c.colleague_id).all()
        if len(locus_ids) > 0:
            ids_query = [k[0] for k in locus_ids]
            locus_names = DBSession.query(Locusdbentity.gene_name, Locusdbentity.systematic_name).filter(Locusdbentity.dbentity_id.in_(ids_query)).all()
            for l in locus_names:
                if l[0]:
                    locus.add(l[0])
                if l[1]:
                    locus.add(l[1])
        
        obj = {
            'name': c.last_name + ", " + c.first_name,
            'category': 'colleague',
            'href': '/colleague/' + c.format_name + '/overview',
            'description': description,
            
            'first_name': c.first_name,
            'last_name': c.last_name,
            'institution': c.institution,
            'position': position,
            'country': c.country,
            'state': c.state,
            'colleague_loci': sorted(list(locus))
        }

        c._include_keywords_to_dict(obj) # adds 'keywords' to obj

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': c.format_name
            }
        })

        bulk_data.append(obj)

        if indexed % 500 == 0:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = 0;

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)

#delete_mapping()
#put_mapping()

#index_colleagues()
