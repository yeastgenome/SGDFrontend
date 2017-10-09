import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Dataset, Filedbentity, DatasetFile, Referencedbentity, DatasetReference, \
                   Obi, Keyword, DatasetKeyword, DatasetUrl, Datasetlab, Datasetsample, \
                   Datasettrack, Colleague, Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_dataset.log"

files_to_load = ["data/new-2017-07/datasets_inSPELL_2015.tsv",
                 "data/new-2017-07/datasets_inSPELL_2016_cleaned.tsv",
                 "data/new-2017-07/datasets_GEO_all_2015_cleanedup.tsv",
                 "data/new-2017-07/datasets_GEO_all_2016_cleanedup.tsv"]

def load_data():

    nex_session = get_session()

    dataset_to_id = dict([(x.display_name, x.dataset_id) for x in nex_session.query(Dataset).all()])
    format_name_to_id = dict([(x.format_name, x.dataset_id) for x in nex_session.query(Dataset).all()])

    file_to_id = dict([(x.display_name, x.dbentity_id) for x in nex_session.query(Filedbentity).all()])
    obi_name_to_id = dict([(x.display_name, x.obi_id) for x in nex_session.query(Obi).all()]) 
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    keyword_to_id = dict([(x.display_name, x.keyword_id) for x in nex_session.query(Keyword).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    
    coll_name_institution_to_id = dict([((x.display_name, x.institution), x.colleague_id) for x in nex_session.query(Colleague).all()])
    coll_name_to_id = dict([(x.display_name, x.colleague_id) for x in nex_session.query(Colleague).all()])

    fw = open(log_file, "w")

    found = {}
    other_data = []
    child_data = []
    old_datasets = []
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
                    print "MISSING INFO: ", line
                    continue
                           
                format_name = pieces[0].strip()
                if format_name in found:
                    continue
                found[format_name] = 1

                if format_name in dataset_to_id:
                    continue

                if format_name in format_name_to_id:
                    old_datasets.append(format_name)
                
                obj_url = pieces[20].strip()

                if format_name not in obj_url and "GEO_all_2016" in file:
                    obj_url = "ftp://ftp.ncbi.nlm.nih.gov/geo/series/" + format_name[0:-3] + "nnn/" + format_name + "/"
                    print "FIX OBJ_URL:", format_name, pieces[3], obj_url, pieces[20]
                    
                if "|" in obj_url or "|" in pieces[21]:
                    print "MULTIPLE-URL:", pieces[21], obj_url
                
                display_name = pieces[1].strip()
                source = pieces[2].strip()
                if source == 'lab website':
                    source = 'Lab website'
                if source not in ['GEO', 'ArrayExpress', 'Lab website']:
                    source = 'Publication'
                source_id = source_to_id.get(source)
                if source_id is None:
                    print "The source: ", source, " is not in the database"
                    continue

                if pieces[11] == '' or pieces[12] == '' or pieces[13] == '':
                    print "\nMISSING sample_count or is_in_spell or is_in_browser data for the following line: \n", line, "\n"
                    continue

                sample_count = int(pieces[11].strip())
                is_in_spell = pieces[12].strip()
                is_in_browser = pieces[13].strip()
                if sample_count is None:
                    print "The sample_count column is None:", line
                    continue
                if is_in_spell is None:
                    print "The is_in_spell column is None:", line
                    continue
                elif int(is_in_spell) > 1:
                    is_in_spell = '1'
                if is_in_browser is None:
                    print "The is_in_browser column is None:", line
                    continue
                elif int(is_in_browser) > 1:
                    is_in_browser = '1'

                date_public = ""
                if pieces[5]:
                    date_public = pieces[5].strip()
                    if "/" in date_public:
                        dates = date_public.split('/')
                        month = dates[0]
                        day = dates[1]
                        year = dates[2]
                        if len(month) == 1:
                            month = "0" + month
                        if len(day) == 1:
                            day = "0" + day
                        if len(year) == 2:
                            year = "20" + year
                        date_public = year + "-" + month + "-" + day
                
                channel_count = ""
                if pieces[10]:
                    channel_count = int(pieces[10].strip())

                file_id = None
                if pieces[19]:
                    file_id = file_to_id.get(pieces[19].strip())
                    if file_id is None:
                        print "The file display_name: ", pieces[19], " is not in the database"
                        continue

                description = ""
                if pieces[14]:
                    desc_item = pieces[14].strip().split(". ")
                    description = desc_item[0]
                    desc_item.pop(0)
                    for desc in desc_item:
                        if description.endswith('et al') or description.endswith(' S') or description == 'S':
                            description = description + ". " + desc

                assay_names = pieces[7].strip().split('|')
                i = 0
                for assay_name in assay_names:
                    if assay_name == 'OBI:0000626':
                        assay_name = 'DNA sequencing'
                    if assay_name == 'transcriptional profiling by array assay':
                        assay_name = 'transcription profiling by array assay'
                    if assay_name.startswith('NTR:'):
                        assay_name = assay_name.replace('NTR:', '')
                    assay_id = obi_name_to_id.get(assay_name)
                    if assay_id is None:
                        print "The assay name:", assay_name, " is not in OBI table."
                        continue
                    i = i + 1
                    if len(assay_names) > 1:
                        this_format_name = format_name + "-" + str(i)
                        print "MULTIPLE-ASSAY:", format_name+"\t"+this_format_name+"\t"+assay_name
                    else:
                        this_format_name = format_name
                    
                    data = { "source_id": source_id,
                             "format_name": this_format_name,
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
                             "parent_dataset": pieces[6].strip(),
                             "lab_name": pieces[15].strip(),
                             "lab_location": pieces[16].strip(),
                             "keywords": pieces[17].strip(),
                             "pmids": pieces[18].strip(),
                             "file_id": file_id,
                             "obj_url": obj_url,
                             "url_type": pieces[21].strip() }

                    if pieces[6]: 
                        # print "CHILD: ", data
                        child_data.append(data)
                    else:
                        # print "OTHER: ", data
                        other_data.append(data)
                
        f.close()

    delete_old_datasets(nex_session, fw, old_datasets, format_name_to_id)

    insert_datasets(nex_session, fw, other_data, pmid_to_reference_id, 
                    keyword_to_id, coll_name_institution_to_id, coll_name_to_id, 
                    None)

    dataset_to_id = dict([(x.display_name, x.dataset_id) for x in nex_session.query(Dataset).all()])

    insert_datasets(nex_session, fw, child_data, pmid_to_reference_id, 
                    keyword_to_id, coll_name_institution_to_id, coll_name_to_id, 
                    dataset_to_id)

    fw.close()

    # nex_session.rollback()
    nex_session.commit()


def delete_old_datasets(nex_session, fw, old_datasets, format_name_to_id):
    
    for format_name in old_datasets:
        
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
        if x.get('parent_dataset'):
            parent_dataset_id = dataset_to_id
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
                    print "The keyword: '" + keyword + "' is not in the database."
                    continue
                insert_dataset_keyword(nex_session, fw, dataset_id, 
                                       keyword_id, x['source_id'])
            
        ## load into dataset_reference table
        if x.get('pmids'):
            pmids = x['pmids'].strip().replace(" ", "").split("|")
            for pmid in pmids:
                reference_id = pmid_to_reference_id.get(int(pmid))
                if reference_id is None:
                    print "The PMID: ", pmid, " is not in the database."
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

    print "LAB: ", dataset_id, lab_name, lab_location

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

    print "URL:",  dataset_id, obj_url, url_type

    x = DatasetUrl(dataset_id = dataset_id,
                   source_id = source_id,
                   display_name = url_type,
                   obj_url = obj_url,
                   url_type = url_type,
                   created_by = CREATED_BY)
    nex_session.add(x)


def insert_dataset_reference(nex_session, fw, dataset_id, reference_id, source_id):

    print "REF:", dataset_id, reference_id, source_id
    
    x = DatasetReference(reference_id = reference_id,
                         dataset_id = dataset_id,
                         source_id = source_id,
                         created_by = CREATED_BY)
    nex_session.add(x)


def insert_dataset_keyword(nex_session, fw, dataset_id, keyword_id, source_id):

    print "KW:", dataset_id, keyword_id, source_id
    
    x = DatasetKeyword(keyword_id = keyword_id,
                       dataset_id = dataset_id,
                       source_id = source_id,
                       created_by = CREATED_BY)
    nex_session.add(x)


def insert_dataset_file(nex_session, fw, dataset_id, file_id, source_id):

    print "FILE:", dataset_id, file_id, source_id
    
    x = DatasetFile(file_id = file_id,
                    dataset_id = dataset_id,
                    source_id = source_id,
                    created_by = CREATED_BY)
    nex_session.add(x)

def insert_dataset(nex_session, fw, x, parent_dataset_id):

    print "DATASET:", x
    
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

