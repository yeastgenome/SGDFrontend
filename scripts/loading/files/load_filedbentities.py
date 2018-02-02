import csv
import os
import logging
from datetime import datetime
from src.helpers import upload_file
from src.models import DBSession, Edam, Filedbentity, FilePath, Path, Referencedbentity, ReferenceFile, Source
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, scoped_session
from zope.sqlalchemy import ZopeTransactionExtension
import transaction
import traceback

'''
    Process a CSV file of downloads, create filedbentity entries, file_path entries, and 
    finds the file on a local directory, then uploads to s3 and updates s3_path.

    example
        $ source dev_variables.sh && CREATED_BY=TSHEPP LOCAL_FILE_DIRECTORY=/Users/travis/Documents/bun_downloads/html INPUT_FILE_NAME=/Users/travis/Desktop/meta_csvs/literature_file_metadata.csv python scripts/loading/files/load_filedbentities.py
'''

INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
LOCAL_FILE_DIRECTORY = os.environ.get('LOCAL_FILE_DIRECTORY')
NEX2_URI = os.environ.get('NEX2_URI')
CREATED_BY = os.environ.get('CREATED_BY')
SGD_SOURCE_ID = 834

logging.basicConfig(level=logging.INFO)

def create_and_upload_file(obj, row_num):
    try:
        # find on local system
        local_file_path = LOCAL_FILE_DIRECTORY + '/' + obj['bun_path']
        # special transformations
        local_file_path = local_file_path.replace('feature/', 'features/')
        local_file = open(local_file_path)
    except IOError:
        logging.error('error opening file ' + str(row_num))
        traceback.print_exc()
        return

    try:
        temp_engine = create_engine(NEX2_URI)
        session_factory = sessionmaker(bind=temp_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
        db_session = scoped_session(session_factory)
        # get README location
        readme_file_id = None
        if len(obj['readme_name']):
            readme = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['readme_name']).one_or_none()
            if readme is None:
                logging.warning('unable to find README ' + obj['readme_name'])
            else:
                readme_file_id = readme.dbentity_id
        # see if already exists, if not create
        existing = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
        source_id = db_session.query(Source.source_id).filter(Source.display_name==obj['source']).one_or_none()[0]
        if not existing:
            try:
                data_id = db_session.query(Edam.edam_id).filter(Edam.edamid==obj['data_edam_id']).one_or_none()[0]
                format_id = db_session.query(Edam.edam_id).filter(Edam.edamid==obj['format_edam_id']).one_or_none()[0]
                topic_id = db_session.query(Edam.edam_id).filter(Edam.edamid==obj['topic_edam_id']).one_or_none()[0]
            except TypeError:
                logging.error('invalid EDAM id or source in row ' + str(row_num) + ' val in ' + obj['data_edam_id'] + ', ' + obj['format_edam_id'] + ', ' + obj['topic_edam_id'])
                return
            upload_file(CREATED_BY, local_file,
                filename=obj['display_name'],
                file_extension=obj['file_extension'],
                description=obj['description'],
                display_name=obj['display_name'],
                data_id=data_id,
                format_id=format_id,
                status=obj['status'],
                topic_id=topic_id,
                is_public=obj['is_public'],
                is_in_spell=obj['is_in_spell'],
                is_in_browser=obj['is_in_browser'],
                file_date=obj['file_date'],
                readme_file_id=readme_file_id,
                source_id=source_id
            )
            db_session.flush()
        else:
            existing.description = obj['description']
            existing.status = obj['status']
            existing.is_public = obj['is_public']
            existing.is_in_spell = obj['is_in_spell']
            existing.is_in_browser = obj['is_in_browser']
            existing.source_id = source_id
            if obj['file_date']:
                existing.file_date = obj['file_date']
                existing.year = obj['file_date'].year
            existing.readme_file_id = readme_file_id
            transaction.commit()
            existing = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
            # only upload s3 file if not defined
            if existing.s3_url is None:
                existing.upload_file_to_s3(local_file, obj['display_name'])
            db_session.flush()
        # add path entries
        existing = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
        if not existing:
            logging.error('error with ' + obj['display_name']+ ' in row ' + str(row_num))
            return
        path = db_session.query(Path).filter_by(path=obj['new_path']).one_or_none()
        if path is None:
            logging.warning('Could not find path ' + obj['new_path'] + ' in row ' + str(row_num))
            return
        existing_filepath = db_session.query(FilePath).filter(and_(FilePath.file_id==existing.dbentity_id, FilePath.path_id==path.path_id)).one_or_none()
        if not existing_filepath:
            new_filepath = FilePath(file_id=existing.dbentity_id, path_id=path.path_id, source_id=SGD_SOURCE_ID, created_by=CREATED_BY)
            db_session.add(new_filepath)
            transaction.commit()
            db_session.flush()
        # maybe add PMIDs
        if len(obj['pmids']):
            existing = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
            pmids = obj['pmids'].split('|')
            for x  in pmids:
                x = int(x.strip())
                existing_ref_file = db_session.query(ReferenceFile).filter(ReferenceFile.file_id==existing.dbentity_id).one_or_none()
                ref = db_session.query(Referencedbentity).filter(Referencedbentity.pmid==x).one_or_none()
                if ref and not existing_ref_file:
                    new_ref_file = ReferenceFile(created_by=CREATED_BY, file_id=existing.dbentity_id, reference_id=ref.dbentity_id, source_id=SGD_SOURCE_ID)
                    db_session.add(new_ref_file)
                transaction.commit()
                db_session.flush()
        logging.info('finished ' + obj['display_name'] + ', line ' + str(row_num))
    except:
        logging.error('error with ' + obj['display_name']+ ' in row ' + str(row_num))
        traceback.print_exc()
        db_session.rollback()
        db_session.close()

def load_csv_filedbentities():
    engine = create_engine(NEX2_URI, pool_recycle=3600)
    DBSession.configure(bind=engine)

    o = open(INPUT_FILE_NAME,'rU')
    reader = csv.reader(o)
    for i, val in enumerate(reader):
        if i > 0:
            if val[0] == '':
                logging.info('Found a blank value, DONE!')
                return
            raw_date = val[13]
            if len(raw_date):
                raw_date = datetime.strptime(val[13], '%Y-%m-%d')
            else:
                raw_date = None
            obj = {
                'bun_path': val[0],
                'new_path': val[1],
                'display_name': val[3],
                'status': val[4].replace('Archive', 'Archived'),
                'source': val[5],
                'topic_edam_id': val[7].upper().replace('TOPIC', 'EDAM'),
                'data_edam_id': val[9].upper().replace('DATA', 'EDAM'),
                'format_edam_id': val[11].upper().replace('FORMAT', 'EDAM'),
                'file_extension': val[12],
                'file_date': raw_date,
                'is_public': (val[15] == '1'),
                'is_in_spell': (val[16] == '1'),
                'is_in_browser': (val[17] == '1'),
                'readme_name': val[18],
                'description': val[19],
                'pmids': val[20]
            }
            create_and_upload_file(obj, i)

if __name__ == '__main__':
    load_csv_filedbentities()
