import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
from scripts.loading.database_session import get_session
from scripts.loading.reference.promote_reference_triage import add_paper

__author__ = 'sweng66'

def add_papers(pmid_file, created_by):
 
    nex_session = get_session()

    f = open(pmid_file)

    for line in f:
        pmid = int(line.strip())
        print("adding paper for ", pmid)
        add_paper(pmid, created_by)
        
    f.close()
    
    nex_session.commit()

if __name__ == '__main__':

    pmid_file = ""
    created_by = ""
    if len(sys.argv) >= 3:
        pmid_file = sys.argv[1]
        created_by = sys.argv[2]
    else:
        print("Usage: load_papers_from_pmids.py pmid_file_name_with_path created_by")
        print("Example: load_papers_from_pmids.py data/pmid_to_load.lst KMACPHER")
        print("Example: load_papers_from_pmids.py data/pmid_to_load.lst OTTO")
        exit()

    add_papers(pmid_file, created_by)



