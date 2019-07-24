from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Ec, EcUrl, Source
sys.path.insert(0, '../')
from database_session import get_nex_session
from config import CREATED_BY

__author__ = 'sweng66'

file_to_load = "data/enzclass.txt"
log_file = "logs/load_ec_classes.log"

def load_data():
 
    nex_session = get_nex_session()

    brenda = nex_session.query(Source).filter_by(format_name='BRENDA').one_or_none()
    b_source_id = brenda.source_id
    expasy = nex_session.query(Source).filter_by(format_name='ExPASy').one_or_none()
    e_source_id = expasy.source_id
    
    fw = open(log_file, "w")

    f = open(file_to_load)
    for line in f:
        line = line.strip()
        if len(line) < 8 or line[1] != ".":
            continue
        line = line.replace(". ", ".")
        # convert multiple spaces to single space
        line = ' '.join(line.split())
        pieces = line.split(" ")
        ec = pieces.pop(0)
        desc = ' '.join(pieces)
        ec_id = load_ec(nex_session, fw, ec, desc, e_source_id)
        load_ec_url(nex_session, fw, ec_id, ec, e_source_id, b_source_id)

    f.close()
    fw.close()

    # nex_session.rollback()
    nex_session.commit()


def load_ec_url(nex_session, fw, ec_id, ec, e_source_id, b_source_id):
    
    print(ec_id, ec, e_source_id, b_source_id)
    
    ## load BRENDA URL:
    
    x = EcUrl(source_id = b_source_id,
              display_name = "BRENDA",
              obj_url = "http://www.brenda-enzymes.org/php/result_flat.php4?ecno=" + ec,
              ec_id = ec_id,
              url_type = "BRENDA",
              created_by = CREATED_BY)

    nex_session.add(x)
    
    fw.write("Insert EC_URL: http://www.brenda-enzymes.org/php/result_flat.php4?ecno="+ec+"\n")

    ## load ExPASy URL:

    x = EcUrl(source_id = b_source_id,
              display_name = "ExPASy",
              obj_url = "http://enzyme.expasy.org/EC/" + ec,
              ec_id = ec_id,
              url_type = "ExPASy",
              created_by = CREATED_BY)

    nex_session.add(x)

    fw.write("Insert EC_URL: http://enzyme.expasy.org/EC/"+ec+"\n")

def load_ec(nex_session, fw, ec, desc, source_id):

    print(ec, desc, source_id)

    ec = "EC:" + ec
    
    x = Ec(source_id = source_id,
           format_name = ec,
           display_name = ec,
           obj_url = "/ecnumber/" + ec,
           ecid = ec,
           description = desc,
           is_obsolete = '0',
           created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    ec_id = x.ec_id

    fw.write("Insert "+ec+"\n")

    return ec_id

    
if __name__ == '__main__':
    
    load_data()



