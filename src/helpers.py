from math import pi, sqrt, acos
import datetime
import hashlib
import werkzeug
import os
import shutil
import string
import tempfile
import transaction
from pyramid.httpexceptions import HTTPForbidden, HTTPBadRequest, HTTPNotFound
from sqlalchemy.exc import IntegrityError, InternalError, StatementError
import traceback
import requests
import json
import csv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
from sqlalchemy import and_, inspect

from .models import DBSession, Dbentity, Dbuser, Go, Referencedbentity,\
    Keyword, Locusdbentity, FilePath, Edam, Filedbentity, FileKeyword,\
    ReferenceFile, Disease, CuratorActivity, Source
from src.curation_helpers import ban_from_cache, get_curator_session
from src.aws_helpers import update_s3_readmefile, get_s3_url


import logging
log = logging.getLogger(__name__)

FILE_EXTENSIONS = [
    'bed', 'bedgraph', 'bw', 'cdt', 'chain', 'cod', 'csv', 'cusp', 'doc',
    'docx', 'fsa', 'gb', 'gcg', 'gff', 'gif', 'gz', 'html', 'jpg', 'pcl', 'pdf',
    'pl', 'png', 'pptx', 'README', 'sql', 'sqn', 'tgz', 'txt', 'vcf', 'wig',
    'wrl', 'xls', 'xlsx', 'xml', 'sql', 'txt', 'html', 'gz', 'tsv'
]
MAX_QUERY_ATTEMPTS = 3
S3_BUCKET = os.environ['S3_BUCKET']

import redis
disambiguation_table = redis.Redis()

# get list of URLs to visit from comma-separated ENV variable cache_urls 'url1, url2'
cache_urls = None
if 'CACHE_URLS' in list(os.environ.keys()):
    cache_urls = os.environ['CACHE_URLS'].split(',')
else:
    cache_urls = ['http://localhost:6545']


# safe return returns None if not found instead of 404 exception
def extract_id_request(request, prefix, param_name='id', safe_return=False):
    id = str(request.matchdict[param_name])

    db_id = disambiguation_table.get(("/" + prefix + "/" + id).upper())

    if db_id is None and safe_return:
        return None
    elif db_id is None:
        raise HTTPNotFound()
    else:
        if prefix == 'author':
            return db_id
        else:
            return int(db_id)


def get_locus_by_id(id):
    return dbentity_safe_query(id, Locusdbentity)


def get_go_by_id(id):
    return dbentity_safe_query(id, Go)

def get_disease_by_id(id):
    return dbentity_safe_query(id, Disease)


# try a query 3 times, fix basic DB connection problems
def dbentity_safe_query(id, entity_class):
    attempts = 0
    dbentity = None
    while attempts < MAX_QUERY_ATTEMPTS:
        try:
            if entity_class is Locusdbentity:
                dbentity = DBSession.query(Locusdbentity).filter_by(
                    dbentity_id=id).one_or_none()
            elif entity_class is Go:
                dbentity = DBSession.query(Go).filter_by(go_id=id).one_or_none()
            elif entity_class is Disease:
                dbentity = DBSession.query(Disease).filter_by(disease_id=id).one_or_none()
            break
        # close connection that has idle-in-transaction
        except InternalError:
            traceback.print_exc()
            log.info(
                'DB error corrected. Closing idle-in-transaction DB connection.'
            )
            DBSession.close()
            attempts += 1
        # rollback a connection blocked by previous invalid transaction
        except (StatementError, IntegrityError):
            traceback.print_exc()
            log.info(
                'DB error corrected. Rollingback previous error in db connection'
            )
            DBSession.rollback()
            attempts += 1
    return dbentity


def md5(fname):
    hash = hashlib.md5()
    with open(fname, "r") as f:
        for chunk in iter(lambda: f.read(4096), ""):
            hash.update(chunk.encode("utf-8"))
    return hash.hexdigest()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[-1] in FILE_EXTENSIONS


def secure_save_file(file, filename):
    filename = werkzeug.secure_filename(filename)
    temp_file_path = os.path.join(tempfile.gettempdir(), filename)

    file.seek(0)
    with open(temp_file_path, 'w') as output_file:
        shutil.copyfileobj(file, output_file)

    return temp_file_path


