from datetime import datetime
import time
from io import StringIO
from Bio import Entrez, Medline
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, ReferenceRelation, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from .pubmed import get_pubmed_record
from .add_reference import tag_to_type_mapping, relation_in_tag, relation_on_tag

__author__ = 'sweng66'

MAX = 500
SLEEP_TIME = 2
SRC = 'NCBI'

def update_all_relations(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")

    print(datetime.now())
    print("Getting PMID list...")

    pmid_to_reference =  dict([(x.pmid, x) for x in nex_session.query(Referencedbentity).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    key_to_type = dict([((x.parent_id, x.child_id), x.relation_type) for x in nex_session.query(ReferenceRelation).all()])

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    print(datetime.now())
    print("Getting Pubmed records...")

    pmids = []
    for pmid in pmid_to_reference:

        fw.write("Getting data for PMID=" + str(pmid) + "\n")

        if pmid is None or pmid in [26842620, 27823544]:
            continue
        if len(pmids) >= MAX:
            records = get_pubmed_record(','.join(pmids))
            update_database_batch(nex_session, fw, records, pmid_to_reference, key_to_type, source_to_id)
            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record(','.join(pmids))
        update_database_batch(nex_session, fw, records, pmid_to_reference, key_to_type, source_to_id)

    print("Done")
    fw.close()
    nex_session.commit()


def update_database_batch(nex_session, fw, records, pmid_to_reference, key_to_type, source_to_id):

    for rec in records:
        rec_file = StringIO(rec)
        record = Medline.read(rec_file)
        pmid = record.get('PMID')
        if pmid is None:
            continue

        x = pmid_to_reference.get(int(pmid))

        if x is None:
            continue

        update_comment_erratum(nex_session, fw, record, int(pmid), pmid_to_reference, key_to_type, source_to_id) 
        

def update_comment_erratum(nex_session, fw, record, pmid, pmid_to_reference, key_to_type, source_to_id):

    tag_to_type = tag_to_type_mapping()
    
    inPmidList = []
    onPmidList = []

    # ['Biochem Pharmacol. 1975 Aug 15;24(16):1517-21. PMID: 8']
    # ['Epigenetics. 2013 Oct;8(10):1008-12. PMID: 23917692', 'Nat Rev Mol Cell Biol. 2011 Nov;12(11):692. PMID: 21952299', 'Cell. 2011 Sep 2;146(5):671-2. PMID: 21884927']

    for tag in relation_in_tag():
        if record.get(tag):
            type = tag_to_type[tag]
            for inText in record[tag]:
                if "PMID: " not in inText:
                    continue
                this_pmid = int(inText.split("PMID: ")[1].strip())
                inPmidList.append((this_pmid, type))
            
    for tag in relation_on_tag():
        if record.get(tag):
            type = tag_to_type[tag]
            for onText in record[tag]:
                if "PMID: " not in onText:
                    continue
                this_pmid = int(onText.split("PMID: ")[1].strip())
                onPmidList.append((this_pmid, type))
            
    if len(inPmidList) == 0 and len(onPmidList) == 0:
        return

    source_id = source_to_id.get('SGD')

    x = pmid_to_reference.get(pmid)

    reference_id = x.dbentity_id

    for (child_pmid, type) in inPmidList:
        parent_reference_id = reference_id
        child_x = pmid_to_reference.get(child_pmid)
        if child_x is not None:
            child_reference_id = child_x.dbentity_id
            update_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id, key_to_type)
    
    for (parent_pmid, type) in onPmidList:
        child_reference_id = reference_id
        parent_x= pmid_to_reference.get(parent_pmid)
        if parent_x is not None:
            parent_reference_id = parent_x.dbentity_id
            update_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id, key_to_type)


def update_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id, key_to_type): 

    if (parent_reference_id, child_reference_id) in key_to_type:
        type_db = key_to_type.get((parent_reference_id, child_reference_id))
        if type != type_db:
            nex_session.query(ReferenceRelation).filter_by(parent_id=parent_reference_id, child_id=child_reference_id).update({'relation_type': type})
            nex_session.commit()
            fw.write("PMID=" + str(pmid) + ": relation_type is updated to " + type + "\n")
            print("PMID=", pmid, ": relation_type is updated to ", type)
            key_to_type[(parent_reference_id, child_reference_id)] = type
    else:
        r = ReferenceRelation(source_id = source_id,
                              parent_id = parent_reference_id,
                              child_id = child_reference_id,
                              relation_type = type,
                              created_by = CREATED_BY)
        nex_session.add(r)
        nex_session.commit()
        fw.write("PMID=" + str(pmid) + ": a new reference_relation is added.\n")
        print("PMID=", pmid, ": a new reference_relation is added. type=", type)
        key_to_type[(parent_reference_id, child_reference_id)] = type
        

if __name__ == '__main__':

    log_file = "logs/reference_relation_update.log"
    
    update_all_relations(log_file)



