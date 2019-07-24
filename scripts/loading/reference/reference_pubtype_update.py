from datetime import datetime
import time
from io import StringIO
from Bio import Entrez, Medline
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Referencetype, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from .pubmed import get_pubmed_record

__author__ = 'sweng66'

MAX = 200
SLEEP_TIME = 2
SOURCE = 'NCBI'
SRC = 'NCBI'

def update_all_pubtypes(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")

    print(datetime.now())
    print("Getting PMID list...")

    pmid_to_reference =  dict([(x.pmid, x) for x in nex_session.query(Referencedbentity).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    
    reference_id_to_pubtypes = {}
    for x in nex_session.query(Referencetype).all():
        pubtypes = []
        if x.reference_id in reference_id_to_pubtypes:
            pubtypes = reference_id_to_pubtypes[x.reference_id]
        pubtypes.append(x.display_name)
        reference_id_to_pubtypes[x.reference_id] = pubtypes

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    print(datetime.now())
    print("Getting Pubmed records...")

    source_id = source_to_id[SRC]

    pmids = []
    for pmid in pmid_to_reference:
        
        fw.write("Getting data for PMID="+ str(pmid) + "\n")

        if pmid is None or pmid in [26842620, 27823544]:
            continue
        if len(pmids) >= MAX:
            records = get_pubmed_record(','.join(pmids))
            update_database_batch(nex_session, fw, records, pmid_to_reference, reference_id_to_pubtypes, source_id)
            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record(','.join(pmids))
        update_database_batch(nex_session, fw, records, pmid_to_reference, reference_id_to_pubtypes, source_id)

    print("Done")
    fw.close()
    nex_session.commit()


def update_database_batch(nex_session, fw, records, pmid_to_reference, reference_id_to_pubtypes, source_id):

    for rec in records:
        rec_file = StringIO(rec)
        record = Medline.read(rec_file)
        pmid = record.get('PMID')
        if pmid is None:
            continue

        x = pmid_to_reference.get(int(pmid))

        if x is None:
            continue

        pubtypes = record.get('PT', []) ## a list of types     

        update_reftypes(nex_session, fw, pmid, x.dbentity_id, pubtypes, reference_id_to_pubtypes.get(x.dbentity_id), source_id)


def update_reftypes(nex_session, fw, pmid, reference_id, pubtypes, pubtypes_in_db, source_id):

    if pubtypes_in_db is None:
        pubtypes_in_db = []

    if sorted(pubtypes) == sorted(pubtypes_in_db):
        return
    
    updated = 0
    for type in pubtypes_in_db:
        if type not in pubtypes:
            rt = nex_session.query(Referencetype).filter_by(reference_id=reference_id, display_name=type).all()
            nex_session.delete(rt[0])
            updated = 1

    # add new ones                                                                                   
          
    for type in pubtypes:
        if type not in pubtypes_in_db:
            rt = Referencetype(display_name = type,
                               source_id = source_id,
                               obj_url = '/referencetype/' + type.replace(' ', '_'),
                               reference_id = reference_id,
                               created_by = CREATED_BY)
            nex_session.add(rt)
            updated = 1

    if updated == 1:
        nex_session.commit()
        fw.write("PMID=" + str(pmid) + ": the reference type list is updated.\nNew types: " + str(pubtypes) + "\nOld types: " + str(pubtypes_in_db) + "\n\n")
        
        print("PMID=", pmid, ": the reference type list is updated.")
        print("New types:", pubtypes)
        print("Old types:", pubtypes_in_db)


if __name__ == '__main__':

    log_file = "logs/reference_pubtype_update.log"
    
    update_all_pubtypes(log_file)