def curator_or_none(email):
    return DBSession.query(Dbuser).filter(
        (Dbuser.email == email) & (Dbuser.status == 'Current')).one_or_none()


def extract_references(request):
    references = []
    if request.POST.get("pmids") != '':
        pmids = str(request.POST.get("pmids")).split(",")
        for pmid in pmids:
            try:
                f_pmid = float(pmid)
            except ValueError:
                log.info('Upload error: PMIDs must be integer numbers. Sent: ' +
                         pmid)
                raise HTTPBadRequest('PMIDs must be integer numbers. You sent: '
                                     + pmid)

            reference = DBSession.query(Referencedbentity).filter(
                Referencedbentity.pmid == f_pmid).one_or_none()
            if reference is None:
                log.info('Upload error: nonexistent PMID(s): ' + pmid)
                raise HTTPBadRequest('Nonexistent PMID(s): ' + pmid)
            else:
                references.append(reference.dbentity_id)
    return references


def extract_keywords(request):
    keywords = []
    if request.POST.get("keyword_ids") != '':
        keyword_ids = str(request.POST.get("keyword_ids")).split(",")
        for keyword_id in keyword_ids:
            keyword_obj = DBSession.query(Keyword).filter(
                Keyword.keyword_id == keyword_id).one_or_none()
            if keyword_obj is None:
                log.info('Upload error: invalid or nonexistent Keyword ID: ' +
                         keyword_id)
                raise HTTPBadRequest('Invalid or nonexistent Keyword ID: ' +
                                     keyword_id)
            else:
                keywords.append(keyword_obj.keyword_id)
    return keywords


def get_or_create_filepath(request):
    filepath = DBSession.query(FilePath).one_or_none()

    if filepath is None:
        filepath = FilePath(source_id=339)
        DBSession.add(filepath)
        DBSession.flush()
        DBSession.refresh(filepath)
    return filepath


def extract_topic(request):
    topic = DBSession.query(Edam).filter(
        Edam.edam_id == request.POST.get("topic_id")).one_or_none()
    if topic is None:
        log.info('Upload error: Topic ID ' + request.POST.get("topic_id") +
                 ' is not registered or is invalid.')
        raise HTTPBadRequest('Invalid or nonexistent Topic ID: ' +
                             request.POST.get("topic_id"))
    return topic


def extract_format(request):
    format = DBSession.query(Edam).filter(
        Edam.edam_id == request.POST.get("format_id")).one_or_none()
    if format is None:
        log.info('Upload error: Format ID ' + request.POST.get("format_id") +
                 ' is not registered or is invalid.')
        raise HTTPBadRequest('Invalid or nonexistent Format ID: ' +
                             request.POST.get("format_id"))
    return format


def file_already_uploaded(request):
    fdb = DBSession.query(Filedbentity).filter(
        Filedbentity.format_name == request.POST.get(
            "display_name")).one_or_none()
    if fdb is not None:
        log.info('Upload error: File ' + request.POST.get("display_name") +
                 ' already exists.')
        return True
    return False


def link_references_to_file(references, fdb_dbentity_id):
    for reference_id in references:
        rf = ReferenceFile(
            reference_id=reference_id, file_id=fdb_dbentity_id, source_id=339)
        DBSession.add(rf)
    DBSession.commit()


def link_keywords_to_file(keywords, fdb_dbentity_id):
    for keyword_id in keywords:
        fk = FileKeyword(
            keyword_id=keyword_id, file_id=fdb_dbentity_id, source_id=339)
        DBSession.add(fk)
    DBSession.commit()


def calc_venn_measurements(A, B, C):
    e = .01
    r = sqrt(1.0 * A / pi)
    s = sqrt(1.0 * B / pi)
    if A == C or B == C:
        return r, s, abs(r - s) - 1
    elif C == 0:
        return r, s, r + s + 1
    else:
        x = binary_search(C, lambda x: area_of_intersection(r, s, x),
                          abs(r - s), r + s, e)
        return r, s, x


