import sys
import os
from datetime import datetime
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
from src.models import Dataset, Filedbentity, DatasetFile, Referencedbentity, DatasetReference, \
                   Obi, Keyword, DatasetKeyword, DatasetUrl, Datasetlab, Datasetsample, \
                   Datasettrack, Colleague, Source
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

CREATED_BY = os.environ['DEFAULT_USER']

log_file = "scripts/loading/dataset/logs/load_dataset.log"

files_to_load = ["scripts/loading/dataset/data/dataset_metadata_20190419.tsv"]

def load_data():

    nex_session = get_session()

    dataset_to_id = dict([(x.display_name, x.dataset_id) for x in nex_session.query(Dataset).all()])
    format_name_to_id = dict([(x.format_name, x.dataset_id) for x in nex_session.query(Dataset).all()])

    file_to_id = dict([(x.display_name, x.dbentity_id) for x in nex_session.query(Filedbentity).all()])
    obi_name_to_id = dict([(x.format_name, x.obi_id) for x in nex_session.query(Obi).all()]) 
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    keyword_to_id = dict([(x.display_name, x.keyword_id) for x in nex_session.query(Keyword).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    
    coll_name_institution_to_id = dict([((x.display_name, x.institution), x.colleague_id) for x in nex_session.query(Colleague).all()])
    coll_name_to_id = dict([(x.display_name, x.colleague_id) for x in nex_session.query(Colleague).all()])

    fw = open(log_file, "w")

    old_datasets = []
    found = {}
    data = []
    for file in files_to_load:
        f = open(file)
        i = 0
        for line in f:
            if i == 0 and line.startswith('dataset') or line.startswith('Dataset'):
                i = i + 1
                continue
            line = line.strip().replace('"', '')
            if line:
                pieces = line.split("\t")
                if len(pieces) < 14:
                    print("MISSING INFO: ", line)
                    continue
                           
                format_name = pieces[0].strip()
                if format_name in found:
                    continue
                found[format_name] = 1

                if format_name in dataset_to_id:
                    continue

                if format_name in format_name_to_id:
                    old_datasets.append(format_name)
                
                obj_url = pieces[18].strip()
                display_name = pieces[1].strip()
                source = pieces[2].strip()
                if source == 'lab website':
                    source = 'Lab website'
                if source not in ['GEO', 'ArrayExpress', 'Lab website']:
                    source = 'Publication'
                source_id = source_to_id.get(source)
                if source_id is None:
                    print("The source: ", source, " is not in the database")
                    continue

                if pieces[9] == '' or pieces[10] == '' or pieces[11] == '':
                    print("\nMISSING sample_count or is_in_spell or is_in_browser data for the following line: \n", line, "\n")
                    continue

                sample_count = int(pieces[9].strip())
                is_in_spell = pieces[10].strip()
                is_in_browser = pieces[11].strip()
                if sample_count is None:
                    print("The sample_count column is None:", line)
                    continue
                if is_in_spell is None:
                    print("The is_in_spell column is None:", line)
                    continue
                elif int(is_in_spell) > 1:
                    is_in_spell = '1'
                if is_in_browser is None:
                    print("The is_in_browser column is None:", line)
                    continue
                elif int(is_in_browser) > 1:
                    is_in_browser = '1'

                # no date provided
                date_public = str(datetime.now()).split(" ")[0]
                channel_count = None
                if pieces[8]:
                    channel_count = int(pieces[8].strip())

                file_id = None
                if pieces[17]:
                    file_id = file_to_id.get(pieces[17].strip())
                    if file_id is None:
                        print("The file display_name: ", pieces[17], " is not in the database")
                        continue

                description = pieces[12]

                assay_id = obi_name_to_id.get(pieces[6])
                if assay_id is None:
                    print("The OBI format_name: ", pieces[6], " is not in the database")
                    continue

                row =  { "source_id": source_id,
                         "format_name": format_name,
                         "display_name": display_name,
                         "obj_url": "/dataset/" + format_name,
                         "sample_count": sample_count,
                         "assay_id": assay_id,
                         "is_in_spell": is_in_spell,
                         "is_in_browser": is_in_browser,
                         "dbxref_id": pieces[3],
                         "dbxref_type": pieces[4],
                         "date_public": date_public,
                         "channel_count": channel_count,
                         "description": description,
                         "lab_name": pieces[13].strip(),
                         "lab_location": pieces[14].strip(),
                         "keywords": pieces[15].strip(),
                         "pmids": pieces[16].strip(),
                         "file_id": file_id,
                         "obj_url": obj_url,
                         "url_type": pieces[19].strip() }

                data.append(row)
                
        f.close()

    delete_old_datasets(nex_session, fw, old_datasets, format_name_to_id)

    insert_datasets(nex_session, fw, data, pmid_to_reference_id, 
                    keyword_to_id, coll_name_institution_to_id, coll_name_to_id, 
                    None)

    fw.close()

    # nex_session.rollback()
    nex_session.commit()


def delete_old_datasets(nex_session, fw, old_datasets, format_name_to_id):
    
    for format_name in old_datasets:

        print("Deleting old dataset...")
        
        dataset_id = format_name_to_id.get(format_name)
        if dataset_id is None:
            continue

        nex_session.query(DatasetFile).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(DatasetReference).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(DatasetKeyword).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(DatasetUrl).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(Datasetlab).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(Datasetsample).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(Datasettrack).filter_by(dataset_id=dataset_id).delete()
        nex_session.query(Dataset).filter_by(dataset_id=dataset_id).delete()
        
        fw.write("Delete old dataset: " + format_name + "\n")


def insert_datasets(nex_session, fw, data, pmid_to_reference_id, keyword_to_id, coll_name_institution_to_id, coll_name_to_id, dataset_to_id):

    for x in data:

        ## load into dataset table
        parent_dataset_id = None
        # if x.get('parent_dataset'):
        #    parent_dataset_id = dataset_to_id
        dataset_id = insert_dataset(nex_session, fw, x, parent_dataset_id)

        ## load into dataset_file if x['file_name'] is not None
        if x.get('file_id'):
            insert_dataset_file(nex_session, fw, dataset_id, x['file_id'], x['source_id'])
        
        ## load into dataset_keyword table if x['keywords'] is not None
        if x.get('keywords'):
            keywords = x['keywords'].strip().split("|")
            for keyword in keywords:
                keyword = keyword.strip()
                keyword_id = keyword_to_id.get(keyword)
                if keyword_id is None:
                    print("The keyword: '" + keyword + "' is not in the database.")
                    continue
                insert_dataset_keyword(nex_session, fw, dataset_id, 
                                       keyword_id, x['source_id'])
            
        ## load into dataset_reference table
        if x.get('pmids'):
            pmids = x['pmids'].strip().replace(" ", "").split("|")
            for pmid in pmids:
                reference_id = pmid_to_reference_id.get(int(pmid))
                if reference_id is None:
                    print("The PMID: ", pmid, " is not in the database.")
                    continue
                insert_dataset_reference(nex_session, fw, dataset_id, 
                                         reference_id, x['source_id'])

        ## load into dataset_url table
        if x.get('obj_url') and x.get('url_type'):
            urls = x.get('obj_url').split('|')
            # only one url_type is provided...
            type = x.get('url_type')
            for url in urls:
                insert_dataset_url(nex_session, fw, dataset_id,
                                   url, type, x['source_id'])

        ## load into datasetlab table
        if x.get('lab_name') and x.get('lab_location'):
            insert_datasetlab(nex_session, fw, dataset_id,
                              x['lab_name'], x['lab_location'], 
                              coll_name_institution_to_id, 
                              coll_name_to_id, x['source_id'])

def insert_datasetlab(nex_session, fw, dataset_id, lab_name, lab_location, coll_name_institution_to_id, coll_name_to_id, source_id):

    print("LAB: ", dataset_id, lab_name, lab_location)

    coll_display_name = lab_name
    coll_institution = lab_location.replace('"', '')
    if len(coll_institution) > 100:
        coll_institution = coll_institution.replace("National Institute of Environmental Health Sciences", "NIEHS")
        if coll_institution.startswith('Department'):
            items = coll_institution.split(', ')
            items.pop(0)
            coll_institution = ', '.join(items)

    name = lab_name.split(' ')                                                  
    last_name = name[0]                                                         
    first_name = name[1].replace(', ', '')
    lab_name = last_name + ' ' + first_name
    colleague_id = coll_name_institution_to_id.get((coll_display_name, coll_institution))
    if colleague_id is None:
        colleague_id = coll_name_to_id.get(coll_display_name)
        
    x = None
    if colleague_id is not None:
        x = Datasetlab(dataset_id = dataset_id,
                       source_id = source_id,
                       lab_name = lab_name,
                       lab_location = coll_institution,
                       colleague_id = colleague_id,
                       created_by = CREATED_BY)
    else:
        x = Datasetlab(dataset_id = dataset_id,
                       source_id = source_id,
                       lab_name = lab_name,
                       lab_location = coll_institution,
                       created_by =CREATED_BY)
    nex_session.add(x)


def insert_dataset_url(nex_session, fw, dataset_id, obj_url, url_type, source_id):

    print("URL:",  dataset_id, obj_url, url_type)

    x = DatasetUrl(dataset_id = dataset_id,
                   source_id = source_id,
                   display_name = url_type,
                   obj_url = obj_url,
                   url_type = url_type,
                   created_by = CREATED_BY)
    nex_session.add(x)


def insert_dataset_reference(nex_session, fw, dataset_id, reference_id, source_id):

    print("REF:", dataset_id, reference_id, source_id)
    
    x = DatasetReference(reference_id = reference_id,
                         dataset_id = dataset_id,
                         source_id = source_id,
                         created_by = CREATED_BY)
    nex_session.add(x)


def insert_dataset_keyword(nex_session, fw, dataset_id, keyword_id, source_id):

    print("KW:", dataset_id, keyword_id, source_id)
    
    x = DatasetKeyword(keyword_id = keyword_id,
                       dataset_id = dataset_id,
                       source_id = source_id,
                       created_by = CREATED_BY)
    nex_session.add(x)


def insert_dataset_file(nex_session, fw, dataset_id, file_id, source_id):

    print("FILE:", dataset_id, file_id, source_id)
    
    x = DatasetFile(file_id = file_id,
                    dataset_id = dataset_id,
                    source_id = source_id,
                    created_by = CREATED_BY)
    nex_session.add(x)

def insert_dataset(nex_session, fw, x, parent_dataset_id):

    print("DATASET:", x)
    
    y = Dataset(format_name = x['format_name'],
                display_name = x['display_name'],
                obj_url = "/dataset/" + x['format_name'],
                source_id = x['source_id'],
                dbxref_id = x.get('dbxref_id'),
                dbxref_type = x.get('dbxref_type'),
                date_public = x.get('date_public'),
                parent_dataset_id = x.get('parent_dataset_id'),
                assay_id = x.get('assay_id'),
                channel_count = x.get('channel_count'),
                sample_count = x.get('sample_count'),
                is_in_spell = x.get('is_in_spell'),
                is_in_browser = x.get('is_in_browser'),
                description = x.get('description'),
                created_by = CREATED_BY)

    nex_session.add(y)
    nex_session.flush()
    nex_session.refresh(y)

    fw.write("Insert dataset: " + x['display_name'] + " into database\n")

    return y.dataset_id

if __name__ == '__main__':

    load_data()

