import logging
import os
from datetime import datetime
import time
import sys
from src.models import Dbentity, Referencedbentity
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

def update_reference_data():

    nex_session = get_session()

    log.info("Updating DBENTITY.display_name...")

    ## update display_name in DBENTITY table
    dbentity_id_to_citation = dict([(x.dbentity_id, (x.citation, x.pmid)) for x in nex_session.query(Referencedbentity).all()])
    
    all_refs = nex_session.query(Dbentity).filter_by(subclass='REFERENCE').all()

    for x in all_refs:
        if x.dbentity_id not in dbentity_id_to_citation:
            log.info("The dbentity_id=" + str(x.dbentity_id) + " is not in the referencedbentity table.\n")
            continue
        (citation, pmid) = dbentity_id_to_citation.get(x.dbentity_id)
        display_name = citation.split(')')[0] + ')'
        if display_name == x.display_name:
            continue
        display_name_old = x.display_name
        x.display_name = display_name
        nex_session.add(x)
        nex_session.commit()
        log.info("PMID:" + str(pmid) + " display_name is changed from " + display_name_old + " to " + display_name) 

    log.info("Done")


if __name__ == '__main__':
    
    update_reference_data()




