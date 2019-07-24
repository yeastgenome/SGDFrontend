import sys
sys.path.insert(0, '../../../src/')
from models import Pathwaydbentity
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
                             
__author__ = 'sweng66'

ocelot_file = "data/yeastbase.ocelot"

def add_display_name():
        
    f = open(ocelot_file)
    
    biocyc_id = None
    display_name = None
    biocyc_to_display_name = {}
    prev_line = None
    for line in f:
        line = line.strip()
        if len(line) == 0:
            if biocyc_id and display_name:
                biocyc_to_display_name[biocyc_id] = display_name
            biocyc_id =None
            display_name = None
            continue
        if line.startswith('(') and line.endswith(' NIL ('):
            # print line
            biocyc_id = line.replace("(", "").split(" ")[0]
            continue
        if line.startswith("(COMMON-NAME ") and line != "(COMMON-NAME NIL)":
            # print line
            display_name = line.replace('(COMMON-NAME "', '').replace('")', '')
            continue
        
    f.close()
    
    nex_session = get_session()

    all_pathways = nex_session.query(Pathwaydbentity).all()

    for x in all_pathways:
        if x.biocyc_id in biocyc_to_display_name:
            nex_session.query(Pathwaydbentity).filter_by(biocyc_id=x.biocyc_id).update({'display_name': biocyc_to_display_name[x.biocyc_id]})
            print(x.biocyc_id + "\t" + biocyc_to_display_name[x.biocyc_id])
        else:
            print("NOT FOUND:", x.biocyc_id)
    
    nex_session.rollback()
    # nex_session.commit()

if __name__ == "__main__":
        
    add_display_name()
