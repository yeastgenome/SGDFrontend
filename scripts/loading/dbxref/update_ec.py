import urllib.request, urllib.parse, urllib.error
import sys
import os
import gzip
from datetime import datetime
import logging
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Dbentity, LocusAlias, LocusUrl, Source, Filedbentity, Edam
from src.helpers import upload_file
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

CREATED_BY = os.environ['DEFAULT_USER'].upper()

log_file = "scripts/loading/dbxref/logs/update_ec.log"

ADDED = 0
DELETED = 0
UPDATED = 0
SOURCE = "ExPASy"
ROOT_OBJ_URL = "http://www.expasy.org/enzyme/"
ALIAS_TYPE = "EC number"

def update_data(infile):

    nex_session = get_session()

    fw = open(log_file,"w")

    uniprot_to_locus_id = dict([(x.display_name, x.locus_id) for x in nex_session.query(LocusAlias).filter_by(alias_type="UniProtKB ID").all()])
    edam_to_id = dict([(x.format_name, x.edam_id) for x in nex_session.query(Edam).all()])
    src = nex_session.query(Source).filter_by(display_name=SOURCE).one_or_none()
    source_id = src.source_id
    
    log.info(str(datetime.now()))
    log.info("Getting data from the database...")

    locus_id_to_ec_list_DB = {}
    for x in nex_session.query(LocusAlias).filter_by(alias_type=ALIAS_TYPE).all():
        ec_list = []
        if x.locus_id in locus_id_to_ec_list_DB:
            ec_list = locus_id_to_ec_list_DB[x.locus_id]
        ec_list.append(x.display_name)
        locus_id_to_ec_list_DB[x.locus_id] = ec_list

    log.info(str(datetime.now()))
    log.info("Reading data from enzyme.dat file and updating database...")

    locus_id_to_ec_list = read_enzyme_file(uniprot_to_locus_id, infile)

    for locus_id in locus_id_to_ec_list:
        if locus_id in locus_id_to_ec_list_DB:
            update_ec_list(nex_session, fw, locus_id, source_id, 
                           locus_id_to_ec_list[locus_id], 
                           locus_id_to_ec_list_DB[locus_id])
            del locus_id_to_ec_list_DB[locus_id]
        else:
            add_ec_list(nex_session, fw, locus_id, source_id, 
                        locus_id_to_ec_list[locus_id])
        
    delete_old_ec_list(nex_session, fw, locus_id_to_ec_list_DB)
    
    # nex_session.rollback()

    nex_session.commit()

    fw.close()

    log.info(str(datetime.now()))
    log.info("Done!")
    

def add_ec_list(nex_session, fw, locus_id, source_id, new_ec_list):
    
    for ec in new_ec_list:
        insert_locus_alias(nex_session, fw, locus_id, source_id, ec)
        insert_locus_url(nex_session, fw, locus_id, source_id, ec)

def insert_locus_alias(nex_session, fw, locus_id, source_id, ec):

    obj_url = ROOT_OBJ_URL + ec

    # print locus_id, source_id, ec, obj_url, ALIAS_TYPE, CREATED_BY

    x = LocusAlias(display_name = ec,
                   obj_url = obj_url,
                   source_id = source_id,
                   locus_id = locus_id,
                   has_external_id_section = "1",
                   alias_type = ALIAS_TYPE,
                   created_by = CREATED_BY)

    nex_session.add(x)

    fw.write("Insert a new " + ALIAS_TYPE + ": " + ec + " for locus_id=" + str(locus_id) + "\n")

def insert_locus_url(nex_session, fw, locus_id, source_id, ec):

    obj_url = ROOT_OBJ_URL + ec

    # print locus_id, source_id, ec, obj_url, ALIAS_TYPE, CREATED_BY                                    

    x = LocusUrl(display_name = "E.C." + ec,
                 obj_url = obj_url,
                 source_id = source_id,
                 locus_id = locus_id,
                 url_type = "External id",
                 placement = "LOCUS_LSP_RESOURCES",
                 created_by = CREATED_BY)

    nex_session.add(x)

    fw.write("Insert a new " + ALIAS_TYPE + " URL: " + ec + " for locus_id=" + str(locus_id) + "\n")

def update_ec_list(nex_session, fw, locus_id, source_id, new_ec_list, old_ec_list):

    for ec in new_ec_list:
        if ec in old_ec_list:
            old_ec_list.remove(ec)
        else:
            insert_locus_alias(nex_session, fw, locus_id, source_id, ec)
            insert_locus_url(nex_session, fw, locus_id, source_id, ec)

    for ec in old_ec_list:
        delete_ec(nex_session, fw, locus_id, ec)
        delete_ec_url(nex_session, fw, locus_id, ec)

def delete_ec(nex_session, fw, locus_id, ec):
    
    nex_session.query(LocusAlias).filter_by(display_name=ec, locus_id=locus_id, alias_type=ALIAS_TYPE).delete()
    
    fw.write("Delete " + ALIAS_TYPE + ": " + ec + " for locus_id=" + str(locus_id) + "\n")    

def delete_ec_url(nex_session, fw, locus_id, ec):

    nex_session.query(LocusUrl).filter_by(display_name="E.C."+ec, locus_id=locus_id).delete()

    fw.write("Delete " + ALIAS_TYPE + " URL: " + ec + " for locus_id=" + str(locus_id) + "\n")

def delete_old_ec_list(nex_session, fw, locus_id_to_ec_list_DB):

    for locus_id in locus_id_to_ec_list_DB:
        ec_list = locus_id_to_ec_list_DB[locus_id]
        for ec in ec_list:
            delete_ec(nex_session, fw, locus_id, ec)
            delete_ec_url(nex_session, fw, locus_id, ec)

def read_enzyme_file(uniprot_to_locus_id, infile):

    f = open(infile)

    locus_id_to_ec_list = {}
    ec = None
    for line in f:
        if line.startswith("ID "):
            ec = line.strip().replace("ID   ", "")
        elif line.startswith("DR "):
            pieces = line.strip().replace("DR   ", "").split(";  ")
            for piece in pieces:
                uniprotID = piece.split(", ")[0]
                if uniprotID not in uniprot_to_locus_id:
                    continue
                locus_id = uniprot_to_locus_id[uniprotID]
                ec_list = []
                if locus_id in locus_id_to_ec_list:
                    ec_list = locus_id_to_ec_list[locus_id]
                if ec not in ec_list:
                    ec_list.append(ec)
                locus_id_to_ec_list[locus_id] = ec_list

    f.close()

    return locus_id_to_ec_list


if __name__ == '__main__':

    url_path = "ftp://ftp.expasy.org/databases/enzyme/"
    ec_file = "enzyme.dat"
    urllib.request.urlretrieve(url_path + ec_file, ec_file)

    update_data(ec_file)

