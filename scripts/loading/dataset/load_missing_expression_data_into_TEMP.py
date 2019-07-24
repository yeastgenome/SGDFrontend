import sys
import importlib
importlib.reload(sys)  # Reload does the tricsys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import TempExpressionannotation
sys.path.insert(0, '../')
from database_session import get_dev_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'


files_to_load = ["data/expression/to_fix/txt-all"]


def load_data():

    nex_session = get_session()

    i = 0    
    for file in files_to_load:
        f = open(file)
        for line in f:
            if line.startswith('dbentity_id'):
                continue
            pieces = line.strip().split("\t")
            insert_expressionannotation(nex_session, pieces)
            i = i + 1
            if i == 500:
                nex_session.commit()
                i = 0

        f.close()

    # nex_session.rollback()
    nex_session.commit()


def insert_expressionannotation(nex_session, x):

    print("Load ", x[0], x[3], x[4], x[6])

    y = TempExpressionannotation(dbentity_id = int(x[0]),
                                 reference_id = int(x[3]),
                                 datasetsample_id = int(x[4]),
                                 log_ratio_value = float(x[6]))

    nex_session.add(y)

if __name__ == '__main__':

    load_data()

