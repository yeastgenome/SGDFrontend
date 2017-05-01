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

BATCHES = 100

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

def refresh_in_batches(dbentity_list, is_tabbed_page_refresh):
    total = len(dbentity_list)
    chunked_sets = chunk_list(dbentity_list, BATCHES)
    i = 0
    for small_dbentity_list in chunked_sets:
        batch_start_time = time.time()
        for d in small_dbentity_list:
            if is_tabbed_page_refresh:
                d.refresh_tabbed_page_cache()
            else:
                d.refresh_cache()
        i += 1
        elapsed_time = time.time() - batch_start_time
        finished = i * len(small_dbentity_list)
        finished_percent = "{0:.0f}%".format(float(finished)/float(total) * 100)
        if len(small_dbentity_list) > 0:
            class_name = small_dbentity_list[0].__class__.__name__
            log(finished_percent + ' complete ' + class_name + ' ' + str(len(small_dbentity_list)) + ' of ' + str(total) + ' ' + class_name + ' in ' + str(elapsed_time) + ' seconds')

def refresh_and_debug_entity_list(list, name, is_tabbed_page_refresh=False):
    start_time = localtime()
    i_start_time = time.time()
    log('REFRESHING ' + str(len(list)) + ' ' + name + ' at ' + strftime("%a, %d %b %Y %H:%M:%S +0000", start_time))
    refresh_in_batches(list, is_tabbed_page_refresh)
    elapsed_time = time.time() - i_start_time
    log('FINISHED ' + str(len(list)) + ' ' + name + ' in ' + str(elapsed_time / 60.0) + ' minutes')

def refresh_go():
    gos = DBSession.query(Go).all()
    refresh_and_debug_entity_list(gos, 'GO terms')

def refresh_observables():
    observables = DBSession.query(Apo).filter_by(apo_namespace="observable").all()
    refresh_and_debug_entity_list(observables, 'observables')

def refresh_phenotypes():
    phenotypes = DBSession.query(Phenotype).all()
    refresh_and_debug_entity_list(phenotypes, 'phenotypes')

def refresh_references():
    references = DBSession.query(Referencedbentity).all()
    refresh_and_debug_entity_list(references, 'references')

def refresh_strains():
    strains = DBSession.query(Straindbentity).all()
    refresh_and_debug_entity_list(strains, 'strains')

def get_genes():
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
    return all_genes

def refresh_genes_a():
    g = get_genes()
    refresh_and_debug_entity_list(g[:len(g)/2], 'genes')
    
def refresh_genes_b():
    g = get_genes()
    refresh_and_debug_entity_list(g[len(g)/2:], 'genes')

def refresh_tab_pages_a():
    g = get_genes()
    refresh_and_debug_entity_list(g[:len(g)/2], 'gene tab pages', True)

def refresh_tab_pages_b():
    g = get_genes()
    refresh_and_debug_entity_list(g[len(g)/2:], 'gene tab pages', True)

# run on 4 threads
def refresh_all_cache():
    def index_part_1():
        refresh_genes_a()
        refresh_tab_pages_a()
    def index_part_2():
        refresh_genes_b()
        refresh_tab_pages_b()
    def index_part_3():
        refresh_go()
    def index_part_4():
        refresh_phenotypes()
        refresh_observables()
        refresh_strains()
        # refresh_references()

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
