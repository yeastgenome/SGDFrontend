import sys
import importlib
importlib.reload(sys)  
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Dataset, Datasetsample, Referencedbentity, DatasetReference
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

nex_session = get_session()

dataset_id_to_sample_count = dict([(x.dataset_id, x.sample_count) for x in nex_session.query(Dataset).filter_by(is_in_spell='true').all()])

sample_count = {}

for x in nex_session.query(Datasetsample).all():
    if x.dataset_id in sample_count:
        sample_count[x.dataset_id] = sample_count[x.dataset_id] + 1
    else:
        sample_count[x.dataset_id] = 1

for dataset_id in sample_count:
    if dataset_id not in dataset_id_to_sample_count:
        continue
    if sample_count[dataset_id] != dataset_id_to_sample_count[dataset_id]:
        print("MISMATCH: ", dataset_id, sample_count[dataset_id], dataset_id_to_sample_count[dataset_id])
    else:
        print("MATCH:    ", dataset_id,sample_count[dataset_id], dataset_id_to_sample_count[dataset_id])




    
