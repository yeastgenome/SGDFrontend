import csv
import os
from src.helpers import upload_file
from src.models import DBSession, Edam, Filedbentity, Filepath, Path
from sqlalchemy import create_engine, and_
import transaction
import traceback

'''
    Process a CSV file of downloads, create filedbentity entries, file_path entries, and 
    finds the file on a local directory, then uploads to s3 and updates s3_path.

    example
        $ CREATED_BY=TSHEPP LOCAL_FILE_DIRECTORY=/Users/travis/Documents/bun_downloads/html INPUT_FILE_NAME=/Users/travis/Desktop/chromosomal_feature_file_metadata.csv python scripts/loading/files/load_filedbentities.py
'''

INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
LOCAL_FILE_DIRECTORY = os.environ.get('LOCAL_FILE_DIRECTORY')
NEX2_URI = os.environ.get('NEX2_URI')
CREATED_BY = os.environ.get('CREATED_BY')
SGD_SOURCE_ID = 834

def create_and_upload_file(db_session, obj):
    try:
        pass
        # see if already exists, if not create
        existing = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
        if not existing:
            # find on local system
            local_file_path = LOCAL_FILE_DIRECTORY + '/' + obj['bun_path']
            # special transformations
            local_file_path = local_file_path.replace('feature', 'features')
            local_file = open(local_file_path)
            data_id = db_session.query(Edam.edam_id).filter(Edam.edamid==obj['data_edam_id']).one_or_none()[0]
            format_id = db_session.query(Edam.edam_id).filter(Edam.edamid==obj['format_edam_id']).one_or_none()[0]
            topic_id = db_session.query(Edam.edam_id).filter(Edam.edamid==obj['topic_edam_id']).one_or_none()[0]
            upload_file(CREATED_BY, local_file, filename=obj['display_name'], file_extension=obj['file_extension'], description=obj['description'], display_name=obj['display_name'], data_id=data_id, format_id=format_id, topic_id=topic_id, is_public=True)
        else:
            existing.description = obj['description']
            transaction.commit()
            db_session.flush()
        # add path entries
        existing = db_session.query(Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
        path = db_session.query(Path).filter_by(path=obj['new_path']).one_or_none()
        existing_filepath = db_session.query(Filepath).filter(and_(Filepath.file_id==existing.dbentity_id, Filepath.path_id==path.path_id)).one_or_none()
        if not existing_filepath:
            new_filepath = Filepath(file_id=existing.dbentity_id, path_id=path.path_id, source_id=SGD_SOURCE_ID, created_by=CREATED_BY)
            db_session.add(new_filepath)
            transaction.commit()
            db_session.flush()
    except Exception, e:
        print('error with this file')
        traceback.print_exc()
        db_session.rollback()

def load_csv_filedbentities():
    engine = create_engine(NEX2_URI, pool_recycle=3600)
    DBSession.configure(bind=engine)

    o = open(INPUT_FILE_NAME,'rU')
    reader = csv.reader(o)
    for i, val in enumerate(reader):
        # TEMP just some rows
        #if i != 0:
        if i > 0 and i < 10:
            obj = {
                'bun_path': val[0],
                'new_path': val[1],
                'display_name': val[3],
                'is_active': val[4],
                'topic_edam_id': val[7].upper().replace('TOPIC', 'EDAM'),
                'data_edam_id': val[9].upper().replace('DATA', 'EDAM'),
                'format_edam_id': val[11].upper().replace('FORMAT', 'EDAM'),
                'file_extension': val[12],
                'description': val[19]
            }
            create_and_upload_file(DBSession, obj)

if __name__ == '__main__':
    load_csv_filedbentities()
