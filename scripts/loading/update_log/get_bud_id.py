import sys
import importlib
importlib.reload(sys)  # Reload does the tricsys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Updatelog
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'


file = "data/update_log.txt-1"

def load_data():

    nex_session = get_session()

    bud_id_to_id = dict([(x.bud_id, x.updatelog_id) for x in nex_session.query(Updatelog).all()])

    for bud_id in bud_id_to_id:
        print(bud_id)
    return

    i = 0    
    j = 0
    f = open(file)
    for line in f:
        pieces = line.strip().split("\t")
        if int(pieces[0]) in bud_id_to_id:
            continue
        insert_update_log(nex_session, pieces)
        i = i + 1
        j = j + 1
        if i == 500:
            nex_session.commit()
            i = 0
        if j == 200000:
            nex_session.close()
            nex_session = get_session()
            j = 0
    f.close()

    # nex_session.rollback()
    nex_session.commit()


def insert_update_log(nex_session, x):

    print("Load ", x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7])

    y = Updatelog(bud_id = int(x[0]),
                  tab_name = x[1],
                  col_name = x[2],
                  primary_key = int(x[3]),
                  old_value = x[4].replace("\r", "\n"),
                  new_value = x[5].replace("\r", "\n"),
                  date_created = str(x[6]),
                  created_by = x[7])
    nex_session.add(y)

if __name__ == '__main__':

    load_data()

