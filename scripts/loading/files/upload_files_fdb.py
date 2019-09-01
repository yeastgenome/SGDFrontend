import csv
import os
import logging
import re
from datetime import datetime
import getpass
from src.helpers import upload_file, update_readme_files_with_urls, add_keywords
from src.models import DBSession, Base, Edam, Filedbentity, FileKeyword, FilePath, Keyword, Path, Referencedbentity, ReferenceFile, Source
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, scoped_session
from zope.sqlalchemy import ZopeTransactionExtension
import transaction
import traceback
import pandas as pd
from operator import itemgetter
import time
import pandas as pd

from src.aws_helpers import get_zip_files, get_sra_files, get_readme_files, get_file_from_path_collection, multi_part_upload_s3, simple_s3_upload

engine = create_engine(os.environ["NEX2_URI"], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

NEX2_URI = os.environ.get('NEX2_URI')
CREATED_BY = os.environ.get('CREATED_BY')
SGD_SOURCE_ID = 834
INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
LOCAL_FILE_DIRECTORY = os.environ.get('LOCAL_FILE_DIRECTORY')

S3_BUCKET = os.environ['S3_BUCKET']
S3_ACCESS_KEY = os.environ['S3_ACCESS_KEY']
S3_SECRET_KEY = os.environ['S3_SECRET_KEY']


def file_upload_to_obj():
    """ convert excel to list of objects """

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

        spell_flag = False
        if item.get('filedbentity.is_in_spell') > 0:
            spell_flag = True
        f_path = item.get('EBS path') + '/' + item.get('path.path') + \
            '/' + item.get('dbentity.display_name')
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
            'is_public': (str(item.get('filedbentity.is_public')) == '1'),
            'is_in_spell': (str(item.get('filedbentity.is_in_spell')) == '1'),
            'is_in_browser': (str(item.get('filedbentity.is_in_browser')) == '1'),
            'readme_name': item.get('readme name', None),
            'description': item.get('filedbentity.description'),
            'pmids': str(item.get('pmids (|)', '')).split('|'),
            'keywords': str(item.get('keywords (|)', '')).split('|'),
            'full_file_path': f_path,
            'new_path': f_path
        }
        temp.append(obj)

    if len(temp) > 0:
        return temp
    return None


def upload_file_helper(CREATED_BY, remote_file, obj, full_file_path):
    """ upload file to s3 and update db with s3_url
    
    Paramaters
    ----------
    CREATED_BY: str
    remote_file: file obj
    obj: dict

    """

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
                    source_id=obj['source_id'],
                    full_file_path=full_file_path
                    )
    except Exception as e:
        logging.error(e)


def upload_file_obj_db_s3():
    """ Upload file metadata to database and s3 """

    readme_file_id = None
    file_content_list = file_upload_to_obj()

    try:
        if file_content_list:
            sorted_content = sorted(
                file_content_list, key=itemgetter('file_extension'))
            for item in sorted_content:
                if item['readme_name']:
                    readme = DBSession.query(Filedbentity).filter(
                        Filedbentity.display_name == item['readme_name']).one_or_none()

                    if readme is None:
                        print('unable to find README ' + item['readme_name'])
                        logging.warning(
                            'unable to find README ' + item['readme_name'])
                    else:
                        readme_file_id = readme.dbentity_id

                # see if file_meta already exists, else create
                existing_file_meta_data = DBSession.query(Filedbentity).filter(
                    Filedbentity.display_name == item['display_name']).one_or_none()
                source_id = DBSession.query(Source.source_id).filter(
                    Source.display_name == item['source']).one_or_none()[0]

                d_name = item['display_name']
                f_ext = item['file_extension']
                temp_file_path = get_file_from_path_collection(f_ext, d_name)

                if not existing_file_meta_data:
                    try:
                        data_id = DBSession.query(Edam.edam_id).filter(
                            Edam.edamid == item['data_edam_id']).one_or_none()[0]

                        format_id = DBSession.query(Edam.edam_id).filter(
                            Edam.edamid == item['format_edam_id']).one_or_none()[0]
                        topic_id = DBSession.query(Edam.edam_id).filter(
                            Edam.edamid == item['topic_edam_id']).one_or_none()[0]
                        item["data_id"] = data_id
                        item["format_id"] = format_id
                        item["topic_id"] = topic_id
                        item["source_id"] = source_id
                        item["readme_file_id"] = readme_file_id

                    except TypeError:
                        logging.error(
                            'invalid EDAM id or source in row ' +
                            ' val in ' + item['data_edam_id'] +
                            ', ' + item['format_edam_id'] +
                            ', ' + item['topic_edam_id'])

                    if temp_file_path:
                        with open(temp_file_path, 'r') as remote_file:
                            upload_file_helper(
                                CREATED_BY, remote_file, item, temp_file_path)

                    DBSession.flush()
                else:
                    existing_file_meta_data.display_name = item['display_name']
                    existing_file_meta_data.description = item['description']
                    existing_file_meta_data.status = item['status']
                    existing_file_meta_data.is_public = item['is_public']
                    existing_file_meta_data.is_in_spell = item['is_in_spell']
                    existing_file_meta_data.is_in_browser = item['is_in_browser']
                    existing_file_meta_data.readme_file_id = readme_file_id
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
                            existing_file_meta_data = DBSession.query(Filedbentity).filter(
                                Filedbentity.display_name == item['display_name']).one_or_none()
                            # only upload s3 file if not defined
                            existing_file_meta_data.upload_file_to_s3(
                                remote_file, item['display_name'], temp_file_path)

                add_path_entries(item['display_name'],
                                 item['new_path'], SGD_SOURCE_ID, CREATED_BY)
                add_pmids(item['display_name'], item['pmids'],
                          SGD_SOURCE_ID, CREATED_BY)
                add_keywords(item['display_name'],
                             item['keywords'], SGD_SOURCE_ID, CREATED_BY)
                if item['display_name'].endswith('.README'):
                    update_readme_files_with_urls(item['display_name'])

                transaction.commit()
                DBSession.flush()
                logging.info('finished processing file: ' +
                             item['display_name'])

    except Exception as e:
        logging.error(e)
        print(e)


