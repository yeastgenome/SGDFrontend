from datetime import datetime
from database_session import get_dev_session
from Bio import Entrez
from urllib import urlopen
from sqlalchemy import create_engine
import sys
import os
import transaction
reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../src/')
sys.setdefaultencoding('UTF8')
# from config import CREATED_BY
from models import Referencedbentity, Referencetriage, DBSession
from pubmed import get_pmid_list, get_pubmed_record, set_cite, get_abstract

__author__ = 'sweng66'

TERMS = ['yeast', 'cerevisiae']
URL = 'http://www.ncbi.nlm.nih.gov/pubmed/'
DAY = 14
RETMAX = 10000
CREATED_BY = 'tshepp'
def load_references(log_file):
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)
    nex_session = DBSession

    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    pmid_to_curation_id =  dict([(x.pmid, x.curation_id) for x in nex_session.query(Referencetriage).all()])

    # fw = open(log_file,"w")

    # fw.write(str(datetime.now()) + "\n")
    # fw.write("Getting PMID list...\n")

    pmid_list = get_pmid_list(TERMS, RETMAX, DAY)

    # print "PMID COUNT BEFORE:", len(pmid_list)

    pmids = []
    for pmid in pmid_list:
        if int(pmid) in pmid_to_reference_id:
            # print ("The pmid=", pmid, " is in the REFERENCEDBENTITY table.", "\n")
            continue
        if int(pmid) in pmid_to_curation_id:
            # print ("The pmid=", pmid, " is in the REFERENCETRIAGE table.", "\n")
            continue
        pmids.append(pmid)

    if len(pmids) == 0:
        # fw.write("No new papers\n")
        return

    # fw.write(str(datetime.now()) + "\n")
    # fw.write("Getting Pubmed records...\n")

    records = get_pubmed_record(','.join(pmids))

    i = 1
    for record in records:
        pmid = record.get('Id')
        pubmed_url = 'http://www.ncbi.nlm.nih.gov/pubmed/' + str(pmid)
        doi_url = ""
        if record.get('DOI'):
            doi_url = "/".join(['http://dx.doi.org', record['DOI']])
        title = record.get('Title')
        authors = record.get('AuthorList')
        pubdate = record.get('PubDate', '')  # 'PubDate': '2012 Mar 20'  
        year = pubdate.split(' ')[0]
        journal = record.get('Source', '')
        volume = record.get('Volume', '')
        issue = record.get('Issue', '')
        pages = record.get('Pages', '')
        # pubtypes = record.get('PubTypeList', []) ## a list of types
        # date_revised = record['History'].get('revised', '')
        # essn = record.get('ESSN', '')
        # issn = record.get('ISSN', '')
        # pubstatus = record.get('PubStatus', '')  # 'aheadofprint', 'epublish'
        
        citation = set_cite(title, authors, year, journal, volume, issue, pages)  

        print "CITE=", citation
        print "URL=", doi_url

        abstract = ""
        if record.get('HasAbstract'):
            abstract = get_abstract(pmid)

            print abstract

        fw = None
        insert_reference(nex_session, fw, pmid, citation, doi_url, abstract)

    # fw.close()


def insert_reference(nex_session, fw, pmid, citation, doi_url, abstract):

    x = None
    if doi_url and abstract:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            fulltext_url = doi_url,
                            abstract = abstract,
                            created_by = CREATED_BY)
    elif doi_url:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            fulltext_url = doi_url,
                            created_by = CREATED_BY)
    elif abstract:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            abstract = abstract,
                            created_by = CREATED_BY)
    else:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            created_by = CREATED_BY)
    nex_session.add(x)
    transaction.commit()

    # fw.write("Insert new reference: " + citation + "\n")


if __name__ == '__main__':

    log_file = "logs/reference_triage.log"
    
    load_references(log_file)



