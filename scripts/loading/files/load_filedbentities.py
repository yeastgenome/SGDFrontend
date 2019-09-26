import csv
import os
import logging
import re
from datetime import datetime
import getpass
import paramiko
from src.helpers import upload_file
from src.models import DBSession, Edam, Filedbentity, FileKeyword, FilePath, Keyword, Path, Referencedbentity, ReferenceFile, Source
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, scoped_session
from zope.sqlalchemy import ZopeTransactionExtension
import transaction
import traceback
import pandas as pd
from operator import itemgetter

from src.aws_helpers import get_zip_files, get_sra_files, get_readme_files, get_file_from_path_collection


'''
    Process a CSV file of downloads, create filedbentity entries, file_path entries, and 
    finds the file on the remote download server via SSH, then uploads to s3 and updates s3_path.

    example
        $ source dev_variables.sh && CREATED_BY=TSHEPP INPUT_FILE_NAME=/Users/travis/Desktop/meta_csvs/literature_file_metadata.csv python scripts/loading/files/load_filedbentities.py
'''

# DATA_DIR = '/data.s3/html'
DATA_DIR = '/data.s3/'
HOSTNAME = 'bun.stanford.edu'
INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
LOCAL_FILE_DIRECTORY = os.environ.get('LOCAL_FILE_DIRECTORY')
NEX2_URI = os.environ.get('NEX2_URI')
CREATED_BY = os.environ.get('CREATED_BY')
SGD_SOURCE_ID = 834

logging.basicConfig(level=logging.INFO)