def binary_search(value, f, lower, upper, e, max_iter=None):
    midpoint = lower + 1.0 * (upper - lower) / 2
    value_at_midpoint = f(midpoint)

    if max_iter is not None:
        max_iter = max_iter - 1

    if abs(value_at_midpoint - value) < e or (max_iter is not None and
                                              max_iter == 0):
        return midpoint
    elif value > value_at_midpoint:
        return binary_search(value, f, lower, midpoint, e, max_iter)
    else:
        return binary_search(value, f, midpoint, upper, e, max_iter)


# creates Filedbentity, uploads to s3, and updates Filedbentity row with s3_url
def upload_file(username, file, **kwargs):
    filename = kwargs.get('filename')
    data_id = kwargs.get('data_id')
    topic_id = kwargs.get('topic_id')
    format_id = kwargs.get('format_id')
    is_public = kwargs.get('is_public', False)
    is_in_spell = kwargs.get('is_in_spell', False)
    is_in_browser = kwargs.get('is_in_browser', False)
    file_date = kwargs.get('file_date')
    if file_date is None:
        file_date = datetime.datetime.now()
    json = kwargs.get('json', None)
    year = kwargs.get('year', file_date.year)
    file_extension = kwargs.get('file_extension')
    display_name = kwargs.get('display_name')
    format_name = kwargs.get('format_name', display_name)
    source_id = kwargs.get('source_id', 834)
    status = kwargs.get('status', 'Active')
    description = kwargs.get('description', None)
    readme_file_id = kwargs.get('readme_file_id', None)
    full_file_path = kwargs.get('full_file_path', None)
    md5sum = kwargs.get('md5sum', None)
    # get file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    try:
        if md5sum is None:
            with open(full_file_path, 'rb') as f:
                print("file path: " + full_file_path)
                md5sum = hashlib.md5(f.read()).hexdigest()
        fdb = Filedbentity(
            md5sum=md5sum,
            previous_file_name=filename,
            data_id=data_id,
            topic_id=topic_id,
            format_id=format_id,
            file_date=file_date,
            json=json,
            year=year,
            is_public=is_public,
            is_in_spell=is_in_spell,
            is_in_browser=is_in_browser,
            source_id=source_id,
            file_extension=file_extension,
            format_name=format_name,
            display_name=display_name,
            s3_url=None,
            dbentity_status=status,
            description=description,
            readme_file_id=readme_file_id,
            subclass='FILE',
            created_by=username.upper(),
            file_size=file_size)
        DBSession.add(fdb)
        DBSession.flush()
        did = fdb.dbentity_id
        transaction.commit()
        DBSession.flush()
        fdb = DBSession.query(Filedbentity).filter(
            Filedbentity.dbentity_id == did).one_or_none()
        fdb.upload_file_to_s3(file, filename, full_file_path)
    except Exception as e:
        DBSession.rollback()
        DBSession.remove()
        raise (e)


def area_of_intersection(r, s, x):
    if x <= abs(r - s):
        return min(pi * pow(r, 2), pi * pow(s, 2))
    elif x > r + s:
        return 0
    else:
        return pow(r, 2) * acos(1.0 * (pow(x, 2) + pow(r, 2) - pow(s, 2)) / (
            2 * x * r)) + pow(s, 2) * acos(1.0 *
                                           (pow(x, 2) + pow(s, 2) - pow(r, 2)) /
                                           (2 * x * s)) - .5 * sqrt(
                                               (-x + r + s) * (x + r - s) *
                                               (x - r + s) * (x + r + s))


def link_gene_names(raw, locus_names_ids):
    # first create an object with display_name as key and sgdid as value
    locus_names_object = {}
    for d in locus_names_ids:
        display_name = d[0]
        sgdid = d[1]
        locus_names_object[display_name] = sgdid
    processed = raw
    words = raw.split(' ')
    delete_dict = {sp_character: '' for sp_character in string.punctuation}
    table = str.maketrans(delete_dict)
    for p_original_word in words:
        original_word = str(p_original_word).translate(table)
        wupper = original_word.upper()
        if wupper in list(locus_names_object.keys()) and len(wupper) > 3:
            sgdid = locus_names_object[wupper]
            url = '/locus/' + sgdid
            new_str = '<a href="' + url + '">' + wupper + '</a>'
            processed = processed.replace(original_word, new_str)
    return processed


