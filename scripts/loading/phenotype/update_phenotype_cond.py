import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import PhenotypeannotationCond
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

# units = {}

def update_data():

    nex_session = get_session()

    all_conds = nex_session.query(PhenotypeannotationCond).filter_by(condition_class='chemical').all()

    nex_session.close()
    nex_session = get_session()

    i = 0
    for x in all_conds:
        if x.condition_value is None or x.condition_value == "":
            continue
        if x.condition_unit is not None and x.condition_unit != "":
            continue
        else:
            condition_value = x.condition_value
            if " " not in condition_value:
                condition_value= condition_value.replace("uM"," uM")
                condition_value = condition_value.replace("mM", " mM")
                condition_value= condition_value.replace("g/L"," g/L")
                condition_value= condition_value.replace("%"," %") # should we do this??
            values = condition_value.split(' ')
            if len(values) >= 3 or "," in condition_value or len(values) == 1:
                # print "TO_FIX:", str(x.condition_id) + "\t" + str(x.annotation_id) + "\t" + x.condition_name + "\t" + x.condition_value + "\t" + str(x.condition_unit) 
                continue
            elif values[1] in ['analog', 'derivative', 'B', 'C', 'X', 'CaCl2','Brix','B1', '2.7']:
                # print "TO_FIX:", str(x.condition_id) + "\t" + str(x.annotation_id) + "\t" + x.condition_name + "\t" + x.condition_value + "\t" + str(x.condition_unit)
                continue
            else:
                print(values[0], ":", values[1])
                nex_session.query(PhenotypeannotationCond).filter_by(condition_id=x.condition_id).update({"condition_value": values[0], "condition_unit": values[1]})
                i = i + 1
                if i > 500:
                    nex_session.commit()
                    i = 0

    nex_session.commit()
    nex_session.close() 

    # for unit in units:
    #    print "UNIT: ", unit

if __name__ == '__main__':

    update_data()




