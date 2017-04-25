import os
import datetime
from sqlalchemy import create_engine, and_
import logging

from src.models import DBSession, Dnasequenceannotation, Locusdbentity, Referencedbentity

__author__ = 'tshepp'

'''
Refreshes the varnish cache for all entities.  This script may be run on demand or on a schedule.
''' 

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
pyramid_log = logging.getLogger(__name__)

def log(message):
    print message
    pyramid_log.info(message)

def refresh_references():
    start_time = datetime.datetime.now()
    references = DBSession.query(Referencedbentity).limit(500).all()
    log('REFRESHING ' + str(len(references)) + ' REFERENCES at ' + start_time.strftime('%a, %x %X'))
    for ref in references:
        ref.refresh_cache()

def refresh_genes():
    log('REFRESHING GENES')
    # get S288C genes
    gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').limit(500).all()
    # refresh each entry
    for gene in all_genes:
        gene.refresh_cache()   

def refresh_all_cache():
    refresh_references()
    # refresh_genes()

if __name__ == '__main__':
    refresh_all_cache()