def primer3_parser(primer3_results):
    ''' Parse Primer3 designPrimers output, and sort it into a hierachical
   dictionary structure of primer pairs.

   This method return 2 outputs, the list of primer pairs and a dictionary with
   notes (the explanatory output from Primer3).

   Author: Martin CF Thomsen
   '''
    primer_pairs = {}
    notes = {}
    for k in primer3_results:
        if 'PRIMER_RIGHT' == k[:12]:
            key = 'right'
            tmp = k[13:].split('_', 1)
            if tmp[0].isdigit():
                id = int(tmp[0])
                if not id in primer_pairs:
                    primer_pairs[id] = {'pair': {}, 'right': {}, 'left': {},
                                        'internal': {}}
                if len(tmp) > 1:
                    key2 = tmp[1].lower()
                    primer_pairs[id][key][key2] = primer3_results[k]
                else:
                    primer_pairs[id][key]['position'] = primer3_results[k][0]
                    primer_pairs[id][key]['length'] = primer3_results[k][1]
            elif tmp[0] == 'EXPLAIN':
                notes[key] = primer3_results[k]
            elif tmp == ['NUM','RETURNED']: pass
            else:
                print(k)
        elif 'PRIMER_LEFT' == k[:11]:
            key = 'left'
            tmp = k[12:].split('_', 1)
            if tmp[0].isdigit():
                id = int(tmp[0])
                if not id in primer_pairs:
                    primer_pairs[id] = {'pair': {}, 'right': {}, 'left': {},
                                        'internal': {}}
                if len(tmp) > 1:
                    key2 = tmp[1].lower()
                    primer_pairs[id][key][key2] = primer3_results[k]
                else:
                    primer_pairs[id][key]['position'] = primer3_results[k][0]
                    primer_pairs[id][key]['length'] = primer3_results[k][1]
            elif tmp[0] == 'EXPLAIN':
                notes[key] = primer3_results[k]
            elif tmp == ['NUM','RETURNED']: pass
            else:
                print(k)
        elif 'PRIMER_PAIR' == k[:11]:
            key = 'pair'
            tmp = k[12:].split('_', 1)
            if tmp[0].isdigit():
                id = int(tmp[0])
                if not id in primer_pairs:
                    primer_pairs[id] = {'pair': {}, 'right': {}, 'left': {},
                                        'internal': {}}
                if len(tmp) > 1:
                    key2 = tmp[1].lower()
                    primer_pairs[id][key][key2] = primer3_results[k]
                else:
                    print((k, primer3_results[k]))
            elif tmp[0] == 'EXPLAIN':
                notes[key] = primer3_results[k]
            elif tmp == ['NUM','RETURNED']: pass
            else:
                print(k)
        elif 'PRIMER_INTERNAL' == k[:15]:
            key = 'internal'
            tmp = k[16:].split('_', 1)
            if tmp[0].isdigit():
                id = int(tmp[0])
                if not id in primer_pairs:
                    primer_pairs[id] = {'pair': {}, 'right': {}, 'left': {},
                                        'internal': {}}
                if len(tmp) > 1:
                    key2 = tmp[1].lower()
                    primer_pairs[id][key][key2] = primer3_results[k]
                else:
                    primer_pairs[id][key]['position'] = primer3_results[k][0]
                    primer_pairs[id][key]['length'] = primer3_results[k][1]
            elif tmp[0] == 'EXPLAIN':
                notes['pair'] = primer3_results[k]
            elif tmp == ['NUM','RETURNED']: pass
            else:
                print((k, tmp[0]))
        else:
            print(k)

    return list(map(primer_pairs.get, sorted(primer_pairs.keys()))), notes


