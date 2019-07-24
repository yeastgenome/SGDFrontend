from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Datasetsample
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

## Created on May 2017
## This script is used to load GEO URL data into NEX2.

geo_root_url = 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='

def load_geo_urls():

    nex_session = get_session()

    all = nex_session.query(Datasetsample).all()

    nex_session.close()

    nex_session = get_session()

    i = 0
    for x in all:
        if x.dbxref_id and x.dbxref_url is None:
            print(x.dbxref_id)
            dbxref_url = geo_root_url + x.dbxref_id    
            nex_session.query(Datasetsample).filter_by(datasetsample_id=x.datasetsample_id).update({"dbxref_url": dbxref_url})
            i = i + 1
            if i == 200:
                nex_session.commit()
                i = 0
    nex_session.commit()
    nex_session.close()

if __name__ == "__main__":
 
    load_geo_urls()

    
