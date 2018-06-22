import logging
import os
from datetime import datetime
import time
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
from src.models import Dbentity, Referencedbentity, Journal
from scripts.loading.database_session import get_session
from scripts.loading.reference.pubmed import get_pubmed_record_from_xml, \
                                             get_abstracts, set_cite

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)
CREATED_BY = os.environ['DEFAULT_USER']


MAX = 500
MAX_4_CONNECTION = 5000
SLEEP_TIME = 2
PUBLISHED_STATUS = 'Published'
EPUB_STATUS = 'Epub ahead of print'
EPUB = 'aheadofprint'
PUBLISH = 'ppublish'
SRC = 'NCBI'
AUTHOR_TYPE = 'Author'
PMC_URL_TYPE = 'PMC full text'
DOI_URL_TYPE = 'DOI full text'
PMC_ROOT = 'http://www.ncbi.nlm.nih.gov/pmc/articles/'
DOI_ROOT = 'http://dx.doi.org/'

def update_reference_data(log_file):
 
    nex_session = get_session()

    journal_id_to_abbrev = dict([(x.journal_id, x.med_abbr) for x in nex_session.query(Journal).all()])

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")
    
    log.info(str(datetime.now()))
    log.info("Getting data from the database...")

    pmids_all = []
    pmid_to_reference = {}
    for x in nex_session.query(Referencedbentity).all():
        if x.pmid:
            pmids_all.append(x.pmid)
            pmid_to_reference[x.pmid] = { 'dbentity_id': x.dbentity_id, 
                                          'publication_status': x.publication_status,
                                          'date_revised': x.date_revised }
            
    ###########################
    nex_session.close()
    nex_session = get_session()
    ###########################

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    # log.info(datetime.now())
    log.info("Getting Pubmed records and updating the database...")

    pmids = []
    j = 0
    i = 0
    for pmid in pmids_all:
        
        if pmid is None or pmid in [26842620, 27823544, 11483584]:
            continue

        i = i + 1
        j = j + 1
        
        if j >= MAX_4_CONNECTION:
            ###########################
            nex_session.close()
            nex_session = get_session()
            ###########################
            log.info("Reference updated: " + str(i))
            j = 0

        # print "PMID: ", pmid
            
        if len(pmids) >= MAX:
            records = get_pubmed_record_from_xml(','.join(pmids))
            update_database_batch(nex_session, fw, records, 
                                  pmid_to_reference, 
                                  journal_id_to_abbrev)

            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record_from_xml(','.join(pmids))
        update_database_batch(nex_session, fw, records, 
                              pmid_to_reference, 
                              journal_id_to_abbrev)
        
    nex_session.commit()

    log.info("Reference updated: " + str(i))

    log.info(str(datetime.now()))
    log.info("Done!")

    fw.close()


def update_database_batch(nex_session, fw, records, pmid_to_reference, journal_id_to_abbrev):
        
    for record in records:            

        pmid = record.get('pmid')
        if pmid is None:
            continue
        
        x = pmid_to_reference.get(pmid)
        
        if x is None:
            continue

        print "Updating data for PMID: ", pmid

        dbentity_id = x['dbentity_id']

        ### UPDATE REFERENCEDBENTITY TABLE
        update_reference(nex_session, fw, record, pmid, x, journal_id_to_abbrev)
        
def update_reference(nex_session, fw, record, pmid, x, journal_id_to_abbrev):

    x = nex_session.query(Referencedbentity).filter_by(pmid=pmid).one_or_none()

    if x is None:
        return

    journal = journal_id_to_abbrev[x.journal_id]
    authors = record.get('authors', [])
    title = record.get('title', '')
    year = x.year
    volume = x.volume
    issue = x.issue
    page = x.page
    citation = set_cite(title, authors, year, journal, volume, issue, page)    

    ### update reference table

    has_update = 0
    if citation != x.citation:
        print "PMID:", pmid, "update Citation - NEW:", citation
        print "PMID:", pmid, "update Citation - OLD:", x.citation
        x.citation = citation
        has_update = 1
    if title != x.title:
        print "PMID:", pmid, "update Title - NEW:", title
        print "PMID:", pmid, "update Title - OLD:",x.title
        x.title = title
        has_update = 1

    if has_update == 1:
        nex_session.add(x)
        nex_session.commit()

if __name__ == '__main__':

    log_file = "scripts/loading/reference/logs/reference_title_citation_update.log"
    
    update_reference_data(log_file)