def add_path_entries(file_name, file_path, src_id, uname):
    """ add paths to file_path table """

    try:
        existing = DBSession.query(Filedbentity).filter(
            Filedbentity.display_name == file_name).one_or_none()
        if not existing:
            logging.error('error with ' + file_name)
            logging.debug('error with ' + file_name)
        path = DBSession.query(Path).filter_by(path=file_path).one_or_none()

        if path is None:
            logging.warning('Could not find path ')
        else:
            existing_filepath = DBSession.query(FilePath).filter(and_(
                FilePath.file_id == existing.dbentity_id, FilePath.path_id == path.path_id)).one_or_none()

            if not existing_filepath:
                new_filepath = FilePath(file_id=existing.dbentity_id, path_id=path.path_id,
                                        source_id=src_id, created_by=uname)
                DBSession.add(new_filepath)

    except Exception as e:
        logging.error(e)


def add_pmids(file_name, file_pmids, src_id, uname):
    """ add pmids """

    try:
        if len(file_pmids) > 0:
            existing = DBSession.query(Filedbentity).filter(
                Filedbentity.display_name == file_name).one_or_none()
            pmid_list = file_pmids
            for pmid in pmid_list:
                pmid = int(pmid.strip())
                existing_ref_file = DBSession.query(ReferenceFile).filter(
                    ReferenceFile.file_id == existing.dbentity_id).one_or_none()
                ref = DBSession.query(Referencedbentity).filter(
                    Referencedbentity.pmid == pmid).one_or_none()
                if ref and not existing_ref_file:
                    new_ref_file = ReferenceFile(
                        created_by=uname, file_id=existing.dbentity_id, reference_id=ref.dbentity_id, source_id=src_id)
                    DBSession.add(new_ref_file)

    except Exception as e:
        logging.error(e)


'''
def add_keywords(name, keywords, src_id, uname):
    """ add keywords """

    try:
        if len(keywords) > 0:
            existing = DBSession.query(Filedbentity).filter(
                Filedbentity.display_name==name).one_or_none()

            for word in keywords:
                word = word.strip()
                keyword = DBSession.query(Keyword).filter(
                    Keyword.display_name == word).one_or_none()
                existing_file_keyword = DBSession.query(FileKeyword).filter(and_(
                    FileKeyword.file_id == existing.dbentity_id, FileKeyword.keyword_id == keyword.keyword_id)).one_or_none()
                if not existing_file_keyword:
                    new_file_keyword = FileKeyword(
                        created_by=uname, file_id=existing.dbentity_id, keyword_id=keyword.keyword_id, source_id=src_id)
                    DBSession.add(new_file_keyword)

    except Exception as e:
        logging.error(e) '''

'''
def check_uploaded_files():
    """ check if all files mad it to the database """

    file_content_list = file_upload_to_obj()
    temp = []

    for item in file_content_list:
        file_exists = DBSession.query(Filedbentity).filter(
            Filedbentity.display_name == item['display_name']).one_or_none()
        if file_exists:
            temp.append(item)
    data = pd.DataFrame.from_dict(temp)
    data.to_excel('./scripts/loading/data/files_uploaded_.xlsx')'''


if __name__ == '__main__':
    print "--------------start uploading data files --------------"
    pathStr = "./scripts/loading/data/log_time_upload.txt"
    start_time = time.time()
    upload_file_obj_db_s3()
    # record time taken
    with open(pathStr, 'a+') as res_file:
        time_taken = "time taken to run upload script: " + \
            ("<---> %s seconds <--->" % (time.time() - start_time))
        now = datetime.now().strftime("%m/%d/%Y %H:%M:%S")
        res_file.write(time_taken + "timestamp: " + now + "\r\n")
        logging.info(time_taken)
        print "<---> script-run time taken: " + time_taken
