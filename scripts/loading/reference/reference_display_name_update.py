from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
sys.setdefaultencoding('UTF8')
from models import Dbentity, Referencedbentity
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

## Created on June 2017
## This script is used to the display_name in DBENTITY table based on citation 
## in REFERENCEDBENTITY table in NEX2.

def update_database(log_file):

    nex_session = get_session()

    dbentity_id_to_citation = dict([(x.dbentity_id, x.citation) for x in nex_session.query(Referencedbentity).all()])

    all_refs = nex_session.query(Dbentity).filter_by(subclass='REFERENCE').all()

    fw = open(log_file, "w")

    for x in all_refs:
        display_name = dbentity_id_to_citation[x.dbentity_id].split(')')[0] + ')'
        if display_name == x.display_name:
            continue        
        # nex_session.query(Dbentity).filter_by(dbentity_id=x.dbentity_id).update({"display_name": display_name})
        x.display_name = display_name
        fw.write("update display_name from " + x.display_name + " to " + display_name + "\n")
        nex_session.add(x)
        nex_session.commit()
       
    nex_session.close()
    fw.close()

if __name__ == "__main__":

    log_file = "logs/reference_display_name_update.log"
    update_database(log_file)

    
