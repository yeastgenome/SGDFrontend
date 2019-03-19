import logging
from datetime import datetime
from scripts.loading.database_session import get_session
from src.models import Dbentity, LocusAlias, Source, Filedbentity, Edam
pantherGeneFile = 'scripts/loading/dbxref/data/pantherGeneList021119.txt'
# pantherGeneFile = 'data/pantherGeneList021119.txt'


__author__ = 'sagarjhas'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)
log_file = "scripts/loading/dbxref/logs/update_pantherids.log"
# log_file = "logs/update_pantherids.log"
alias_type_src_list = [("PANTHER ID", "PANTHER")]

ALIAS_TYPE = 'PANTHER ID'
OBJ_URL = 'http://www.pantherdb.org/panther/family.do?clsAccession='
DISPLAY_NAME = 'PANTHER'
# CREATED_BY = os.environ['DEFAULT_USER']

ADDED = 0
DELETED = 0
UPDATED = 0

##read the file
def read_panther_gene_list_file(source_to_id):
    sgdid_to_panther_id = {}
    panther_id_to_sgdid = {}
    key_to_ids = {}
    with open(pantherGeneFile,'r') as file:
        lines = file.readlines()
        for line in lines:
            words = line.split()
            
            sgdid = words[1]
            pantherid = words[-1]
            if(pantherid.startswith('(PTHR')):
                
                pantherid = pantherid[1:-1]
                sgdid_to_panther_id[sgdid] = pantherid
                panther_id_to_sgdid[pantherid]= sgdid
                ##Considering the scenario of multiple values
                key = (pantherid,"PANTHER ID",source_to_id.get("PANTHER"))
                pantherid_list = []
                if key in key_to_ids:
                    pantherid_list = key_to_ids[key]
                if pantherid not in pantherid_list:
                    pantherid_list.append(pantherid)
                key_to_ids[key] = pantherid_list
                # if sgdid in sgdid_to_panther_id:
                #     pantherid_list = sgdid_to_panther_id[sgdid]
                # if pantherid not in pantherid_list:
                #     pantherid_list.append(pantherid)
                # sgdid_to_panther_id[sgdid] = pantherid_list
    
    return [sgdid_to_panther_id,panther_id_to_sgdid,key_to_ids]

##read the database.
def update_data():
    nex_session = get_session()
    fw = open(log_file,"w")

    id_to_source = {}
    source_to_id = {}

    log.info(str(datetime.now()))
    log.info("Getting data from the database...")

    #Get data from source table.
    for x in nex_session.query(Source).all():
        id_to_source[x.source_id] = x.display_name
        source_to_id[x.display_name] = x.source_id
    
    locus_id_to_sgdid = {}
    sgdid_to_locus_id = {}

    #Get data from Dbentity table for subclass LOCUS
    for x in nex_session.query(Dbentity).filter_by(subclass="LOCUS").all():
        locus_id_to_sgdid[x.dbentity_id] = x.sgdid
        sgdid_to_locus_id[x.sgdid] = x.dbentity_id
    
    log.info("Reading data from panther gene list file...")

    [sgdid_to_panther_id,panther_id_to_sgdid,key_to_ids] = read_panther_gene_list_file(source_to_id)

    #Get all the aliases data
    all_aliases = nex_session.query(LocusAlias).all()
    
    nex_session.close()
    # nex_session = get_session()

    key_to_ids_DB = {}
    
    log.info("Updating the data in the database...")

    for x in all_aliases:
        #Since it is all the LocusAlias we only want the one with PANTHER
        #If not then move to next.
        this_key = (x.alias_type, id_to_source[x.source_id])
        if this_key not in alias_type_src_list:
            continue
        
        #find the panther id from the new file.
        #using the sgdId of the current locus_alias
        sgdid = locus_id_to_sgdid[x.locus_id]
        panther_id = sgdid_to_panther_id.get(sgdid)
        if panther_id is None:
            continue

        key = (panther_id,x.alias_type,x.source_id)   #(panther_id,"PANTHER ID",807) db record
        panther_id_list_DB = []
        if key in key_to_ids_DB:
            panther_id_list_DB = key_to_ids_DB[key]
        panther_id_list_DB.append(x.display_name)       #database values
        key_to_ids_DB[key] = panther_id_list_DB
        
    # Now check for every key in key_to_ids    
    for key in key_to_ids:
        if key in key_to_ids_DB:
            #Update the record
            #then del the key from key_to_ids_DB
            print("Update   ",key)
            del key_to_ids_DB[key]
        else:
            #This is a new record which is not in db so insert
            #find the source_id and locus_id
            (panther_id,alias_type,source_id) = key
            locus_id = get_locus_id(panther_id,panther_id_to_sgdid,sgdid_to_locus_id)
            insert_alias(nex_session,fw,locus_id,source_id,panther_id)
            # print("Insert   ",key)
    
    for key in key_to_ids_DB:
        #records left in db whihc are not found in file.
        #Remove them all
        print("Delete records from DB... ",key)
    
    #Commit your session
    #Upload file to s3 
    #Log informations for completion

def get_locus_id(panther_id,panther_id_to_sgdid,sgdid_to_locus_id):
    sgdid = panther_id_to_sgdid.get(panther_id)

    if sgdid is None:
        return None
    
    locus_id = sgdid_to_locus_id.get(sgdid)
    if locus_id is None:
        log.info("The SGDID: " + sgdid + " is not in the database.")
        return None

    return locus_id

def insert_alias(nex_session,fw,locus_id,source_id,panther_id):
    
    obj_url = OBJ_URL + panther_id
    print(DISPLAY_NAME,obj_url,source_id,locus_id,"1",ALIAS_TYPE,"OTTO")
    # x = LocusAlias(
    #     display_name=DISPLAY_NAME,
    #     obj_url=obj_url,
    #     source_id=source_id,
    #     locus_id=locus_id,
    #     has_external_id_section="1",
    #     alias_type=ALIAS_TYPE,
    #     created_by = CREATED_BY
    # )

##init
if __name__ == '__main__':
    update_data()

