from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Source, Dbentity, ReferenceAlias
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

## Created on May 2017
## This script is used to load GO_REF data into NEX2.

src = 'GOC' 
type = 'GO reference ID'

def load_go_refs(mapping_file):

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    sgdid_to_dbentity_id = dict([(x.sgdid, x.dbentity_id) for x in nex_session.query(Dbentity).all()])
    
    source_id = source_to_id[src]

    f = open(mapping_file)

    for line in f:
        pieces = line.strip().split("\t")

        print(pieces[0])
        print(pieces[1])

        x = ReferenceAlias(display_name = pieces[0],
                           source_id = source_id,
                           reference_id = sgdid_to_dbentity_id[pieces[1]],
                           alias_type = type,
                           created_by = CREATED_BY)
        nex_session.add(x)

    nex_session.commit()
    nex_session.close()

if __name__ == "__main__":
 
    mapping_file = None

    if len(sys.argv) >= 2:
        mapping_file = sys.argv[1]
    else:
        print("Usage: python update_goref.py GO_REF_to_SGDID.mapping")
        exit()

    load_go_refs(mapping_file)

    