def file_upload_to_dict(file_upload, delimiter="\t"):
    ''' parse file to list of dictionaries

    Paramaters
    ----------
    file: file_upload object

    Returns
    -------
    list
        dictionary: each file row becomes a dictionary with column headers
                    as keys.

    '''
    list_dictionary = []
    if(file_upload):
        delimiter = delimiter
        csv_obj = csv.DictReader(file_upload, delimiter=delimiter)
        for item in csv_obj:
            list_dictionary.append(
                {k.decode('utf-8-sig'): v
                 for k, v in list(item.items()) if k not in (None, '')}
                )
        return list_dictionary
    else:
        return list_dictionary


def send_newsletter_email(subject, recipients, msg):
    try:
        SENDER_EMAIL = "Mike Cherry <cherry@stanford.edu>" 
        REPLY_TO = "sgd-helpdesk@lists.stanford.edu"

        message = MIMEMultipart("alternative")        
        message["Subject"] = subject
        message["From"] = SENDER_EMAIL
        message.add_header('reply-to',REPLY_TO)
        html_message = MIMEText(msg, "html")
        message.attach(html_message)
        
        server = smtplib.SMTP("localhost", 25)
        any_recipients_error = server.sendmail(SENDER_EMAIL, recipients, message.as_string())
        server.quit()

        if(len(any_recipients_error) > 0):
            error_message = ''
            for key in any_recipients_error:
                error_message = error_message + ' ' + key + ' ' + str(any_recipients_error[key]) + ' ;' + '\n'
            
            error_message = "Email sending unsuccessful for this recipients " + error_message
            return {"error": error_message}
                
        return {"success": "Email was successfully sent."}

    except smtplib.SMTPHeloError as e:
        return {"error", "The server didn't reply properly to the helo greeting. "}
    except smtplib.SMTPRecipientsRefused as e:
        return {"error", "The server rejected ALL recipients (no mail was sent)."}
    except smtplib.SMTPSenderRefused as e:
        return {"error", "The server didn't accept the sender's email"}
    except smtplib.SMTPDataError as e:
        return {"error", "The server replied with an unexpected"}
    except Exception as e:
        return {"error":"Error occured while sending email."}

#TODO: abstract this function in second release
def update_curate_activity(locus_summary_object):
    ''' Add curator locus-summary event to curator activity table
    
    Paramaters
    ----------
    locus_summary_object: LocusSummary
        locus-summary object
    
    Returns
    -------
    bool: The return value. True for success, False otherwise
    '''
    flag = False
    try:
        curator_session = get_curator_session(locus_summary_object['created_by'])
        existing = curator_session.query(CuratorActivity).filter(CuratorActivity.dbentity_id == locus_summary_object['dbentity_id']).one_or_none()
        message = 'added'
        if existing:
            #curator_session.delete(existing)
            message = 'updated'
        new_curate_activity = CuratorActivity(
            display_name=locus_summary_object['display_name'],
            obj_url=locus_summary_object['obj_url'],
            activity_category=locus_summary_object['activity_category'],
            dbentity_id=locus_summary_object['dbentity_id'],
            message=message,
            json=locus_summary_object['json'],
            created_by=locus_summary_object['created_by']
        )
        curator_session.add(new_curate_activity)
        transaction.commit()
        flag = True
    except Exception as e:
        traceback.print_exc()
        transaction.abort()
        raise(e)
        
    return flag


def set_string_format(str_param, char_format='_'):
    ''' format given string to replace space with underscore character
    Parameters
    ----------
    string: str_param
    string: char_format
            needs to be single character
    Returns
    -------
    string
        returns formated string or empty string if parameter str_param is not provided/empty or if char_format length is greater than 1
    '''
    if str_param and len(char_format) == 1:
        str_arr = str_param.strip().split(' ')
        temp_str = ''
        for element in str_arr:
            temp_str += element + char_format
        if temp_str.endswith(char_format):
            temp_str = temp_str[:-1]
        return temp_str
    else:
        return None

def get_file_delimiter(file_upload):
    ''' Check file delimiters

    Parameters
    ----------
    file_upload: file

    Returns
    -------
    string
        delimiter character

    '''

    if file_upload:
        temp = file_upload.readline()
        dialect = csv.Sniffer().sniff(
            temp, [',', '|', '\t', ';'])
        file_upload.seek(0)
        return dialect.delimiter
    else:
        raise ValueError(
            'file format error, acceptable formats are txt, tsv, xls')
