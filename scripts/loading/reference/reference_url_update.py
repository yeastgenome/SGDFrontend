from datetime import datetime
import time
from io import StringIO
from Bio import Entrez, Medline
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, ReferenceUrl, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from .pubmed import get_pubmed_record
from .add_reference import get_doi

__author__ = 'sweng66'

MAX = 200
SLEEP_TIME = 2
PMC_URL_TYPE = 'PMC full text'
DOI_URL_TYPE = 'DOI full text'
PMC_ROOT = 'http://www.ncbi.nlm.nih.gov/pmc/articles/'
DOI_ROOT = 'http://dx.doi.org/'
SRC = 'NCBI'

def update_all_urls(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")

    pmid_to_reference =  dict([(x.pmid, x) for x in nex_session.query(Referencedbentity).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])

    reference_id_to_urls = {}
    for x in nex_session.query(ReferenceUrl).all():
        urls = []
        if x.reference_id in reference_id_to_urls:
            urls = reference_id_to_urls[x.reference_id]
        urls.append((x.url_type, x.obj_url))
        reference_id_to_urls[x.reference_id] = urls

    #################################################################

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    print(datetime.now())
    print("Getting Pubmed records...")
  
    source_id = source_to_id[SRC]

    pmids = []
    for pmid in pmid_to_reference:

        fw.write("Getting data for PMID:" +  str(pmid) + "\n")

        if pmid is None or pmid in [26842620, 27823544]:
            continue
        if len(pmids) >= MAX:
            records = get_pubmed_record(','.join(pmids))
            update_database_batch(nex_session, fw, records, pmid_to_reference, 
                                  reference_id_to_urls, source_id)
            pmids = []
            # time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record(','.join(pmids))
        update_database_batch(nex_session, fw, records, pmid_to_reference, 
                              reference_id_to_urls, source_id)

    print("Done")

    fw.close()
    nex_session.commit()


def update_database_batch(nex_session, fw, records, pmid_to_reference, reference_id_to_urls, source_id):

    for rec in records:
        rec_file = StringIO(rec)
        record = Medline.read(rec_file)

        pmid = record.get('PMID')
        if pmid is None:
            continue

        x = pmid_to_reference.get(int(pmid))

        if x is None:
            continue

        pmc_url = None
        if record.get('PMC'):
            pmc_url = PMC_ROOT + record['PMC'] + '/'

        doi, doi_url = get_doi(record)

        doi_url = doi_url.replace("&lt;", "<").replace("&gt;", ">")

        update_urls(nex_session, fw, pmid, x.dbentity_id, pmc_url, doi_url, 
                    reference_id_to_urls[x.dbentity_id], source_id)

            
def update_urls(nex_session, fw, pmid, reference_id, pmc_url, doi_url, urls_in_db, source_id):

    if doi_url == '':
        doi_url = None

    if pmc_url is None and doi_url is None:
        return
    
    if urls_in_db is None:
        urls_in_db = []

    pmc_url_db = None
    doi_url_db = None

    for (type, url) in urls_in_db:
        if type == DOI_URL_TYPE:
            doi_url_db = url
        if type == PMC_URL_TYPE:
            pmc_url_db = url

    pmc_url_changed = 0
    doi_url_changed = 0
    if pmc_url is not None:
        if pmc_url_db is None:
            ru = ReferenceUrl(display_name = PMC_URL_TYPE,
                              obj_url = pmc_url,
                              source_id = source_id,
                              reference_id = reference_id,
                              url_type = PMC_URL_TYPE,
                              created_by = CREATED_BY)
            nex_session.add(ru)
            nex_session.commit()
            pmc_url_changed = 1
        elif pmc_url != pmc_url_db:
            nex_session.query(ReferenceUrl).filter_by(reference_id=reference_id, url_type=PMC_URL_TYPE).update({'obj_url': pmc_url})
            nex_session.commit()
            pmc_url_changed = 1
    
    if doi_url is not None:
        if doi_url_db is None:
            ru = ReferenceUrl(display_name = DOI_URL_TYPE,
                              obj_url = doi_url,
                              source_id = source_id,
                              reference_id = reference_id,
                              url_type = DOI_URL_TYPE,
                              created_by = CREATED_BY)
            nex_session.add(ru)
            nex_session.commit()
            doi_url_changed = 1
        elif doi_url != doi_url_db:
            nex_session.query(ReferenceUrl).filter_by(reference_id=reference_id, url_type=DOI_URL_TYPE).update({'obj_url': doi_url})
            nex_session.commit()
            doi_url_changed = 1

    if pmc_url_changed == 1:
        fw.write("PMID=" + str(pmid) + ": the PMC URL is updated.\nNew URL: " + str(pmc_url) + "\nOld URL: " + str(pmc_url_db) + "\n\n")
        print("PMID=", pmid, ": the PMC URL is updated")
        print("New URL:", pmc_url)
        print("Old URL:", pmc_url_db)

    if doi_url_changed == 1:
        fw.write("PMID=" + str(pmid) + ": the DOI URL is updated.\nNew URL: " + str(doi_url) + "\nOld URL: " + str(doi_url_db) + "\n\n")

        print("PMID=", pmid, ": the DOI URL is updated")
        print("New URL:", doi_url)
        print("Old URL:", doi_url_db) 


if __name__ == '__main__':

    log_file = "logs/reference_url_update.log"
    
    update_all_urls(log_file)



