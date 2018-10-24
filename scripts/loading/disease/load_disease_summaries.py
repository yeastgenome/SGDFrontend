import csv
import os
import logging
from src.models import DBSession, Dbentity, Locusdbentity, Locussummary, Source
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, scoped_session
from scripts.loading.reference.promote_reference_triage import add_paper
from zope.sqlalchemy import ZopeTransactionExtension

import transaction
import traceback
import sys

'''
    Process a TSV file of disease annotation summaries
    example
        $ source dev_variables.sh && CREATED_BY=STACIA INPUT_FILE_NAME=/data/nex2/diseaseSummaries2load051018.txt python scripts/loading/disease/load_disease_summaries.py
'''

INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
NEX2_URI = os.environ.get('NEX2_URI')
CREATED_BY = os.environ.get('CREATED_BY')
SUMMARY_TYPE = 'Disease'

logging.basicConfig(level=logging.INFO)


def upload_db(obj, row_num):
    try:
        temp_engine = create_engine(NEX2_URI)
        session_factory = sessionmaker(bind=temp_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
        db_session = scoped_session(session_factory)

        dbentity_id = db_session.query(Dbentity.dbentity_id).filter(Dbentity.sgdid == obj['sgdid']).one_or_none()[0]
        source_id = db_session.query(Source.source_id).filter(Source.display_name == 'SGD').one_or_none()[0]

        if dbentity_id:
            locus_summary_id = db_session.query(Locussummary.locus_id).filter(Locussummary.locus_id == dbentity_id, Locussummary.summary_type == 'Disease').one_or_none()
            if not locus_summary_id:
                new_summary_row = Locussummary(
                locus_id = dbentity_id,
                source_id = source_id,
                text = obj['summary'],
                html = obj['summary'],
                summary_type = SUMMARY_TYPE,
                summary_order = '1',
                created_by = CREATED_BY
            )
            db_session.add(new_summary_row)
            #db_session.query(Locusdbentity).filter_by(dbentity_id = dbentity_id).update({'has_disease': 'true'})
            transaction.commit()
            db_session.flush()
            logging.info('finished ' + obj['sgdid'] + ', line ' + str(row_num))
    except:
        logging.error('error with ' + obj['sgdid'] + ' in line ' + str(row_num))
        traceback.print_exc()
        db_session.rollback()
        db_session.close()
        sys.exit()


def load_csv_disease_dbentities():
    engine = create_engine(NEX2_URI, pool_recycle=3600)
    DBSession.configure(bind=engine)

    o = open(INPUT_FILE_NAME, 'rU')
    reader = csv.reader(o, delimiter='\t')
    for i, val in enumerate(reader):
        if i >= 0:
            if val[0] == '':
                logging.info('Found a blank value, DONE!')
                return
            obj = {
                'sgdid': val[0].strip().replace("SGD:", ""),
                'symbol': val[1].strip(),
                'summary': val[2].strip()
            }
            upload_db(obj, i)


if __name__ == '__main__':
    load_csv_disease_dbentities()
