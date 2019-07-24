import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Dataset, Datasetsample, Taxonomy, Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_missing_datasetsample.log"

files_to_load = ["data/new-2017-07/missing_inSpell_datasetsample-shuai.tsv",
                 "data/new-2017-07/missing_inSpell_datasetsample2-shuai.tsv"]

def load_data():

    nex_session = get_session()

    format_name_to_dataset_id_src = dict([(x.format_name, (x.dataset_id, x.source_id)) for x in nex_session.query(Dataset).all()])
    taxid_to_taxonomy_id = dict([(x.taxid, x.taxonomy_id) for x in nex_session.query(Taxonomy).all()])
    format_name_to_datasetsample_id = dict([(x.format_name, x.datasetsample_id) for x in nex_session.query(Datasetsample).all()])

    fw = open(log_file, "w")
        
    # format_name2display_name = {}
    # dataset2index = {}
    for file in files_to_load:
        print("Loading data from ", file)
        f = open(file)
        for line in f:
            if line.startswith('dataset'):
                continue
            line = line.strip()
            if line:
                pieces = line.replace('"', '').split("\t")
                GSE = pieces[0].strip()
                GSM = pieces[3].strip()

                dataset_format_name = GSE
                if dataset_format_name not in format_name_to_dataset_id_src:
                    print("The dataset: ", dataset_format_name, " is not in DATASET table.")
                    continue
                (dataset_id, source_id) = format_name_to_dataset_id_src[dataset_format_name]
                if len(pieces) < 9 or pieces[8] == '':
                    print("SHORT LINE:", len(pieces), line)
                    continue
                display_name = pieces[1]
        
                description = ""
                if pieces[2] != '':                        
                    description = pieces[2]                                                     
                    if len(pieces[2]) > 500:
                        description = display_name
                       
                data = { "source_id": source_id,
                         "dataset_id": dataset_id,
                         "display_name": display_name,
                         "sample_order": int(pieces[8]) }

                if pieces[2] != '':
                    data['description'] = pieces[2]
                    if len(pieces[2]) > 500:
                        data['description'] = display_name
                if pieces[5] != '':
                    data['biosample'] = pieces[5]
                if pieces[7] != '':
                    data['strain_name'] = pieces[7]
                if len(pieces) > 9 and pieces[9]:
                    taxonomy_id = taxid_to_taxonomy_id.get("TAX:"+pieces[9])
                    if taxonomy_id is None:
                        print("The taxid = ", pieces[9], " for: ", dataset_format_name, GSM, " is not in TAXONOMY table.")
                    else:
                        data['taxonomy_id'] = taxonomy_id
      
                data['dbxref_type'] = pieces[4]
                
                data['format_name'] = dataset_format_name + "_" + GSM
                if data['format_name'] in format_name_to_datasetsample_id:
                    # print "The datasetsample format_name: ", data['format_name'], " is already in the database"
                    continue
                data['obj_url'] = "/datasetsample/" + data['format_name']
                data['dbxref_id'] = GSM

            insert_datasetsample(nex_session, fw, data)

        f.close()

    fw.close()

    # nex_session.rollback()
    nex_session.commit()


def insert_datasetsample(nex_session, fw, x):

    print("Load ", x['format_name'])

    y = Datasetsample(format_name = x['format_name'],
                      display_name = x['display_name'],
                      obj_url = x['obj_url'],
                      source_id = x['source_id'],
                      dataset_id = x['dataset_id'],
                      sample_order = x['sample_order'],
                      description = x.get('description'),
                      biosample = x.get('biosample'),
                      strain_name = x.get('strain_name'),
                      taxonomy_id = x.get('taxonomy_id'),
                      dbxref_type = x.get('dbxref_type'),
                      dbxref_id = x.get('dbxref_id'),
                      created_by = CREATED_BY)

    nex_session.add(y)

    fw.write("Insert datasetsample: " + x['display_name'] + " into database\n")

if __name__ == '__main__':

    load_data()

