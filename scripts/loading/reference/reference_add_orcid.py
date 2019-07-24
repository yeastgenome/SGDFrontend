import logging
import os
from datetime import datetime
import time
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
from src.models import Referencedbentity, Referenceauthor
from scripts.loading.database_session import get_session
from scripts.loading.reference.pubmed import get_pubmed_record_from_xml


__author__ = 'sweng66'


logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)
CREATED_BY = os.environ['DEFAULT_USER']


MAX = 500
MAX_4_CONNECTION = 5000
SLEEP_TIME = 2

def update_reference_data(log_file):
 
    nex_session = get_session()

    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    reference_id_author_to_x = dict([((x.reference_id, x.display_name), x) for x in nex_session.query(Referenceauthor).all()])

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")

    log.info("Getting data from the database...")

    pmid_all = []
    for x in nex_session.query(Referencedbentity).all():
        if x.pmid:
            pmid_all.append(x.pmid)
            
    ###########################
    # nex_session.close()
    # nex_session = get_session()
    ###########################
    i = 0
    j = 0
    pmids = []
    for pmid in pmid_all:

        if pmid is None or pmid in [26842620, 27823544, 11483584]:
            continue

        i = i + 1
        j = j + 1
        
        # if j >= MAX_4_CONNECTION:
        #    ###########################
        #    nex_session.close()
        #    nex_session = get_session()
        #    ###########################
        #    log.info("Reference updated: " + str(i))
        #    j = 0

        # print "PMID: ", pmid
            
        pmids.append(str(pmid))
        if len(pmids) >= MAX:
            records = get_pubmed_record_from_xml(','.join(pmids))
            update_orcid(nex_session, fw, records, pmid_to_reference_id, 
                         reference_id_author_to_x )
            pmids = []
    
    if len(pmids) > 0:
        records = get_pubmed_record_from_xml(','.join(pmids))
        update_orcid(nex_session, fw, records, pmid_to_reference_id,
                     reference_id_author_to_x)

    fw.close()
    nex_session.close()


def update_orcid(nex_session, fw, records, pmid_to_reference_id, reference_id_author_to_x):
    
    for record in records:
        pmid = record['pmid']
        if record.get('orcid') is None:
            continue
        author2orcid = record['orcid']
        for author in author2orcid:
            # print pmid, author, author2orcid.get(author)
            if author2orcid.get(author) is None or author2orcid.get(author) == '':
                continue
            reference_id = pmid_to_reference_id.get(int(pmid))
            if reference_id is None:
                continue
            author_x = reference_id_author_to_x.get((reference_id, author))
            if author_x is None:
                continue
            if author_x.orcid is not None and author_x.orcid == author2orcid.get(author):
                continue
            author_x.orcid = author2orcid.get(author)
            nex_session.add(author_x)
            nex_session.commit()
            fw.write(str(pmid) + ": " + author + " " + author2orcid.get(author)+"\n")


if __name__ == '__main__':

    log_file = "scripts/loading/reference/logs/reference_add_orcid.log"
    
    update_reference_data(log_file)
