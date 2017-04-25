import os
import time
from time import localtime, strftime
from sqlalchemy import create_engine, and_
import logging

from src.models import DBSession, Dnasequenceannotation, Locusdbentity, Referencedbentity

__author__ = 'tshepp'

'''
Refreshes the varnish cache for all entities.  This script may be run on demand or on a schedule.
''' 

BATCH_SIZE = 100

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
pyramid_log = logging.getLogger(__name__)

def log(message):
    print message
    pyramid_log.info(message)

# a la http://stackoverflow.com/questions/2130016/splitting-a-list-of-arbitrary-size-into-only-roughly-n-equal-parts
def chunk_list(seq, num):
    avg = len(seq) / float(num)
    out = []
    last = 0.0
    while last < len(seq):
        out.append(seq[int(last):int(last + avg)])
        last += avg
    return out

def refresh_in_batches(dbentity_list):
    total = len(dbentity_list)
    chunked_sets = chunk_list(dbentity_list, BATCH_SIZE)
    i = 0
    for small_dbentity_list in chunked_sets:
        batch_start_time = time.time()
        for d in small_dbentity_list:
            d.refresh_cache()
        i += 1
        elapsed_time = time.time() - batch_start_time
        finished = i * len(small_dbentity_list)
        finished_percent = "{0:.0f}%".format(float(finished)/float(total) * 100)
        log(finished_percent + ' complete')
        log('FINISHED ' + str(len(small_dbentity_list)) + ' ITEMS in ' + str(elapsed_time) + ' seconds')

def refresh_references():
    start_time = time.time()
    references = DBSession.query(Referencedbentity).all()
    log('REFRESHING ' + str(len(references)) + ' REFERENCES at ' + str(start_time))
    for ref in references:
        ref.refresh_cache()

def refresh_genes():
    start_time = localtime()
    # get S288C genes
    gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').limit(2000).all()
    log('REFRESHING ' + str(len(all_genes)) + ' GENES at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    # refresh each entry
    refresh_in_batches(all_genes)
    elapsed_time = time.time() - start_time
    log('FINISHED ' + str(len(all_genes)) + ' GENES in ' + str(elapsed_time) + ' seconds')

def refresh_all_cache():
    # refresh_references()
    refresh_genes()

if __name__ == '__main__':
    refresh_all_cache()
