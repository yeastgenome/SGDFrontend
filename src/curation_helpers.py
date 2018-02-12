import string
import re
import os
import pusher
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from telnetlib import Telnet
from zope.sqlalchemy import ZopeTransactionExtension

cache_urls = None
if 'CACHE_URLS' in os.environ.keys():
    cache_urls = os.environ['CACHE_URLS'].split(',')
else:
    cache_urls = ['http://localhost:6545']

def link_gene_names(raw, locus_names_ids, ignore_str=''):
    if ignore_str is None:
        ignore_str = ''
    # first create an object with display_name as key and sgdid as value
    locus_names_object = {}
    for d in locus_names_ids:
        display_name = d[0]
        sgdid = d[1]
        locus_names_object[display_name] = sgdid
    processed = raw
    words = list(set(re.split('\W+', raw) + raw.split(' ')))
    for p_original_word in words:
        original_word = p_original_word
        wupper = original_word.upper()
        has_p = wupper.endswith('P')
        if has_p:
            wupper = wupper[:-1]
        if wupper == ignore_str.upper():
            continue
        if wupper in locus_names_object.keys() and len(wupper) >= 2:
            sgdid = locus_names_object[wupper]
            url = '/locus/'  + sgdid
            new_str = '<a href="' + url + '">' + original_word + '</a>'
            target_regex = r'\b' + re.escape(original_word) + r'\b'
            # ingore if original word not all uppercase and doesn't end with p
            processed = re.sub(target_regex, new_str, processed)
    return processed

# take pipe separated list and return list of integers
def process_pmid_list(raw):
    raw = raw.strip()
    if len(raw) == 0:
        return []
    p_list = raw.split()
    try:
        return [int(x) for x in p_list]
    except ValueError, e:
        raise ValueError('PMIDs must be a space-separated list of valid PMIDs.')

def get_curator_session(username):
    curator_engine = create_engine(os.environ['NEX2_URI'])
    session_factory = sessionmaker(bind=curator_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
    curator_session = scoped_session(session_factory)
    curator_session.execute('SET LOCAL ROLE ' + username)
    return curator_session

def get_pusher_client():
    pusher_client = pusher.Pusher(
        app_id=os.environ['PUSHER_APP_ID'],
        key=os.environ['PUSHER_KEY'],
        secret=os.environ['PUSHER_SECRET'],
        ssl=True
    )
    return pusher_client

def ban_from_cache(targets, is_exact=False):
    # ignore if developing against local db
    if 'localhost' in os.environ['NEX2_URI']:
        return
    if is_exact:
        command_exp = '=='
    else:
        command_exp = '~'
    command = 'ban req.url ' + command_exp + ' '
    for server in cache_urls:
        tn = Telnet(server.replace('http://', ''), '6082')
        for x in targets:
            tn.write(command + x + '\n')
        tn.close()

def get_author_etc(author_list):
    if author_list is None or len(author_list) == 0:
        return ""

    author_et_al = ""

    if len(author_list) == 1:
        author_et_al = author_list[0]
    elif len(author_list) == 2:
        author_et_al = " and ".join(author_list)
    else:
        author_et_al = author_list[0] + ", et al."

    return author_et_al
