from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import EcoUrl
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

## Created on June 2017
## This script is used to load ECO evidence code URLs into NEX2.
## it is one off script


def load_eco_urls():

    nex_session = get_session()

    f = open("data/eco_go_urls.txt")
    for line in f:
        if line.startswith('eco_id'):
            continue
        pieces = line.strip().split('\t')
        eco_id = int(pieces[0])
        display_name = pieces[3]
        obj_url = pieces[4]
        url_type = pieces[5]
        source_id = int(pieces[6])

        x = EcoUrl(eco_id = eco_id,
                   display_name = display_name,
                   obj_url = obj_url,
                   url_type = url_type,
                   source_id = source_id,
                   created_by = CREATED_BY)
        nex_session.add(x)
        nex_session.commit()

        print(eco_id, display_name, obj_url, url_type, source_id)

    nex_session.commit()
    nex_session.close()

if __name__ == "__main__":
 
    load_eco_urls()

    
