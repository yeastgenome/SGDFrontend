import sys
sys.path.insert(0, '../../../src/')
from models import Path, Filedbentity, FilePath, FileKeyword, ReferenceFile, Referencedbentity, \
                   Keyword, Source, Edam
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_file.log"
SUBCLASS = 'FILE'
STATUS = 'Active'
files_to_load = ["data/new-2017-07/inSPELL_2015_file.tsv",
                 "data/new-2017-07/inSPELL_2016_file.tsv"]

def load_data():
    
    nex_session = get_session()

    path_to_id = dict([(x.path, x.path_id) for x in nex_session.query(Path).all()])
    file_to_id = dict([(x.display_name, x.dbentity_id) for x in nex_session.query(Filedbentity).all()])
    format_name_to_id = dict([(x.format_name, x.edam_id) for x in nex_session.query(Edam).all()])
    display_name_to_id = dict([(x.display_name, x.edam_id) for x in nex_session.query(Edam).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    keyword_to_id = dict([(x.display_name, x.keyword_id) for x in nex_session.query(Keyword).all()])

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id

    fw = open(log_file, "w")
    
    path_loaded = {} 
    readme_data = []
    other_data = []

    for file in files_to_load:

        f = open(file)

        for line in f:

            if line.startswith('bun_filepath') or line.startswith('bun filepath'):
                continue
            pieces = line.strip().split("\t")
            if len(pieces) < 20:
                print("Unknown line: ", line)
                continue

            ### load path
            ## path field contains file name with full path so need to get rid of the file name 
            path = "/".join(pieces[1].strip().split('/')[0:-1])
            if not path.startswith('/'):
                path = "/" + path
            path_id = path_loaded.get(path)
            if path_id is None:
                path_id = path_to_id.get(path)
            if path is None:
                path_id = insert_path(nex_session, fw, path, source_id)
                if path_id is None:
                    print("Can't insert path=", path, " into database.")
                    continue
                path_loaded[path] = path_id 
            
            ### load readme file

            display_name = pieces[3].strip()
            if file_to_id.get(display_name):
                continue
            previous_file_name = pieces[2].strip()
            status = pieces[4].strip()
            if status == 'Archive':
                status = 'Archived'
            topic_id = format_name_to_id.get(pieces[6].replace("topic:", "EDAM:").replace("topic_", "EDAM:"))
            data_id = format_name_to_id.get(pieces[8].replace("data:", "EDAM:"))
                                             
            if ":" not in pieces[10]:
                pieces[10] = "format:" + pieces[10]
            format_id = format_name_to_id.get(pieces[10].replace("format:", "EDAM:"))
            if topic_id is None or pieces[6].startswith('NTR'):
                topic_id = display_name_to_id.get(pieces[5].strip())
            if data_id is None or pieces[8].startswith('NTR'):
                data_id = display_name_to_id.get(pieces[7].strip())
            if format_id is None or pieces[10].startswith('NTR'):
                format_id= display_name_to_id.get(pieces[9].strip())
            if topic_id is None:
                print("No TOPIC edam id provided.", line)
                continue
            if data_id is None:
                print("No DATA edam id provided.", line)
                continue
            if format_id is None:
                print("No FORMAT edam id provided.", line)
                continue
            file_extension = pieces[11].strip()
            file_date = pieces[12].strip()
            if file_date == '':
                print("No file_date provided:", line)
                continue
            if "/" in file_date:
                file_date = reformat_date(file_date)
            year = file_date.split('-')[0]
            is_public = pieces[13].strip()
            is_in_spell = pieces[14].strip()
            is_in_browser = pieces[15].strip()
            if is_in_browser != '0':
                is_in_browser = '1'
            readme_file = None
            if pieces[16]:
                readme_file = pieces[16].strip()
                if pieces[11] != 'README' and pieces[11] != 'readme':
                    print("OTHER-WITH README:", line)

            description = pieces[17].replace('"', '')
            if "|" in previous_file_name:
                previous_file_name = '' 

            data = { 'display_name': display_name,
                     'topic_id': topic_id,
                     'data_id': data_id,
                     'format_id': format_id,
                     'file_date': file_date,
                     'year': year,
                     'is_public': is_public,
                     'is_in_spell': is_in_spell,
                     'is_in_browser': is_in_browser,
                     'file_extension': file_extension,
                     'description': description,
                     'previous_file_name': previous_file_name,
                     'pmids': pieces[18].strip(),
                     'keywords': pieces[19].strip(),
                     'path_id': path_id,
                     'readme_file': readme_file }

            if pieces[11] != 'README' and pieces[11] != 'readme':
                other_data.append(data)
            else:
                readme_data.append(data)
                
        f.close()
    
    insert_files(nex_session, fw, readme_data, source_id, pmid_to_reference_id, keyword_to_id, None)

    file_to_id = dict([(x.display_name, x.dbentity_id) for x in nex_session.query(Filedbentity).all()])

    insert_files(nex_session, fw, other_data, source_id, pmid_to_reference_id, keyword_to_id, file_to_id)

    fw.close()
    

def insert_files(nex_session, fw, data, source_id, pmid_to_reference_id, keyword_to_id, file_to_id):

    for x in data:
        
        ## load data into filedbentity/dbentity here   
        dbentity_id = insert_file(nex_session, fw, x, source_id, file_to_id)
        
        ## load path_id and dbentity_id into file_path table here     
        if x.get('path_id'):
            insert_file_path(nex_session, fw, x['path_id'], dbentity_id, source_id)

        ## load data into reference_file table
        if x.get('pmids'):
            pmids = x['pmids'].strip().replace(" ", "").split("|")
            for pmid in pmids:
                reference_id = pmid_to_reference_id.get(int(pmid))
                if reference_id is None:
                    print("The PMID: ", pmid, " is not in the database.")
                    continue
                insert_file_reference(nex_session, fw, dbentity_id, reference_id, source_id)

        ## load data into file_keyword table
        if x.get('keywords'):
            keywords = x['keywords'].strip().split("|")
            for keyword in keywords:
                keyword = keyword.strip()
                keyword_id = keyword_to_id.get(keyword)
                if keyword_id is None:
                    print("The keyword: '" + keyword + "' is not in the database.")
                    continue
                insert_file_keyword(nex_session, fw, dbentity_id, keyword_id, source_id)

        nex_session.commit()

def insert_file_keyword(nex_session, fw, file_id, keyword_id, source_id):
    
    x = FileKeyword(keyword_id = keyword_id,
                    file_id = file_id,
                    source_id = source_id,
                      created_by = CREATED_BY)
    nex_session.add(x)

    fw.write("Insert file_keyword: file_id=" + str(file_id) + ", keyword_id=" + str(keyword_id) + "\n")


def insert_file_reference(nex_session, fw, file_id, reference_id, source_id):
    
    x = ReferenceFile(reference_id = reference_id,
                      file_id = file_id,
                      source_id = source_id,
                      created_by = CREATED_BY)
    nex_session.add(x)
    
    fw.write("Insert reference_file: file_id=" + str(file_id) + ", reference_id=" + str(reference_id) + "\n")


def insert_file_path(nex_session, fw, path_id, file_id, source_id):
    
    x = FilePath(file_id = file_id,
                 path_id = path_id,
                 source_id = source_id,
                 created_by = CREATED_BY)
    
    nex_session.add(x)

    fw.write("Insert file_path: file_id=" + str(file_id) + ", path_id=" + str(path_id) + "\n")


def insert_file(nex_session, fw, x, source_id, file_to_id):
    readme_file_id = None
    if file_to_id and x.get('readme_file'):
        readme_file_id = file_to_id.get(x.get('readme_file'))
    y = None
    if readme_file_id:
        y = Filedbentity(source_id = source_id,
                         subclass = SUBCLASS,
                         display_name = x['display_name'],
                         dbentity_status = STATUS,
                         topic_id = x['topic_id'],
                         data_id = x['data_id'],
                         format_id = x['format_id'],
                         file_extension = x['file_extension'],
                         file_date = x['file_date'],
                         previous_file_name = x['previous_file_name'],
                         is_public = x['is_public'],
                         is_in_spell = x['is_in_spell'],
                         is_in_browser = x['is_in_browser'],
                         description = x['description'],
                         year = x['year'],
                         readme_file_id = readme_file_id,
                         created_by = CREATED_BY)
    else:
        y = Filedbentity(source_id = source_id,
                         subclass = SUBCLASS,
                         display_name = x['display_name'],
                         dbentity_status = STATUS,
                         topic_id = x['topic_id'],
                         data_id = x['data_id'],
                         format_id = x['format_id'],
                         file_extension = x['file_extension'],
                         file_date = x['file_date'],
                         previous_file_name = x['previous_file_name'],
                         is_public = x['is_public'],
                         is_in_spell = x['is_in_spell'],
                         is_in_browser = x['is_in_browser'],
                         description = x['description'],
                         year = x['year'],
                         created_by = CREATED_BY)

    nex_session.add(y)
    nex_session.flush()
    nex_session.refresh(y)
    
    fw.write("Insert file: " + x['display_name'] + " into database\n")
 
    return y.dbentity_id


def insert_path(nex_session, fw, path, source_id):

    x = Path(source_id = source_id,
             path = path,
             description = 'TBD',
             created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.commit()
    
    fw.write("insert path for path=" + path + "\n")
    
    return x.path_id

def reformat_date(file_date):

    dates = file_date.split("/")
    month = dates[0]
    day= dates[1]
    year = dates[2]
    if len(year) == 2:
        year = "20" + year
    if len(month) == 1:
        month ="0" + month
    if len(day) == 1:
        day = "0" + day

    return year + "-" + month + "-" + day

if __name__ == "__main__":

    load_data()
    
