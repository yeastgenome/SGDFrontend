import csv
import os
import codecs
import json
from sqlalchemy.exc import IntegrityError
import traceback
import pandas as pd

from .loading.load_summaries_sync import load_summaries, validate_file_content_and_process
from .helpers import upload_file, file_upload_to_dict


# takes a TSV file and returns an array of annotations
def parse_tsv_annotations(
    db_session, file_upload, filename,
        template_type, username, delimiter="\t"):

    db_session.execute('SET LOCAL ROLE ' + username)
    file_extension = ''
    extensions = ['csv', 'tsv', 'txt']
    excel_extensions = ['xls', 'xlsx']
    annotations = {
        'inserts': 0,
        'updates': 0,
        'entries': []
    }

    excel_flag = False
    try:
        if(filename.endswith(tuple(extensions))):
            raw_file_content = csv.reader(
                file_upload, delimiter=delimiter)
            file_extension = os.path.splitext(filename)[1]
        elif(filename.endswith(tuple(excel_extensions))):
            excel_flag = True
            file_extension = os.path.splitext(filename)[1]
            raw_file_content = pd.read_excel(
                file_upload).fillna(0).to_dict('records')
        else:
            raise ValueError('File format not accepted. Please upload a valid file. Acceptable formats are TSV, TXT, XLS, XLSX, CSV file.')

        file_upload.seek(0)
    except IndexError as IE:
        traceback.print_exc()
        db_session.close()
        raise IndexError('File header and column mismatch, please make sure your file is formatted correctly or use other acceptable formats')
    except:
        traceback.print_exc()
        db_session.close()
        raise ValueError(
            'File format not accepted. Please upload a valid TSV, TXT or CSV file.')
            
    file_upload.seek(0)
    if excel_flag:
        annotations = validate_file_content_and_process(
            raw_file_content, db_session, username)
        db_session.close()
    else:
        file_dict = file_upload_to_dict(file_upload, delimiter)
        annotations = validate_file_content_and_process(
            file_dict, db_session, username)
        db_session.close()
    try:
        upload_file(
            username, file_upload,
            filename=filename,
            data_id=248375,
            description='summary upload',
            display_name=filename,
            format_id=248824,
            format_name=file_extension.upper(),
            file_extension=file_extension,
            topic_id=250482)
        return annotations
    except IntegrityError:
        db_session.rollback()
        db_session.close()
        raise ValueError(
            'That file has already been uploaded and cannot be reused. Please change the file contents and try again.')
