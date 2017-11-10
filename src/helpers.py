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

from .models import DBSession, Dbuser, Go, Referencedbentity, Keyword, Locusdbentity, Filepath, Edam, Filedbentity, FileKeyword, ReferenceFile

import logging
log = logging.getLogger(__name__)

FILE_EXTENSIONS = ['bed', 'bedgraph', 'bw', 'cdt', 'chain', 'cod', 'csv', 'cusp', 'doc', 'docx', 'fsa', 'gb', 'gcg', 'gff', 'gif', 'gz', 'html', 'jpg', 'pcl', 'pdf', 'pl', 'png', 'pptx', 'README', 'sql', 'sqn', 'tgz', 'txt', 'vcf', 'wig', 'wrl', 'xls', 'xlsx', 'xml', 'sql', 'txt', 'html', 'gz', 'tsv']
MAX_QUERY_ATTEMPTS = 3

import redis
disambiguation_table = redis.Redis()

# get list of URLs to visit from comma-separated ENV variable cache_urls 'url1, url2'
cache_urls = None
if 'CACHE_URLS' in os.environ.keys():
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

# try a query 3 times, fix basic DB connection problems
def dbentity_safe_query(id, entity_class):
    attempts = 0
    dbentity = None
    while attempts < MAX_QUERY_ATTEMPTS:
        try:
            if entity_class is Locusdbentity:
                dbentity = DBSession.query(Locusdbentity).filter_by(dbentity_id=id).one_or_none()
            elif entity_class is Go:
                dbentity = DBSession.query(Go).filter_by(go_id=id).one_or_none()
            break
        # close connection that has idle-in-transaction
        except InternalError:
            traceback.print_exc()
            log.info('DB error corrected. Closing idle-in-transaction DB connection.')
            DBSession.close()
            attempts += 1
        # rollback a connection blocked by previous invalid transaction
        except (StatementError, IntegrityError):
            traceback.print_exc()
            log.info('DB error corrected. Rollingback previous error in db connection')
            DBSession.rollback()
            attempts += 1
    return dbentity

def md5(fname):
    hash = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), ""):
            hash.update(chunk)
    return hash.hexdigest()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[-1] in FILE_EXTENSIONS

def secure_save_file(file, filename):
    filename = werkzeug.secure_filename(filename)
    temp_file_path = os.path.join(tempfile.gettempdir(), filename)

    file.seek(0)
    with open(temp_file_path, 'wb') as output_file:
	shutil.copyfileobj(file, output_file)

    return temp_file_path

def curator_or_none(email):
    return DBSession.query(Dbuser).filter((Dbuser.email == email) & (Dbuser.status == 'Current')).one_or_none()

def extract_references(request):
    references = []
    if request.POST.get("pmids") != '':
        pmids = str(request.POST.get("pmids")).split(",")
        for pmid in pmids:
            try:
                f_pmid = float(pmid)
            except ValueError:
                log.info('Upload error: PMIDs must be integer numbers. Sent: ' + pmid)
                raise HTTPBadRequest('PMIDs must be integer numbers. You sent: ' + pmid)
            
            reference = DBSession.query(Referencedbentity).filter(Referencedbentity.pmid == f_pmid).one_or_none()
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
            keyword_obj = DBSession.query(Keyword).filter(Keyword.keyword_id == keyword_id).one_or_none()
            if keyword_obj is None:
                log.info('Upload error: invalid or nonexistent Keyword ID: ' + keyword_id)
                raise HTTPBadRequest('Invalid or nonexistent Keyword ID: ' + keyword_id)
            else:
                keywords.append(keyword_obj.keyword_id)
    return keywords

def get_or_create_filepath(request):
    filepath = DBSession.query(Filepath).filter(Filepath.filepath == request.POST.get("new_filepath")).one_or_none()

    if filepath is None:
        filepath = Filepath(filepath=request.POST.get("new_filepath"), source_id=339)
        DBSession.add(filepath)
        DBSession.flush()
        DBSession.refresh(filepath)
    return filepath

