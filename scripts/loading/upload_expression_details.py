import json
import logging
import os
from threading import Thread
import time
import traceback

import boto
from boto.s3.key import Key
from sqlalchemy import create_engine
from src.models import Base, DBSession, Dnasequenceannotation, Locusdbentity

__author__ = 'tshepp'

'''
    For a set of loci, get expression details, make a JSON string and upload to sgd-prod-expression-details bucket with name [SGDID].json.
'''

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

DEBUG_SIZE = 10
FILE_DIR = '.tmp/'
S3_BUCKET = os.environ['EXPRESSION_S3_BUCKET']
S3_ACCESS_KEY = os.environ['S3_ACCESS_KEY']
S3_SECRET_KEY = os.environ['S3_SECRET_KEY']
S3_HOST = 's3-us-west-2.amazonaws.com'

def get_all_genes(limit, offset):
    # get S288C genes
    gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    # return the query
    return DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').limit(limit).offset(offset).all()

def upload_gene(gene):
    try:
        expression_details_json = json.dumps(gene.expression_to_dict())
        global_file_name = gene.sgdid + '.json'
        local_file_name = FILE_DIR + global_file_name
        conn = boto.connect_s3(S3_ACCESS_KEY, S3_SECRET_KEY, host=S3_HOST)
        bucket = conn.get_bucket(S3_BUCKET)
        k = Key(bucket)
        k.key = global_file_name
        k.set_contents_from_string(expression_details_json)
        k.make_public()
        return True
    except:
        log.error('Error uploading ' + gene.sgdid)
        traceback.print_exc()
        return False

def upload_test_gene():
    start = time.time()
    gene = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id == 1268789).one_or_none()
    upload_gene(gene)
    end = time.time()
    elapsed = end - start
    log.info('RAD54 done in ' + str(elapsed) + ' seconds')

def upload_gene_list(genes, list_name):
    list_start = time.time()
    start = time.time()
    temp_success_list = []
    # every DEBUG_SIZE genes print some debug
    for i, gene in enumerate(genes):
        success = upload_gene(gene)
        if success:
            temp_success_list.append(gene.sgdid)
        if i % DEBUG_SIZE == 0:
            end = time.time()
            elapsed = round(end - start)
            list_elapsed_hours = round(end - list_start) / 3600
            log.info(str(temp_success_list) + ' done in ' + str(elapsed) + ' seconds. ' + str(i) + '/' + str(len(genes)) + ' of total list in ' + str(list_elapsed_hours) + ' hours. List ' + list_name)
            start = time.time()
            temp_success_list = []
    log.info('Finished with list ' + list_name)

# methods for 4 gene subsets to allow 4 threads
def upload_genes_a():
    genes = get_all_genes(12, 0)
    upload_gene_list(genes, 'a')
def upload_genes_b():
    genes = get_all_genes(12, 2000)
    upload_gene_list(genes, 'b')
def upload_genes_c():
    genes = get_all_genes(12, 4000)
    upload_gene_list(genes, 'c')
def upload_genes_d():
    genes = get_all_genes(12, 6000)
    upload_gene_list(genes, 'd' )
    
if __name__ == '__main__':
    t1 = Thread(target=upload_genes_a)
    t2 = Thread(target=upload_genes_b)
    t3 = Thread(target=upload_genes_c)
    t4 = Thread(target=upload_genes_d)
    t1.start()
    t2.start()
    t3.start()
    t4.start()
