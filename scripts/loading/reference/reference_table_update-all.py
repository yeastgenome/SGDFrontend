from datetime import datetime
import time
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Source, Journal
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from .pubmed import get_pubmed_record_from_xml, set_cite

__author__ = 'sweng66'

MAX = 100
MAX_4_CONNECTION = 10000
SLEEP_TIME = 2
PUBLISHED_STATUS = 'Published'
EPUB_STATUS = 'Epub ahead of print'
EPUB = 'aheadofprint'
PUBLISH = 'ppublish'
SRC = 'NCBI'
# JOURNAL_SRC = 'PubMed'

def update_reference_table(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")

    pmid_to_reference =  dict([(x.pmid, x) for x in nex_session.query(Referencedbentity).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    journal_id_to_abbrev = dict([(x.journal_id, x.med_abbr) for x in nex_session.query(Journal).all()])

    #################################################################

    source_id = source_to_id[SRC]

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    print(datetime.now())
    print("Getting Pubmed records...")

    pmids = []
    j = 0
    for pmid in pmid_to_reference:
        
        if pmid is None or pmid in [26842620, 27823544, 11483584]:
            continue

        j = j + 1
        if j > MAX_4_CONNECTION:
            nex_session.close()
            nex_session = get_session()
            j = 0
        
        if len(pmids) >= MAX:
            records = get_pubmed_record_from_xml(','.join(pmids))
            update_database_batch(nex_session, fw, records, pmid_to_reference, 
                                  journal_id_to_abbrev, source_id)

            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record_from_xml(','.join(pmids))
        update_database_batch(nex_session, fw, records, pmid_to_reference, 
                              journal_id_to_abbrev, source_id)

    print("Done")

    fw.close()
    nex_session.commit()


def update_database_batch(nex_session, fw, records, pmid_to_reference, journal_id_to_abbrev, source_id):

    for record in records:            
        pmid = record.get('pmid')
        if pmid is None:
            continue

        x = pmid_to_reference.get(pmid)
        
        if x is None:
            continue

        update_database(nex_session, fw, record, pmid, pmid_to_reference, 
                        journal_id_to_abbrev, source_id)
        

def update_database(nex_session, fw, record, pmid, pmid_to_reference, journal_id_to_abbrev, source_id):

    pubstatus = record.get('publication_status')
    date_revised = record.get('date_revised')
    
    x = pmid_to_reference.get(pmid)
    # date_revised_db = str(x.date_revised).split(' ')[0]

    if x.publication_status == EPUB_STATUS and pubstatus == PUBLISH:

        update_reference(nex_session, fw, pmid, record, x, journal_id_to_abbrev, source_id, 
                         date_revised, PUBLISHED_STATUS)

        fw.write("EPUB: get published for pmid=" + str(pmid) + "\n")

    else:
        update_reference(nex_session, fw, pmid, record, x, journal_id_to_abbrev, source_id,
                         date_revised, None)
                            
def update_reference(nex_session, fw, pmid, record, x, journal_id_to_abbrev, source_id, date_revised, published_status):

    journal = journal_id_to_abbrev[x.journal_id]
    authors = record.get('authors', [])
    title = record.get('title', '')
    year = record.get('year')
    if year is None:
        year = x.year
    else:
        year = int(year)
    volume = record.get('volume', '')
    issue = record.get('issue', '')
    page = record.get('page', '')
    citation = set_cite(title, authors, year, journal, volume, issue, page)    
    doi = record.get('doi', '')
    pmcid = record.get('pmc', '')

    update_str = ""
    ### update reference table
    has_update = 0
    if published_status:
        x.publication_status = published_status
        print("UPDATE:", pmid, "publication_status=", published_status)
        has_update = 1
    if citation != x.citation:
        x.citation = citation
        print("UPDATE:", pmid, "citation=", citation)
        has_update = 1
    if title != x.title:
        x.title = title
        print("UPDATE:", pmid, "title=", title)
        has_update = 1
    if year != x.year:
        x.year = year
        print("UPDATE:", pmid, "year=", year)
        has_update = 1
    if volume != x.volume:
        x.volume = volume
        print("UPDATE:", pmid, "volume=", volume)
        has_update = 1
    if issue != x.issue:
        x.issue = issue
        print("UPDATE:", pmid, "issue=", issue)
        has_update = 1
    if page != x.page:
        x.page = page
        print("UPDATE:", pmid, "page=", page)
        has_update = 1
    if doi and doi != x.doi:
        x.doi = doi
        print("UPDATE:", pmid, "doi=", doi)
        has_update = 1
    if pmcid and pmcid != x.pmcid and pmcid != "PMC4502675":
        x.pmcid = pmcid
        print("UPDATE:", pmid, "pmcid=", pmcid)
        has_update = 1
    if date_revised:
        date_revised_db = None
        if x.date_revised:
            date_revised_db = str(x.date_revised).split(' ')[0]
        if date_revised_db is None or date_revised != date_revised_db:
            x.date_revised = date_revised
            print("UPDATE:", pmid, "date_revised=", date_revised)
            has_update = 1

    if has_update == 1:
        nex_session.add(x)
        nex_session.commit()
    else:
        print(pmid, "No change")


if __name__ == '__main__':

    log_file = "logs/reference_table_update.log"
    
    update_reference_table(log_file)




