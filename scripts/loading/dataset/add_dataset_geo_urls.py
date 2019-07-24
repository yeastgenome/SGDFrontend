from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Source, Dataset, DatasetUrl
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

## Created on May 2017
## This script is used to load GEO URL data into NEX2.

src = 'GEO' 
type = 'GEO'
geo_root_url = 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='

def load_geo_urls():

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    dataset_id_to_url = dict([(x.dataset_id, x) for x in nex_session.query(DatasetUrl).filter_by(url_type='GEO').all()])
    
    source_id = source_to_id[src]
    for x in nex_session.query(Dataset).all():
        if x.dbxref_id and x.dbxref_id.startswith('GSE') and x.dataset_id not in dataset_id_to_url:
            print(x.dbxref_id)

            y = DatasetUrl(display_name = type,
                           dataset_id = x.dataset_id,
                           source_id = source_id,
                           obj_url = geo_root_url + x.dbxref_id,
                           url_type = type,
                           created_by = CREATED_BY)
            nex_session.add(y)

    nex_session.commit()
    nex_session.close()

if __name__ == "__main__":
 
    load_geo_urls()

    
