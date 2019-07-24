from datetime import datetime
import math
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Dataset, Datasetsample, Expressionannotation
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

## Created on June 2017
## This script is used to transform (log2) the channel2 expression value and 
## put the data in log_ratio_value column in NEX2.


def update_database():

    nex_session = get_session()

    dataset_id_to_dataset = dict([(x.dataset_id, x) for x in nex_session.query(Dataset).filter_by(channel_count=1).all()])
    datasetsample_id_to_dataset_id = dict([(x.datasetsample_id, x.dataset_id) for x in nex_session.query(Datasetsample).all()])

    all_expressions = nex_session.query(Expressionannotation).all()

    for x in all_expressions:
        if x.log_ratio_value is not None:
            continue
        dataset_id = datasetsample_id_to_dataset_id.get(x.datasetsample_id)
        if dataset_id is None:
            # print "BAD: The datasetsample_id: ", x.datasetsample_id, " is not in the database."
            continue
        if dataset_id not in dataset_id_to_dataset:
            # print "BAD: The datasetsample_id: ", x.datasetsample_id, " is mapped to a dataset_id=", dataset_id, " that doesn't have channel_count=1"
            continue

        ## update data from here
        value = x.normalized_expression_value
        new_value = 0
        if value > 0:
            new_value = math.log(value, 2)
            ## round down to 2 decimal point
            new_value = float("%.2f" % new_value)  
       
        print(x.annotation_id, value, new_value)

    nex_session.close()

if __name__ == "__main__":
 
    update_database()

    
