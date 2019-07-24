from datetime import datetime
import time
from io import StringIO
from Bio import Entrez, Medline
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Referencedocument, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from util import link_gene_names
from database_session import get_nex_session as get_session
from .pubmed import get_pubmed_record

__author__ = 'sweng66'

MAX = 50
MAX_4_CONNECTION = 10000
SLEEP_TIME = 2
SRC = 'NCBI'

def update_all_abstracts(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    
    print(datetime.now())

    pmid_to_reference =  dict([(x.pmid, x) for x in nex_session.query(Referencedbentity).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    reference_id_to_abstract = dict([(x.reference_id, x.text) for x in nex_session.query(Referencedocument).filter_by(document_type="Abstract").all()])


    #################################################################

    fw.write("Getting Pubmed records...\n")

    print("Getting Pubmed records...")

    source_id = source_to_id[SRC]

    pmids = []
    j = 0
    for pmid in pmid_to_reference:

        fw.write("Getting data for PMID: " + str(pmid) + "\n")

        if pmid is None or pmid in [26842620, 27823544]:
            continue

        j = j + 1
        if j > MAX_4_CONNECTION:
            nex_session.close()
            nex_session = get_session()
            j = 0

        if len(pmids) >= MAX:

            records = get_pubmed_record(','.join(pmids))
            update_database_batch(nex_session, fw, records, pmid_to_reference, 
                                  reference_id_to_abstract, source_id)
      
            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record(','.join(pmids))
        update_database_batch(nex_session, fw, records, pmid_to_reference, 
                              reference_id_to_abstract, source_id)

    print("Done")

    fw.close()
    nex_session.commit()


def update_database_batch(nex_session, fw, records, pmid_to_reference, reference_id_to_abstract, source_id):

    for rec in records:
        rec_file = StringIO(rec)
        record = Medline.read(rec_file)

        pmid = record.get('PMID')
        if pmid is None:
            continue

        x = pmid_to_reference.get(int(pmid))
        
        if x is None:
            continue

        reference_id = x.dbentity_id
        abstract_db = reference_id_to_abstract.get(reference_id)
        update_abstract(nex_session, fw, pmid, reference_id, record, abstract_db, source_id)

def update_abstract(nex_session, fw, pmid, reference_id, record, abstract_db, source_id):
    abstract = record.get('AB', '')
    if abstract == '':
        return
    if abstract and abstract == abstract_db:
        return
    if abstract_db is None:
        x = Referencedocument(document_type = 'Abstract',
                              source_id = source_id,
                              reference_id = reference_id,
                              text = abstract,
                              html = link_gene_names(abstract, {}, nex_session),
                              created_by = CREATED_BY)
        nex_session.add(x)
        nex_session.commit()
        fw.write("PMID:" + str(pmid) + ": new abstract added.\nNew abstract: " + abstract + "\n")
        print("PMID:", pmid, ": new abstract added.")
        print("New abstract:", abstract)
 
    else:
        nex_session.query(Referencedocument).filter_by(reference_id=reference_id).update({'text': abstract,
                                                                                          'html': link_gene_names(abstract, {}, nex_session)})
        nex_session.commit()
        fw.write("PMID=" + str(pmid) + ": the abstract is updated.\nNew abstract: " + abstract + "\nOld abstract: " + abstract_db + "\n\n")

        print("PMID=", pmid, ": the abstract is updated.")
        print("New abstract:", abstract)
        print("Old abstract:", abstract_db)


if __name__ == '__main__':

    log_file = "logs/reference_abstract_update.log"
    
    update_all_abstracts(log_file)



