import os
import time
from time import localtime, strftime
from sqlalchemy import create_engine, and_
import logging
from threading import Thread

from src.models import Apo, DBSession, Dnasequenceannotation, Go, Locusdbentity, Phenotype, Referencedbentity, Straindbentity

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
        if len(small_dbentity_list) > 0:
            class_name = small_dbentity_list[0].__class__.__name__
            log(finished_percent + ' complete ' + class_name)
            log('FINISHED ' + str(len(small_dbentity_list)) + ' ' + class_name + ' in ' + str(elapsed_time) + ' seconds')

def refresh_go():
    start_time = localtime()
    i_start_time = time.time()
    gos = DBSession.query(Go).all()
    log('REFRESHING ' + str(len(gos)) + ' GO terms at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    refresh_in_batches(gos)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(gos)) + ' GO terms in ' + str(elapsed_time / 60.0) + ' minutes')

def refresh_observables():
    start_time = localtime()
    i_start_time = time.time()
    observables = DBSession.query(Apo).filter_by(apo_namespace="observable").all()
    log('REFRESHING ' + str(len(observables)) + ' observables at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    refresh_in_batches(observables)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(observables)) + ' observables in ' + str(elapsed_time / 60.0) + ' minutes')

def refresh_phenotypes():
    start_time = localtime()
    i_start_time = time.time()
    phenotypes = DBSession.query(Phenotype).all()
    log('REFRESHING ' + str(len(phenotypes)) + ' phenotypes at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    refresh_in_batches(phenotypes)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(phenotypes)) + ' phenotypes in ' + str(elapsed_time / 60.0) + ' minutes')

def refresh_references():
    start_time = localtime()
    i_start_time = time.time()
    references = DBSession.query(Referencedbentity).all()
    log('REFRESHING ' + str(len(references)) + ' REFERENCES at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    refresh_in_batches(references)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(references)) + ' REFERENCES in ' + str(elapsed_time / 60.0) + ' minutes')

def refresh_strains():
    start_time = localtime()
    i_start_time = time.time()
    strains = DBSession.query(Straindbentity).all()
    log('REFRESHING ' + str(len(strains)) + ' strains at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    refresh_in_batches(strains)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(strains)) + ' strains in ' + str(elapsed_time / 60.0) + ' minutes')

def refresh_genes():
    start_time = localtime()
    i_start_time = time.time()
    # get S288C genes
    gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').all()
    log('REFRESHING ' + str(len(all_genes)) + ' GENES at ' +  strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    # refresh each entry
    refresh_in_batches(all_genes)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(all_genes)) + ' GENES in ' + str(elapsed_time / 60.0) + ' minutes')

    # def index_part_1():

    # t1 = Thread(target=index_part_1)
    # t1.start()

# run on 4 threads
def refresh_all_cache():
    def index_part_1():
        refresh_genes()
    def index_part_2():
        refresh_phenotypes()
        refresh_observables()
        refresh_strains()
    def index_part_3():
        refresh_go()
    def index_part_4():
        refresh_references()
    # # serial
    # index_part_1()
    # index_part_2()
    # index_part_3()
    # index_part_4()
    # parallel
    t1 = Thread(target=index_part_1)
    t2 = Thread(target=index_part_2)
    t3 = Thread(target=index_part_3)
    t4 = Thread(target=index_part_4)
    t1.start()
    t2.start()
    t3.start()
    t4.start()

if __name__ == '__main__':
    refresh_all_cache()
