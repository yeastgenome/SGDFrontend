import sys
import importlib
importlib.reload(sys)  # Reload does the tricsys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Expressionannotation
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_expression.log"

files_to_load = ["data/expression_annotation_ready_to_load.txt"]
date_created = '2017-08-09'

def load_data():

    nex_session = get_session()

    key_to_id = dict([((x.dbentity_id, x.datasetsample_id), x.annotation_id) for x in nex_session.query(Expressionannotation).all()])
    
    nex_session.close()

    nex_session = get_session()

    fw = open(log_file, "w")
    i = 0    
    j = 0
    for file in files_to_load:
        f = open(file)
        for line in f:
            if line.startswith('dbentity_id'):
                continue
            pieces = line.strip().split("\t")
            if (int(pieces[0]), int(pieces[4])) in key_to_id:
                continue
            insert_expressionannotation(nex_session, fw, pieces)
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

    fw.close()

    # nex_session.rollback()
    nex_session.commit()


def insert_expressionannotation(nex_session, fw, x):

    print("Load ", x[0], x[3], x[4], x[5], x[6])

    y = Expressionannotation(dbentity_id = int(x[0]),
                             source_id = int(x[1]),
                             taxonomy_id = int(x[2]),
                             reference_id = int(x[3]),
                             datasetsample_id = int(x[4]),
                             normalized_expression_value = float(x[5]),
                             log_ratio_value = float(x[6]),
                             date_created = date_created,
                             created_by = CREATED_BY)

    nex_session.add(y)

    # fw.write("Insert expressionannotation for dbentity_id="+str(x[0])+"\n")

if __name__ == '__main__':

    load_data()