#TODO: develop this into an endpoint that will check the file before uploading in the next release
def summary_file_is_valid(file_upload):
    ''' Check if file is valid for upload

    Parameters
    ----------
    file_upload: file

    Returns
    -------
    dict

    '''

    obj = {'message': '', 'flag': True}
    header_literal = [
        '# Feature',
        'Summary Type (phenotype, regulation, disease, interaction, sequence, protein )',
        'Summary', 'PMIDs'
    ]
    key_feature = re.compile(r".*feature$", re.IGNORECASE)
    file_gene_ids = []
    for item in file_upload:
        for k, v in item.items():
            if key_feature.match(k):
                gene_id = item.get(k, None)
                if gene_id:
                    file_gene_ids.append(gene_id.strip())
                
    valid_genes = DBSession.query(Locusdbentity.format_name).filter(
        Locusdbentity.format_name.in_(file_gene_ids)).all()
    valid_genes = [str(d[0]) for d in valid_genes]
    invalid_genes = [d for d in file_gene_ids if d not in valid_genes]
    if (len(item) != len(header_literal)):
        obj['message'] = 'Row or header has incorrect number of columns'
        obj['flag'] = False
    if len(invalid_genes) > 0:
        obj['message'] = 'Invalid gene identifier: ' + \
            ', '.join(invalid_genes)
        obj['flag'] = False
    return obj


def unicode_to_string(unicode_value):
    try:
        returnValue = unicode_value.encode('ascii', 'ignore')
        return returnValue
    except UnicodeEncodeError as err:
        return None


def update_curator_feed(update_obj, msg=None, curator_session=None):
    if curator_session is None:
        curator_session = DBSession
    flag = False
    if msg is None:
        msg = 'added'
    msg = 'added'
    try:
        exists = curator_session.query(CuratorActivity).filter(
            CuratorActivity.dbentity_id == update_obj['dbentity_id']).one_or_none()
        if exists:
            exists.display_name = update_obj['display_name']
            exists.obj_url = update_obj['s3_url']
            exists.activity_category = update_obj['activity_category']
            exists.dbentity_id = update_obj['dbentity_id']
            exists.message = 'updated'
            exists.json = update_obj['json']
            exists.created_by = update_obj['created_by']

        else:
            new_curator_activity = CuratorActivity(
                display_name=update_obj['display_name'],
                obj_url=update_obj['s3_url'],
                activity_category=update_obj['activity_category'],
                dbentity_id=update_obj['dbentity_id'],
                message='Added',
                json=update_obj['json'],
                created_by=update_obj['created_by']
            )
            curator_session.add(new_curator_activity)

        flag = True

    except Exception as e:
        raise(e)

    return flag


def update_readme_files_with_urls(readme_name, update_all=False):
    """ Update parent readme files with list of s3 urls
    Notes:
        The parent readme file should contain all the s3 urls of files
        under the parent folder
        create a dictionary with parent_readme name as key and value as list of files
    """
    try:
        if not update_all:
            temp = []

            if readme_name:
                readme_file = DBSession.query(Dbentity).filter(
                    Dbentity.display_name == readme_name).one_or_none()

                if readme_file:
                    update_urls_helper(readme_file)
                    #transaction.commit()
        else:
            all_files = DBSession.query(Dbentity).all()

            for _file in all_files:
                if _file.display_name.endswith('.README'):
                    update_urls_helper(_file)

    except Exception as e:
        logging.error("Exception occurred", exc_info=True)
        transaction.abort()


