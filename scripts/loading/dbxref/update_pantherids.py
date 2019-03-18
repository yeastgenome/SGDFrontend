import logging
from datetime import datetime
from scripts.loading.database_session import get_session
from src.models import Dbentity, LocusAlias, Source, Filedbentity, Edam
# pantherGeneFile = 'scripts/loading/dbxref/data/pantherGeneList021119.txt'
pantherGeneFile = 'data/pantherGeneList021119.txt'


__author__ = 'sagarjhas'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)
# log_file = "scripts/loading/dbxref/logs/update_pantherids.log"
log_file = "logs/update_pantherids.log"

alias_type_src_list = [("PANTHER ID", "PANTHER")]

##read the file
def read_panther_gene_list_file():
    sgdid_to_panther_id = {}
    panther_id_to_sgdid = {}
    with open(pantherGeneFile,'r') as file:
        lines = file.readlines()
        for line in lines:
            words = line.split()
            
            sgdid = words[1]
            pantherid = words[-1]
            sgdid_to_panther_id[sgdid] = pantherid
            panther_id_to_sgdid[pantherid]= sgdid

            ##Considering the scenario of multiple values
            # pantherid_list = []
            # if sgdid in sgdid_to_panther_id:
            #     pantherid_list = sgdid_to_panther_id[sgdid]
            # if pantherid not in pantherid_list:
            #     pantherid_list.append(pantherid)
            # sgdid_to_panther_id[sgdid] = pantherid_list
    
    return [sgdid_to_panther_id,panther_id_to_sgdid]

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
    
    #Get all the aliases data
    all_aliases = nex_session.query(LocusAlias).all()
    
    nex_session.close()
    nex_session = get_session()


    sgdid_to_panther_id,panther_id_to_sgdid = read_panther_gene_list_file()

    #check if any records needs to be updated
        #remove the updated one
    
    #check if any records needs to be inserted
        #remove the inserted one
    
    #remove the rest of the records left.
    
    
    log.info("Updating the data in the database...")

    for x in all_aliases:
        this_key = (x.alias_type, id_to_source[x.source_id])
        if this_key not in alias_type_src_list:
            continue
        


##init
if __name__ == '__main__':
    update_data()