def create_and_upload_file(obj, row_num, sftp_client):
    try:
        # find on local system
        remote_file_path = DATA_DIR + '/' + obj['bun_path']
        # special transformations
        remote_file_path = remote_file_path.replace('feature/', 'features/')
        remote_file = sftp_client.open(remote_file_path)
    except IOError:
        logging.error('error opening file ' + str(row_num))
        traceback.print_exc()
        return

    try:
        temp_engine = create_engine(NEX2_URI)
        session_factory = sessionmaker(
            bind=temp_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
        db_session = scoped_session(session_factory)
        # get README location
        readme_file_id = None
        if len(obj['readme_name']):
            readme = db_session.query(Filedbentity).filter(
                Filedbentity.display_name == obj['readme_name']).one_or_none()
            if readme is None:
                logging.warning('unable to find README ' + obj['readme_name'])
            else:
                readme_file_id = readme.dbentity_id
        # see if already exists, if not create
        existing = db_session.query(Filedbentity).filter(
            Filedbentity.display_name == obj['display_name']).one_or_none()
        source_id = db_session.query(Source.source_id).filter(
            Source.display_name == obj['source']).one_or_none()[0]
        if not existing:
            try:
                data_id = db_session.query(Edam.edam_id).filter(
                    Edam.edamid == obj['data_edam_id']).one_or_none()[0]
                format_id = db_session.query(Edam.edam_id).filter(
                    Edam.edamid == obj['format_edam_id']).one_or_none()[0]
                topic_id = db_session.query(Edam.edam_id).filter(
                    Edam.edamid == obj['topic_edam_id']).one_or_none()[0]
            except TypeError:
                logging.error('invalid EDAM id or source in row ' + str(row_num) + ' val in ' +
                              obj['data_edam_id'] + ', ' + obj['format_edam_id'] + ', ' + obj['topic_edam_id'])
                return
            upload_file(CREATED_BY, remote_file,
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
            existing.display_name = obj['display_name']
            existing.description = obj['description']
            existing.status = obj['status']
            existing.is_public = obj['is_public']
            existing.is_in_spell = obj['is_in_spell']
            existing.is_in_browser = obj['is_in_browser']
            existing.source_id = source_id
            # update file size
            if not existing.file_size and existing.s3_url:
                remote_file.seek(0, os.SEEK_END)
                file_size = remote_file.tell()
                remote_file.seek(0)
                existing.file_size = file_size
            if obj['file_date']:
                existing.file_date = obj['file_date']
                existing.year = obj['file_date'].year
            existing.readme_file_id = readme_file_id
            remote_file.seek(0, os.SEEK_END)
            transaction.commit()
            existing = db_session.query(Filedbentity).filter(
                Filedbentity.display_name == obj['display_name']).one_or_none()
            # only upload s3 file if not defined
            if existing.s3_url is None:
                existing.upload_file_to_s3(remote_file, obj['display_name'])
            db_session.flush()
        # add path entries
        existing = db_session.query(Filedbentity).filter(
            Filedbentity.display_name == obj['display_name']).one_or_none()
        if not existing:
            logging.error('error with ' +
                          obj['display_name'] + ' in row ' + str(row_num))
            return
        path = db_session.query(Path).filter_by(
            path=obj['new_path']).one_or_none()
        if path is None:
            logging.warning('Could not find path ' +
                            obj['new_path'] + ' in row ' + str(row_num))
            return
        existing_filepath = db_session.query(FilePath).filter(and_(
            FilePath.file_id == existing.dbentity_id, FilePath.path_id == path.path_id)).one_or_none()
        if not existing_filepath:
            new_filepath = FilePath(file_id=existing.dbentity_id, path_id=path.path_id,
                                    source_id=SGD_SOURCE_ID, created_by=CREATED_BY)
            db_session.add(new_filepath)
            transaction.commit()
            db_session.flush()
        # maybe add PMIDs
        if len(obj['pmids']):
            existing = db_session.query(Filedbentity).filter(
                Filedbentity.display_name == obj['display_name']).one_or_none()
            pmids = obj['pmids'].split('|')
            for x in pmids:
                x = int(x.strip())
                existing_ref_file = db_session.query(ReferenceFile).filter(
                    ReferenceFile.file_id == existing.dbentity_id).one_or_none()
                ref = db_session.query(Referencedbentity).filter(
                    Referencedbentity.pmid == x).one_or_none()
                if ref and not existing_ref_file:
                    new_ref_file = ReferenceFile(
                        created_by=CREATED_BY, file_id=existing.dbentity_id, reference_id=ref.dbentity_id, source_id=SGD_SOURCE_ID)
                    db_session.add(new_ref_file)
                transaction.commit()
                db_session.flush()
        # maybe add keywords
        if len(obj['keywords']):
            existing = db_session.query(Filedbentity).filter(
                Filedbentity.display_name == obj['display_name']).one_or_none()
            keywords = obj['keywords'].split('|')
            for x in keywords:
                x = x.strip()
                keyword = db_session.query(Keyword).filter(
                    Keyword.display_name == x).one_or_none()
                existing_file_keyword = db_session.query(FileKeyword).filter(and_(
                    FileKeyword.file_id == existing.dbentity_id, FileKeyword.keyword_id == keyword.keyword_id)).one_or_none()
                if not existing_file_keyword:
                    new_file_keyword = FileKeyword(
                        created_by=CREATED_BY, file_id=existing.dbentity_id, keyword_id=keyword.keyword_id, source_id=SGD_SOURCE_ID)
                    db_session.add(new_file_keyword)
                transaction.commit()
                db_session.flush()
        remote_file.close()
        logging.info(
            'finished ' + obj['display_name'] + ', line ' + str(row_num))
    except:
        logging.error('error with ' +
                      obj['display_name'] + ' in row ' + str(row_num))
        traceback.print_exc()
        db_session.rollback()
        db_session.close()


def format_csv_date_string(date_string, flag=False):
    is_match = re.match('^\d{0,2}\/\d{0,2}\/\d{2}', date_string)
    if is_match is not None:
        temp = is_match.group(0).split('/')
        if(len(temp) == 3):
            if(flag):
                temp_str = '{}/{}/{}'.format("20" +
                                             str(temp[2]), temp[0], temp[1])
                return temp_str
            else:
                temp_str = '{}-{}-{}'.format("20" +
                                             str(temp[2]), temp[0], temp[1])
                return temp_str

    else:
        return None


def load_csv_filedbentities():
    engine = create_engine(NEX2_URI, pool_recycle=3600)
    DBSession.configure(bind=engine)

    # open ssh connection to download server
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    username = raw_input('Username for legacy download server: ')
    password = getpass.getpass('Password for %s@%s: ' % (username, HOSTNAME))
    client.connect(HOSTNAME, 22, username, password,
                   gss_auth=False, gss_kex=False)
    sftp_client = client.open_sftp()

    o = open(INPUT_FILE_NAME, 'rU')
    reader = csv.reader(o)
    for i, val in enumerate(reader):
        if i > 0:
            if val[0] == '':
                logging.info('Found a blank value, DONE!')
                return

            ### added by Shuai
            if len(val) < 14:
                print (val)
                return
            ###
            raw_date = val[13]
            if len(raw_date):
                temp = format_csv_date_string(val[13])
                if temp is not None:
                    raw_date = datetime.strptime(temp, '%Y-%m-%d')
                else:
                    raw_date = datetime.strptime(val[13], '%Y-%m-%d')

            else:
                raw_date = None
            raw_status = val[4].strip()
            if raw_status == 'Archive':
                raw_status = 'Archived'

            bun_path = val[0].strip()
            new_path = val[1].strip()
            if bun_path[0] != '/':
                bun_path = bun_path.replace(
                    'genome-sequences/', '/genome-sequences/')
            if new_path[0] != '/':
                new_path = new_path.replace(
                    'genome-sequences/', '/genome-sequences/')
            obj = {
                'bun_path': bun_path,
                'new_path': new_path,
                'display_name': val[3].strip(),
                'status': raw_status,
                'source': val[5].strip(),
                'topic_edam_id': val[7].upper().replace('TOPIC', 'EDAM').strip(),
                'data_edam_id': val[9].upper().replace('DATA', 'EDAM').strip(),
                'format_edam_id': val[11].upper().replace('FORMAT', 'EDAM').strip(),
                'file_extension': val[12].strip(),
                'file_date': raw_date,
                'is_public': (val[15] == '1'),
                'is_in_spell': (val[16] == '1'),
                'is_in_browser': (val[17] == '1'),
                'readme_name': val[18],
                'description': val[19].decode('utf-8', 'ignore'),
                'pmids': val[20],
                'keywords': val[21]
            }
            create_and_upload_file(obj, i, sftp_client)
    client.close()


#TODO: Make this more generic in the nxr relase
def file_upload_to_obj():
    """ convert csv to list of objects """

    temp = []
    file_content = pd.read_excel(INPUT_FILE_NAME).fillna(0).to_dict('records')
    sorted_content = sorted(file_content, key=itemgetter(
        'filedbentity.file_extension'))
    for item in file_content:

        raw_date = item.get('filedbentity.file_date')
        if raw_date:
            temp_date = raw_date.strftime('%Y-%m-%d')
            raw_date = datetime.strptime(temp_date, "%Y-%m-%d").date()
        else:
            raw_date = datetime.now().date()

        raw_status = item.get('dbentity.status')
        if raw_status == 'Archive':
            raw_status = 'Archived'
      
        obj = {
            'path': item.get('EBS path'),
            'display_name': item.get('dbentity.display_name'),
            'status': raw_status,
            'source': item.get('dbentity.source'),
            'topic_edam_id': item.get('topic edam_id').upper().replace('TOPIC', 'EDAM').strip(),
            'data_edam_id': item.get('data edam_id').upper().replace('DATA', 'EDAM').strip(),
            'format_edam_id': item.get('format edam_id').upper().replace('FORMAT', 'EDAM').strip(),
            'file_extension': item.get('filedbentity.file_extension'),
            'file_date': raw_date,
            'is_public': (item.get('filedbentity.is_public') == '1'),
            'is_in_spell': item.get('filedbentity.is_in_spell'),
            'is_in_browser': (item.get('filedbentity.is_in_browser') == '1'),
            'readme_name': item.get('readme name'),
            'description': item.get('filedbentity.description'),
            'pmids': item.get('pmids (|)'),
            'keywords': item.get('keywords (|)')
        }
        temp.append(obj)

    if len(temp) > 0:
        return temp
    return None


def upload_file_obj_db_s3():
    """ Upload file metadata to database and s3 """

    # TODO: upload metadata to database
    temp_engine = create_engine(NEX2_URI)
    session_factory = sessionmaker(
        bind=temp_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
    db_session = scoped_session(session_factory)
    readme_file_id = None
    file_content_list = file_upload_to_obj()
    try:
        if file_content_list:
            sorted_content = sorted(
                file_content_list, key=itemgetter('file_extension'))
            for item in sorted_content:
                if item['readme_name']:
                    readme = db_session.query(Filedbentity).filter(
                        Filedbentity.display_name == obj['readme_name']).one_or_none()

                    if readme is None:
                        logging.warning(
                            'unable to find README ' + obj['readme_name'])
                    else:
                        readme_file_id = readme.dbentity_id

                # see if file_meta already exists, else create
                existing_file_meta_data = db_session.query(Filedbentity).filter(
                    Filedbentity.display_name == item['display_name']).one_or_none()
                source_id = db_session.query(Source.source_id).filter(
                    Source.display_name == item['source']).one_or_none()[0]

                d_name = item['display_name']
                f_ext = item['file_extension']
                temp_file_path = get_file_from_path_collection(f_ext, d_name)

                if not existing_file_meta_data:
                    try:
                        data_id = db_session.query(Edam.edam_id).filter(
                            Edam.edamid == item['data_edam_id']).one_or_none()[0]

                        format_id = db_session.query(Edam.edam_id).filter(
                            Edam.edamid == item['format_edam_id']).one_or_none()[0]
                        topic_id = db_session.query(Edam.edam_id).filter(
                            Edam.edamid == item['topic_edam_id']).one_or_none()[0]
                        item["data_id"] = data_id
                        item["format_id"] = format_id
                        item["topic_id"] = topic_id
                        item["source_id"] = source_id
                        item["readme_file_id"] = readme_file_id

                    except TypeError:
                        logging.error(
                            'invalid EDAM id or source in row ' +
                            str(row_num) + ' val in ' + item['data_edam_id'] +
                            ', ' + item['format_edam_id'] +
                            ', ' + item['topic_edam_id'])

                    if temp_file_path:
                        with open(temp_file_path, 'r') as remote_file:
                            upload_file_helper(CREATED_BY, remote_file, item)

                    db_session.flush()
                else:
                    existing_file_meta_data.display_name = item['display_name']
                    existing_file_meta_data.description = item['description']
                    existing_file_meta_data.status = item['status']
                    existing_file_meta_data.is_public = item['is_public']
                    existing_file_meta_data.is_in_spell = item['is_in_spell']
                    existing_file_meta_data.is_in_browser = item['is_in_browser']
                    existing_file_meta_data.source_id = source_id

                    if temp_file_path:
                        with open(temp_file_path, 'r') as remote_file:
                            #update file size
                            if not existing_file_meta_data.file_size and existing_file_meta_data.s3_url:
                                remote_file.seek(0, os.SEEK_END)
                                file_size = remote_file.tell()
                                remote_file.seek(0)
                                existing_file_meta_data.file_size = file_size

                            if item['file_date']:
                                existing_file_meta_data.file_date = item['file_date']
                                existing_file_meta_data.year = item['file_date'].year
                            existing_file_meta_data.readme_file_id = readme_file_id
                            remote_file.seek(0, os.SEEK_END)

                            #transaction.commit()
                            existing_file_meta_data = db_session.query(Filedbentity).filter(
                                Filedbentity.display_name == item['display_name']).one_or_none()
                            # only upload s3 file if not defined
                            if existing_file_meta_data.s3_url is None:
                                existing_file_meta_data.upload_file_to_s3(
                                    remote_file, item['display_name'])
                            db_session.flush()

    except Exception as e:
        logging.error("Exception occurred", exc_info=True)


def upload_file_helper(CREATED_BY, remote_file, obj):
    """ upload file to s3 and update db with s3_url """
    try:

        upload_file(CREATED_BY, remote_file,
                    filename=obj['display_name'],
                    file_extension=obj['file_extension'],
                    description=obj['description'],
                    display_name=obj['display_name'],
                    data_id=obj['data_id'],
                    format_id=obj['format_id'],
                    status=obj['status'],
                    topic_id=obj['topic_id'],
                    is_public=obj['is_public'],
                    is_in_spell=obj['is_in_spell'],
                    is_in_browser=obj['is_in_browser'],
                    file_date=obj['file_date'],
                    readme_file_id=obj['readme_file_id'],
                    source_id=obj['source_id']
                    )
    except Exception as e:
        logging.error("Exception occurred", exc_info=True)


if __name__ == '__main__':
    #load_csv_filedbentities()
    upload_file_obj_db_s3()
    #get_all_readme_files()


'''
def upload_readmes_first(file_upload={}):
    """ uploads readmes before rest of the files """

    try:
        # get list of readme paths
        readme_paths = get_readme_files()
        if read_paths:
            for file in read_paths:
                with open(file, 'r') as open_file:
                    # upload file


        return True
    except Exception as e:
        logging.error("Exception occurred", exc_info=True)
        return False
    

'''