def update_urls_helper(readme_file):
    """ Update files with s3_urls helper"""

    temp = []
    file_list = DBSession.query(Filedbentity).filter(
        Filedbentity.readme_file_id == readme_file.dbentity_id).all()
    if file_list:
        for item in file_list:
            s3_url = item.s3_url
            if s3_url:
                temp.append(s3_url)
            else:
                s3_url = get_s3_url(item.display_name, item.sgdid)
                temp.append(s3_url)
    if temp:
        updated_readme = update_s3_readmefile(
            temp, readme_file.dbentity_id, readme_file.sgdid, readme_file.display_name, S3_BUCKET)
        if updated_readme:
            readme_dbentity_file = DBSession.query(
                Filedbentity).filter(Filedbentity.dbentity_id == readme_file.dbentity_id).one_or_none()
            readme_dbentity_file.md5sum = updated_readme['md5sum']
            readme_dbentity_file.file_size = updated_readme['file_size']
            readme_dbentity_file.s3_url = re.sub(
                r'\?.+', '', updated_readme['s3_url']).strip()


def get_sources(session=None):
    ''' Get sources from dbentity model '''

    data = DBSession.query(Dbentity).all()
    temp = set()
    for item in data:
        temp.add(item.source.display_name)

    return list(temp)


def get_file_keywords(session=None):

    data = DBSession.query(FileKeyword).all()
    temp = set()

    for item in data:

        temp.add(item.keyword.display_name)

    return list(temp)


def get_edam_data(session=None):
    """ Get topic ided based on edam relation
    Returns
    -------
    dict:
        file_id(key): edam.display_name 
    
    Notes:
        From filedbentity topic_id, mapp to Edam table and get the Edam.display_name
        query and filter where edam_namespace is 'topic'
    """

    data = DBSession.query(Filedbentity).all()
    n_spaces = ['topic', 'data', 'format']
    temp = []
    data_obj = {}
    for item in data:
        name = item.topic.display_name
        name_space = item.topic.edam_namespace

        if name_space in data_obj:
            if name not in data_obj[name_space] and name_space in n_spaces:
                data_obj[name_space].append(name)
        else:
            if name_space in n_spaces:
                data_obj[name_space] = []

    return data_obj


def get_file_curate_dropdown_data(session=None):
    ''' Get dropdown menus for new file curate form '''

    data = get_edam_data()
    if data:
        data['keywords'] = get_file_keywords()
        data['sources'] = get_sources()
        data['status'] = ['Active', 'Archived']
    return data


def file_curate_update_readme(obj, session=None):
    readme_file = DBSession.query(
        Filedbentity).filter(Filedbentity.display_name == obj['display_name']).one_or_none()
    if readme_file:
        readme_file.upload_file_to_s3(obj['file'], obj['file_name'])


def upload_new_file(req_obj, session=None):
    try:
        if req_obj:
            other_extensions = ('zip', '.gz', '.sra')
            readme_file = {}
            other_files = []
            readme_file_id = None
            username = req_obj['uname']
            curator_session = get_curator_session(username)

            for key, val in req_obj.items():
                if key.endswith('.README'):
                    existing_readme_meta = get_existing_meta_data(
                        req_obj['displayName'], curator_session)
                    keywords = re.split(',|\|', req_obj['keywords'])
                    if existing_readme_meta:
                        existing_readme_meta.display_name = req_obj['displayName']
                        existing_readme_meta.description = req_obj['description']
                        existing_readme_meta.status = req_obj['status']
                        existing_readme_meta.is_public = True
                        existing_readme_meta.is_in_spell = False
                        existing_readme_meta.is_in_browser = False
                        existing_readme_meta.file_date = datetime.datetime.strptime(
                            req_obj['file_date'], '%Y-%m-%d')
                        readme_file_id = existing_readme_meta.dbentity_id
                        existing_readme_meta.upload_file_to_s3(
                            val, req_obj['displayName'])
                        add_keywords(req_obj['displayName'],
                                     keywords, req_obj['source_id'], username, curator_session)
                        update_obj = {
                            'display_name': req_obj['displayName'],
                            'created_by': username,
                            's3_url': existing_readme_meta.s3_url,
                            'activity_category': 'download',
                            'dbentity_id': existing_readme_meta.dbentity_id,
                            'json': json.dumps({"file curation data": existing_readme_meta.to_simple_dict(), "modified_date": str(datetime.datetime.now())}),
                        }
                        msg = 'Add readme file for file curation'
                        update_curator_feed(update_obj, msg)
                    '''else:
                        #TODO: finish this method after getting metadata from Mike
                        new_obj = {
                            'display_name': req_obj['displayName'],
                            'description': req_obj['description'],
                            'status': req_obj['status'],
                            'is_public': True,
                            'is_in_spell': False,
                            'is_in_browser': False
                        }
                    '''
                if key.endswith(other_extensions):
                    other_files.append(
                        {
                            'display_name': req_obj['displayName'],
                            'file': val,
                            'file_name': key,
                            'description': req_obj['description'],
                            'status': req_obj['status'],
                            'file_date': req_obj['file_date']
                        })

            if len(other_files) > 0:
                update_from_s3 = None
                for item in other_files:
                    db_file = get_existing_meta_data(
                        item['display_name'], curator_session)
                    if db_file:
                        update_from_s3 = add_file_meta_db(
                            db_file, item, db_file.readme_file_id, curator_session)
                        # update activities
                        update_obj = {
                            'display_name': item['display_name'],
                            'created_by': username,
                            's3_url': db_file.s3_url,
                            'activity_category': 'download',
                            'dbentity_id': db_file.dbentity_id,
                            'json': json.dumps({'file curation data': db_file.to_simple_dict(), "modified_date": str(datetime.datetime.now())}),
                        }
                        msg = 'Add file for file curation'
                        update_curator_feed(update_obj, msg, curator_session)
            transaction.commit()
            DBSession.flush()
            return True
    except Exception as e:
        transaction.abort()
        raise(e)


