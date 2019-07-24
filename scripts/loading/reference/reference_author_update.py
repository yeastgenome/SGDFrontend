from datetime import datetime
import time
from io import StringIO
from Bio import Entrez, Medline
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Referenceauthor, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from .pubmed import get_pubmed_record

__author__ = 'sweng66'

MAX = 50
SLEEP_TIME = 2
AUTHOR_TYPE = 'Author'
SRC = 'NCBI'

def update_all_authors(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")
    
    print(datetime.now())
    print("Getting PMID list...")

    pmid_to_reference =  dict([(x.pmid, x) for x in nex_session.query(Referencedbentity).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])

    reference_id_to_authors = {}
    for x in nex_session.query(Referenceauthor).order_by(Referenceauthor.reference_id, Referenceauthor.author_order).all():
        authors = []
        if x.reference_id in reference_id_to_authors:
            authors = reference_id_to_authors[x.reference_id]
        authors.append(x.display_name)
        reference_id_to_authors[x.reference_id] = authors

    #################################################################

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    print(datetime.now())
    print("Getting Pubmed records...")

    source_id = source_to_id[SRC]

    pmids = []
    for pmid in pmid_to_reference:

        fw.write("Getting data for PMID:" + str(pmid) + "\n")

        if pmid is None or pmid in [26842620, 27823544, 11483584]:
            continue
        if len(pmids) >= MAX:
            records = get_pubmed_record(','.join(pmids))
            update_database_batch(nex_session, fw, records, pmid_to_reference, 
                                  reference_id_to_authors, source_id)
            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record(','.join(pmids))
        update_database_batch(nex_session, fw, records, pmid_to_reference, 
                              reference_id_to_authors, source_id)

    print("Done")

    fw.close()
    nex_session.commit()


def update_database_batch(nex_session, fw, records, pmid_to_reference, reference_id_to_authors, source_id):

    for rec in records:
        rec_file = StringIO(rec)
        record = Medline.read(rec_file)

        pmid = record.get('PMID')
        if pmid is None:
            continue

        x = pmid_to_reference.get(int(pmid))
        
        if x is None:
            continue

        authors = record.get('AU', '')
        update_authors(nex_session, fw, pmid, x.dbentity_id, authors, reference_id_to_authors.get(x.dbentity_id), source_id)


def update_authors(nex_session, fw, pmid, reference_id, authors, authors_in_db, source_id):

    if authors_in_db is None:
        authors_in_db = []

    if ", ".join(authors) == ", ".join(authors_in_db):
        return

    ## NEED to IMPROVE THE FOLLOWING CODE

    # delete old ones
    for ra in nex_session.query(Referenceauthor).filter_by(reference_id=reference_id).all():
        nex_session.delete(ra)
    nex_session.commit()

    # add new ones
    i = 1
    for author in authors:
        ra = Referenceauthor(display_name = author,
                             source_id = source_id,
                             obj_url = '/author/' + author.replace(' ', '_'),
                             reference_id = reference_id,
                             author_order = i,
                             author_type = 'Author',
                             created_by = CREATED_BY)
        nex_session.add(ra)
        i = i + 1
    nex_session.commit()

    fw.write("PMID=" + str(pmid) + ": the author list is updated.\nNew authors: " + ", ".join(authors) + "\nOld authors: " + ", ".join(authors_in_db) + "\n\n")   
    
    print("PMID=", pmid, ": the author list is updated.")
    print("New authors:", ", ".join(authors))
    print("Old authors:", ", ".join(authors_in_db))


if __name__ == '__main__':

    log_file = "logs/reference_author_update.log"
    
    update_all_authors(log_file)



