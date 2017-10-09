import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from promote_reference_triage import add_paper

__author__ = 'sweng66'

def add_papers(pmid_file):
 
    nex_session = get_session()

    f = open(pmid_file)

    for line in f:
        pmid = int(line.strip())
        print "adding paper for ", pmid
        add_paper(pmid)
        
    f.close()
    
    nex_session.commit()

if __name__ == '__main__':

    pmid_file = ""
    if len(sys.argv) >= 2:
        pmid_file = sys.argv[1]
    else:
        print "Usage: load_papers_from_pmids.py pmid_file_name_with_path"
        print "Example: load_papers_from_pmids.py data/pmid_to_load.lst"
        exit()

    add_papers(pmid_file)



