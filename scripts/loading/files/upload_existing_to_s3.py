from src.models import DBSession, Filedbentity
from sqlalchemy import create_engine
import os

'''
    Takes existing entries in filedbentity, uploads to s3, then updates s3_path.
'''

def upload_all_filedbentities():
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)
    files = DBSession.query(Filedbentity).all()
    for x in files:
        print((x.get_path(), x.topic.display_name))

if __name__ == '__main__':
    upload_all_filedbentities()
