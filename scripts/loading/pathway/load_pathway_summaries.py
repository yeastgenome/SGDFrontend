from datetime import datetime
import json
import csv
import sys
import os
from src.models import Pathwaydbentity, Pathwaysummary, PathwaysummaryReference, Referencedbentity, Source
from scripts.loading.database_session import get_session
                             
__author__ = 'sweng66'

log_file = "scripts/loading/pathway/logs/pathway_summary.log"
summary_type = "Metabolic"

CREATED_BY = os.environ['DEFAULT_USER']

def load_summaries(summary_file, created_by):
    
    if created_by == '':
        created_by = CREATED_BY

    nex_session = get_session()

    biocyc_id_to_dbentity_id = dict([(x.biocyc_id, x.dbentity_id) for x in nex_session.query(Pathwaydbentity).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    pathway_id_to_pathwaysummary = dict([(x.pathway_id, x) for x in nex_session.query(Pathwaysummary).all()])

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id

    f = open(summary_file)
    fw = open(log_file, "w")
    
    for line in f:

        pieces = line.strip().split("\t")

        pathway_name = pieces[0].strip()
        summary_text = pieces[1].strip()
        # pmids = pieces[2].strip().replace(" ", "").split("|")

        dbentity_id = biocyc_id_to_dbentity_id.get(pathway_name)

        if dbentity_id is None:
            print("The biocyc_id:", pathway_name, " is not in the database.")
            continue

        if dbentity_id in pathway_id_to_pathwaysummary:
            print("There is a summary in the database for pathway_id=", dbentity_id)
            continue

        summary_id = insert_pathwaysummary(nex_session, fw, dbentity_id, summary_text, source_id, created_by)

        if summary_id is None:
            print("Can't insert summary for biocyc_id: ", pathway_name)
            print(line)
            continue
        

        if len(pieces) < 3:
            nex_session.commit()
            continue

        pmids = pieces[2].strip().replace(" ", "").split("|") 

        reference_id_list = []
        bad = 0
        for pmid in pmids:
            if int(pmid) in pmid_to_reference_id:
                reference_id_list.append(pmid_to_reference_id[int(pmid)])
            else:
                print("The pmid: ", pmid, " is not in the database.")
                bad = 1
        if bad == 1:
            print(line)
            nex_session.rollback()
            continue
        
        insert_summary_references(nex_session, fw, reference_id_list, 
                                  summary_id, source_id, created_by)
        nex_session.commit()

    f.close()
    fw.close()
    
def insert_summary_references(nex_session, fw, reference_id_list, summary_id, source_id, created_by):

    order = 0
    for reference_id in reference_id_list:
        order = order + 1
        x = PathwaysummaryReference(summary_id = summary_id, 
                                    reference_id = reference_id, 
                                    reference_order = order, 
                                    source_id = source_id, 
                                    created_by = created_by)
        nex_session.add(x)
    
        fw.write("insert new summary reference:" + str(summary_id) + ", " + str(reference_id) + ", " + str(order) + "\n")


def insert_pathwaysummary(nex_session, fw, dbentity_id, summary, source_id, created_by):

    x = Pathwaysummary(pathway_id = dbentity_id,
                       summary_type = 'Metabolic',
                       text = summary,
                       html = summary, 
                       source_id = source_id, 
                       created_by = created_by)
    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

    fw.write("insert summary:" + str(dbentity_id) + " " + summary + "\n")
    
    return x.summary_id


if __name__ == "__main__":
        
    summary_file = ""
    created_by = ""
    if len(sys.argv) >= 3:
        summary_file = sys.argv[1]
        created_by = sys.argv[2]
    elif len(sys.argv) >= 2:
        summary_file = sys.argv[1]
    else:
        print("Usage: load_pathway_summaries.py summary_file_name_with_path curator")
        print("Example: load_pathwaysummaries.py data/biochempwy_to-load.tsv KMACPHER")
        exit()

    load_summaries(summary_file, created_by)
    