def extract_topic(request):
    topic = DBSession.query(Edam).filter(Edam.edam_id == request.POST.get("topic_id")).one_or_none()
    if topic is None:
        log.info('Upload error: Topic ID ' + request.POST.get("topic_id") + ' is not registered or is invalid.')
        raise HTTPBadRequest('Invalid or nonexistent Topic ID: ' + request.POST.get("topic_id"))
    return topic

def extract_format(request):
    format = DBSession.query(Edam).filter(Edam.edam_id == request.POST.get("format_id")).one_or_none()
    if format is None:
        log.info('Upload error: Format ID ' + request.POST.get("format_id") + ' is not registered or is invalid.')
        raise HTTPBadRequest('Invalid or nonexistent Format ID: ' + request.POST.get("format_id"))
    return format

def file_already_uploaded(request):
    fdb = DBSession.query(Filedbentity).filter(Filedbentity.format_name == request.POST.get("display_name")).one_or_none()
    if fdb is not None:
        log.info('Upload error: File ' + request.POST.get("display_name") + ' already exists.')
        return True
    return False

def link_references_to_file(references, fdb_dbentity_id):
    for reference_id in references:
        rf = ReferenceFile(
            reference_id=reference_id,
            file_id=fdb_dbentity_id,
            source_id=339
        )
        DBSession.add(rf)
    DBSession.commit()

def link_keywords_to_file(keywords, fdb_dbentity_id):
    for keyword_id in keywords:
        fk = FileKeyword(
            keyword_id=keyword_id,
            file_id=fdb_dbentity_id,
            source_id=339
        )
        DBSession.add(fk)
    DBSession.commit()

def calc_venn_measurements(A, B, C):
    e = .01
    r = sqrt(1.0*A/pi)
    s = sqrt(1.0*B/pi)
    if A == C or B == C:
        return r, s, abs(r-s)-1
    elif C == 0:
        return r, s, r+s+1
    else:
        x = binary_search(C, lambda x: area_of_intersection(r, s, x), abs(r-s), r+s, e)
        return r, s, x
    
def binary_search(value, f, lower, upper, e, max_iter=None):
    midpoint = lower + 1.0*(upper-lower)/2
    value_at_midpoint = f(midpoint)

    if max_iter is not None:
        max_iter = max_iter - 1
        
    if abs(value_at_midpoint - value) < e or (max_iter is not None and max_iter == 0):
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
    # get file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    try:
        md5sum = hashlib.md5(file.read()).hexdigest()
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
            created_by=username,
            file_size=file_size
        )
        DBSession.add(fdb)
        DBSession.flush()
        did = fdb.dbentity_id
        transaction.commit()
        DBSession.flush()
        fdb = DBSession.query(Filedbentity).filter(Filedbentity.dbentity_id == did).one_or_none()
        fdb.upload_file_to_s3(file, filename)
    except Exception as e:
        DBSession.rollback()
        DBSession.remove()
        raise(e)

def area_of_intersection(r, s, x):
    if x <= abs(r-s):
        return min(pi*pow(r, 2), pi*pow(s, 2))
    elif x > r+s:
        return 0
    else:
        return pow(r,2)*acos(1.0*(pow(x,2) + pow(r,2) - pow(s,2))/(2*x*r)) + pow(s,2)*acos(1.0*(pow(x,2) + pow(s,2) - pow(r,2))/(2*x*s)) - .5*sqrt((-x+r+s)*(x+r-s)*(x-r+s)*(x+r+s))

def link_gene_names(raw, locus_names_ids):
    # first create an object with display_name as key and sgdid as value
    locus_names_object = {}
    for d in locus_names_ids:
        display_name = d[0]
        sgdid = d[1]
        locus_names_object[display_name] = sgdid
    processed = raw
    words = raw.split(' ')
    for p_original_word in words:
        original_word = p_original_word.translate(None, string.punctuation)
        wupper = original_word.upper()
        if wupper in locus_names_object.keys() and len(wupper) > 3:
            sgdid = locus_names_object[wupper]
            url = '/locus/'  + sgdid
            new_str = '<a href="' + url + '">' + wupper + '</a>'
            processed = processed.replace(original_word, new_str)
    return processed
