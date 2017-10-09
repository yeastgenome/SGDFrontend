import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Dataset, Datasetsample, Taxonomy, Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_datasetsample.log"

files_to_load = ["data/new-2017-07/dataset_samples_GEO_all_2015.tsv",
                 "data/new-2017-07/dataset_samples_GEO_all_2016_cleanedup.tsv",
                 "data/new-2017-07/dataset_samples_inSPELL_2015.tsv",
                 "data/new-2017-07/dataset_samples_inSPELL_2016.tsv"]

ds_multiassays_to_sample_mapping_file = "data/new-2017-07/ds_multiassays-to-samples_mapping.tsv"
ds_with_multiassays_file = "data/new-2017-07/dataset_with_multiple_assays.lst"

def load_data():

    nex_session = get_session()

    format_name_to_dataset_id_src = dict([(x.format_name, (x.dataset_id, x.source_id)) for x in nex_session.query(Dataset).all()])
    taxid_to_taxonomy_id = dict([(x.taxid, x.taxonomy_id) for x in nex_session.query(Taxonomy).all()])
    format_name_to_datasetsample_id = dict([(x.format_name, x.datasetsample_id) for x in nex_session.query(Datasetsample).all()])

    fw = open(log_file, "w")

    GSE_GSM_to_assay = {}
    f = open(ds_multiassays_to_sample_mapping_file)
    for line in f:
        pieces = line.strip().split("\t")
        GSE = pieces[0].strip()
        assay_name = pieces[1]
        GSM_list = pieces[2].strip().split('|')
        for GSM in GSM_list:
            GSE_GSM_to_assay[(GSE, GSM)] = assay_name
    f.close()

    GSE_assay_to_dataset_format_name = {}
    f = open(ds_with_multiassays_file)
    for line in f:
        pieces = line.strip().split("\t")
        GSE = pieces[0].strip()
        dataset_format_name = pieces[1].strip()
        assay_name = pieces[2].strip()
        GSE_assay_to_dataset_format_name[(GSE, assay_name)] = dataset_format_name
    f.close()
        
    format_name2display_name = {}
    dataset2index = {}
    for file in files_to_load:
        print "Loading data from ", file
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
                if (GSE, GSM) in GSE_GSM_to_assay:
                    assay = GSE_GSM_to_assay[(GSE, GSM)]
                    # print "FOUND assay:", (GSE, GSM), assay
                    if (GSE, assay) in GSE_assay_to_dataset_format_name:
                        dataset_format_name = GSE_assay_to_dataset_format_name[(GSE, assay)]
                    #    print "FOUND dataset format_name:", (GSE, assay), dataset_format_name
                    # else:
                    #    print "NOT FOUND dataset format_name:", (GSE, assay)

                if dataset_format_name not in format_name_to_dataset_id_src:
                    print "The dataset: ", dataset_format_name, " is not in DATASET table."
                    continue
                (dataset_id, source_id) = format_name_to_dataset_id_src[dataset_format_name]
                if len(pieces) < 9 or pieces[8] == '':
                    print "SHORT LINE:", len(pieces), line
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
                        print "The taxid = ", pieces[9], " for: ", dataset_format_name, GSM, " is not in TAXONOMY table."
                    else:
                        data['taxonomy_id'] = taxonomy_id
                if GSM == '':
                    index = dataset2index.get(dataset_format_name, 0) + 1
                    data['format_name'] = dataset_format_name + "_sample_" + str(index)
                    if data['format_name'] in format_name_to_datasetsample_id:
                        print "format_name for Non GSM row: ", data['format_name'], " is used."
                        continue
                    dataset2index[dataset_format_name] = index
                    data['obj_url'] = "/datasetsample/" + data['format_name']
                    insert_datasetsample(nex_session, fw, data)
                else:
                    data['dbxref_type'] = pieces[4]
                    if format_name2display_name.get(GSM):
                        print "The format_name: ", GSM, " has been used for other sample", format_name2display_name.get(GSM)
                        continue
                    format_name2display_name[GSM] = display_name
                    data['format_name'] = dataset_format_name + "_" + GSM
                    if data['format_name'] in format_name_to_datasetsample_id:
                        print "format_name for GSM row: ", data['format_name'], " is used."
                        continue
                    data['obj_url'] = "/datasetsample/" + data['format_name']
                    data['dbxref_id'] = GSM
                    insert_datasetsample(nex_session, fw, data)
        f.close()

    fw.close()

    # nex_session.rollback()
    nex_session.commit()


def insert_datasetsample(nex_session, fw, x):

    print "Load ", x['format_name']

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