def add_file_meta_db(db_file, obj, readme_id=None, curator_session=None):
    try:
        if curator_session is None:
            curator_session = DBSession
        if db_file and obj:
            db_file.display_name = obj['display_name']
            db_file.description = obj['description']
            db_file.status = obj['status']
            db_file.file_date = obj['file_date']
            db_file.is_public = True
            db_file.is_in_spell = False
            db_file.is_in_browser = False
            flag = db_file.upload_file_to_s3(
                obj['file'], obj['display_name'])

            if readme_id:
                db_file.readme_file_id = readme_id
                readme_file = curator_session.query(Filedbentity).filter(
                    Filedbentity.dbentity_id == readme_id).one_or_none()
                if readme_file:
                    if flag:
                        update_readme_files_with_urls(readme_file.display_name)

    except Exception as e:
        raise(e)


def get_existing_meta_data(display_name=None, curator_session=None):

    result = None
    if curator_session is None:
        curator_session = DBSession
    if display_name:
        result = curator_session.query(Filedbentity).filter(
            Filedbentity.display_name == display_name).one_or_none()

    return result


def get_source_id(source=None):
    result = None
    if source:
        result = DBSession.query(Source.source_id).filter(
            Source.display_name == source).one_or_none()[0]


def get_file_details(display_name):
    if display_name:
        file_data = DBSession.query(Filedbentity).filter(
            Filedbentity.display_name == display_name).one_or_none()
        if file_data:
            readme = file_data.readme_file
            if readme:
                return readme.to_dict()
            else:
                return file_data.to_dict()
        else:
            return None
    else:
        return None


def add_keywords(name, keywords, src_id, uname, curator_session=None):
    """ add keywords """

    try:
        if curator_session is None:
            curator_session = DBSession
        if len(keywords) > 0:
            existing = curator_session.query(Filedbentity).filter(
                Filedbentity.display_name == name).one_or_none()
            if existing:
                for word in keywords:
                    word = word.strip()
                    keyword = curator_session.query(Keyword).filter(
                        Keyword.display_name == word).one_or_none()
                    existing_file_keyword = curator_session.query(FileKeyword).filter(and_(
                        FileKeyword.file_id == existing.dbentity_id, FileKeyword.keyword_id == keyword.keyword_id)).one_or_none()
                    if not existing_file_keyword:
                        new_file_keyword = FileKeyword(
                            created_by=uname, file_id=existing.dbentity_id, keyword_id=keyword.keyword_id, source_id=src_id)
                        curator_session.add(new_file_keyword)

    except Exception as e:
        logging.error("Exception occurred", exc_info=True)


