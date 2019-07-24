from datetime import datetime
import json
import csv
import sys
sys.path.insert(0, '../../../src/')
from models import Pathwaydbentity, Pathwaysummary, PathwaysummaryReference, Referencedbentity, Source
sys.path.insert(0, '../')
from database_session import get_dev_session as get_session
from config import CREATED_BY, EMAIL
from util import sendmail
                             
__author__ = 'sweng66'

log_file = "logs/pathway_summary.log"
summary_type = "Metabolic"

def load_summaries(summary_file):
    
    nex_session = get_session()

    biocyc_id_to_dbentity_id = dict([(x.biocyc_id, x.dbentity_id) for x in nex_session.query(Pathwaydbentity).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    
    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id

    f = open(summary_file)
    fw = open(log_file, "w")
    
    for line in f:

        pieces = line.strip().split("\t")

        pathway_name = pieces[0].strip()
        summary_text = pieces[1].strip()
        pmids = pieces[2].strip().replace(" ", "").split("|")

        dbentity_id = biocyc_id_to_dbentity_id.get(pathway_name)

        if dbentity_id is None:
            print("TO CHECK: The biocyc_id:", pathway_name, " is not in the database.")
	    print(line)
            continue

        # summary_id = insert_pathwaysummary(nex_session, fw, dbentity_id, summary_text, source_id)

        # if summary_id is None:
        #    print "TO CHECK: Can't insert summary for biocyc_id: ", pathway_name
        #    print line
	#    continue

        reference_id_list = []
        bad = 0
        for pmid in pmids:
            if int(pmid) in pmid_to_reference_id:
                reference_id_list.append(pmid_to_reference_id[int(pmid)])
            else:
                print("TO CHECK: The pmid: ", pmid, " is not in the database.")
                bad = 1
        if bad == 1:
	    print(line)
            continue

        # insert_summary_references(nex_session, fw, reference_id_list, summary_id, source_id)
        # nex_session.commit()

    f.close()
    fw.close()
    
def insert_summary_references(nex_session, fw, reference_id_list, summary_id, source_id):

    order = 0
    for reference_id in reference_id_list:
        order = order + 1
        x = PathwaysummaryReference(summary_id = summary_id, 
                                    reference_id = reference_id, 
                                    reference_order = order, 
                                    source_id = source_id, 
                                    created_by = CREATED_BY)
        nex_session.add(x)
    
        fw.write("insert new summary reference:" + str(summary_id) + ", " + str(reference_id) + ", " + str(order) + "\n")


def insert_pathwaysummary(nex_session, fw, dbentity_id, summary, source_id):

    x = Pathwaysummary(pathway_id = dbentity_id,
                       summary_type = 'Metabolic',
                       text = summary,
                       html = summary, 
                       source_id = source_id, 
                       created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

    fw.write("insert summary:" + str(dbentity_id) + " " + summary + "\n")
    
    return x.summary_id


if __name__ == "__main__":
        
    summary_file = ""
    summary_type = ""
    if len(sys.argv) >= 2:
        summary_file = sys.argv[1]
    else:
        print("Usage: load_pathway_summaries.py summary_file_name_with_path")
        print("Example: load_pathwaysummaries.py data/biochempwy_to-load.tsv")
        exit()

    load_summaries(summary_file)
    
