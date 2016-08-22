from src.models import DBSession, Base, Colleague, ColleagueLocus, Locusdbentity
from sqlalchemy import create_engine
from elasticsearch import Elasticsearch
from es_mapping import es_mapping
import os
import requests

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = 'searchable_items_blue'

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
    colleagues = DBSession.query(Colleague).all()

    print "Indexing " + str(len(colleagues)) + " colleagues"
    
    for c in colleagues:
        description = ""
        if c.institution:
            description += "Institution: " + c.institution

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
            'name': c.first_name + " " + c.last_name,
            'category': 'colleague',
            'href': '/colleagues/' + c.format_name,
            'description': description,
            
            'first_name': c.first_name,
            'last_name': c.last_name,
            'institution': c.institution,
            'work_phone': c.work_phone,
            'position': position,
            'country': c.country,
            'locus': list(locus)
        }

        c._include_keywords_to_dict(obj)

        es.index(index=INDEX_NAME, doc_type=DOC_TYPE, body=obj, id=c.format_name)

#delete_mapping()
#put_mapping()

index_colleagues()
