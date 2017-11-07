from src.models import DBSession, Filedbentity
from sqlalchemy import create_engine
import os

'''
	Process a CSV file of existing downloads, create filedbentity entries, file_path entries, and 
	finds the file on a local directory, then uploads to s3 and updates s3_path.
'''

INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
LOCAL_FILE_DIRECTORY = os.environ.get('LOCAL_FILE_DIRECTORY')
NEX2_URI = os.environ.get('NEX2_URI')

def load_filedbentities():
    engine = create_engine(NEX2_URI, pool_recycle=3600)
    DBSession.configure(bind=engine)

    # for x in files:
    #     print(x.get_path(), x.topic.display_name)

if __name__ == '__main__':
    load_filedbentities()
