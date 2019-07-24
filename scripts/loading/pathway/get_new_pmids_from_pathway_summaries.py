import sys
import os
from src.models import Referencedbentity
from scripts.loading.database_session import get_session
                             
__author__ = 'sweng66'

def get_new_pmids(summary_file):
    
    nex_session = get_session()

    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    
    f = open(summary_file)
    
    new_pmids = []

    for line in f:

        pieces = line.strip().split("\t")

        if len(pieces) < 3:
            print(line)
            continue

        pmids = pieces[2].strip().replace(" ", "").split("|")

        for pmid in pmids:
            if int(pmid) not in pmid_to_reference_id:
                if pmid not in new_pmids:
                    new_pmids.append(pmid)

        continue

    f.close()
    
    for pmid in new_pmids:
        print("NEW PMID: ", pmid)

if __name__ == "__main__":
        
    summary_file = ""
    created_by = ""
    if len(sys.argv) >= 3:
        summary_file = sys.argv[1]
        created_by = sys.argv[2]
    elif len(sys.argv) >= 2:
        summary_file = sys.argv[1]
    else:
        print("Usage: get_new_pmids_from_pathway_summaries.py summary_file_name_with_path")
        print("Example: get_new_pmids_from_pathway_summaries.py data/biochempwy_to-load.tsv")
        exit()

    get_new_pmids(summary_file)
    
