import json
import logging
import os

import boto
from boto.s3.key import Key
from sqlalchemy import create_engine
from src.models import Base, DBSession, Locusdbentity

__author__ = 'tshepp'

'''
    For a set of loci, get expression details, make a JSON file called [SGDID].json and upload to expression_details bucket.
'''

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

FILE_DIR = '.tmp/'
S3_BUCKET = os.environ['EXPRESSION_S3_BUCKET']
S3_ACCESS_KEY = os.environ['S3_ACCESS_KEY']
S3_SECRET_KEY = os.environ['S3_SECRET_KEY']

def upload_gene(gene):
    expression_details_json = json.dumps(gene.expression_to_dict())
    file_name = FILE_DIR + gene.sgdid + '.json'
    with open(file_name, 'w') as json_file:
        json_file.write(expression_details_json)
        conn = boto.connect_s3(S3_ACCESS_KEY, S3_SECRET_KEY)
        bucket = conn.get_bucket(S3_BUCKET)
        k = Key(bucket)
        k.key = s3_path
        k.set_contents_from_file(file, rewind=True)
        k.make_public()
        os.remove(file_name)

def upload_test_gene():
    gene = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id == 1268789).one_or_none()
    upload_gene(gene)

def upload_expression_details():
    print("uploading expression details")

if __name__ == '__main__':
    upload_test_gene()
