import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Dbentity, LocusAlias, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

alias_type_src_list = [("UniProtKB ID", "UniProtKB"),
                       ("UniParc ID", "UniParc"),
                       ("DNA accession ID", "GenBank/EMBL/DDBJ"),
                       ("Protein version ID", "GenBank/EMBL/DDBJ"),
                       ("TPA protein version ID", "NCBI"),
                       ("RefSeq protein version ID", "NCBI"),
                       ("RefSeq nucleotide version ID", "NCBI"),
                       ("Gene ID", "BioGRID"),
                       ("Gene ID", "DIP"),
                       ("Gene ID", "NCBI")]

# "PDB":             ("PDB ID", "PDB"),

ID_type_mapping = {"UniParc":         ("UniParc ID", "UniParc"),
                   "EMBL":            ("DNA accession ID", "GenBank/EMBL/DDBJ"),
                   "EMBL-CDS":        ("Protein version ID", "GenBank/EMBL/DDBJ"),
                   "EMBL-CDS-TPA":    ("TPA protein version ID", "NCBI"),
                   "RefSeq":          ("RefSeq protein version ID", "NCBI"),
                   "RefSeq_NT":       ("RefSeq nucleotide version ID", "NCBI"),
                   "BioGrid":         ("Gene ID", "BioGRID"),
                   "DIP":             ("Gene ID", "DIP"),
                   "GeneID":          ("Gene ID", "NCBI") }

log_file = "logs/update_dbxref.log"
infile = "data/YEAST_559292_idmapping.dat"

def update_data():

    nex_session = get_session()

    fw = open(log_file,"w")

    id_to_source = {}
    source_to_id = {}

    for x in nex_session.query(Source).all():
        id_to_source[x.source_id] = x.display_name
        source_to_id[x.display_name] = x.source_id

    locus_id_to_sgdid = {}
    sgdid_to_locus_id = {}
    
    for x in nex_session.query(Dbentity).filter_by(subclass="LOCUS").all():
        locus_id_to_sgdid[x.dbentity_id] = x.sgdid
        sgdid_to_locus_id[x.sgdid] = x.dbentity_id
    
    [sgdid_to_uniprot_id, uniprot_id_to_sgdid, key_to_ids] = read_uniprot_file(source_to_id)

    all_aliases = nex_session.query(LocusAlias).all()

    nex_session.close()
    nex_session = get_session()

    key_to_ids_DB = {}
    
    for x in all_aliases:

        this_key = (x.alias_type, id_to_source[x.source_id])
        if this_key not in alias_type_src_list:
            continue

        sgdid = locus_id_to_sgdid[x.locus_id]
        uniprot_id = sgdid_to_uniprot_id.get(sgdid)
        if uniprot_id is None:
            continue

        if x.alias_type == "UniProtKB ID":
            if x.display_name != uniprot_id:
                # print "NEW:", uniprot_id
                # print "OLD:", x.display_name
                update_uniprot_id(nex_session, fw, x.locus_id, 
                                  x.alias_type, uniprot_id)
            continue

        key = (uniprot_id, x.alias_type, x.source_id)
        id_list = []
        if key in key_to_ids_DB:
            id_list = key_to_ids_DB[key]
        id_list.append(x.display_name)
        key_to_ids_DB[key] = id_list

    for key in key_to_ids:
        if key in key_to_ids_DB:
            update_aliases(nex_session, fw, key, key_to_ids[key], 
                           key_to_ids_DB[key], uniprot_id_to_sgdid, 
                           sgdid_to_locus_id, id_to_source)
            del key_to_ids_DB[key]
        else:
            insert_aliases(nex_session, fw, key, key_to_ids[key],
                           uniprot_id_to_sgdid, sgdid_to_locus_id, id_to_source)

    ## delete the ones that are not in the current uniprot file
    for key in key_to_ids_DB:
        delete_aliases(nex_session, fw, key, uniprot_id_to_sgdid, sgdid_to_locus_id)
    
    # nex_session.rollback()
    nex_session.commit()

def get_locus_id(uniprot_id, uniprot_id_to_sgdid, sgdid_to_locus_id):

    sgdid = uniprot_id_to_sgdid.get(uniprot_id)

    if sgdid is None:
        print "The uniprot ID: ", uniprot_id, " is not mapped to a sgdid."
        return None

    locus_id = sgdid_to_locus_id.get(sgdid)
    if locus_id is None:
        print "The SGDID: ", sgdid, " is not in the database."
        return None

    return locus_id

def delete_aliases(nex_session, fw, key, uniprot_id_to_sgdid, sgdid_to_locus_id):

    print "Delete aliases for key: ", key

    (uniprot_id, alias_type, source_id) = key

    locus_id = get_locus_id(uniprot_id, uniprot_id_to_sgdid, sgdid_to_locus_id)
    if locus_id is None:
        return

    nex_session.query(LocusAlias).filter_by(locus_id=locus_id, alias_type=alias_type, source_id=source_id).delete()
    
def insert_aliases(nex_session, fw, key, ids, uniprot_id_to_sgdid, sgdid_to_locus_id, id_to_source):
    
    (uniprot_id, alias_type, source_id) = key

    locus_id = get_locus_id(uniprot_id, uniprot_id_to_sgdid, sgdid_to_locus_id)
    if locus_id is None:
        return

    for ID in ids:
        insert_alias(nex_session, fw, locus_id, alias_type, id_to_source[source_id], source_id, ID)


def update_aliases(nex_session, fw, key, ids, ids_DB, uniprot_id_to_sgdid, sgdid_to_locus_id, id_to_source):

    if set(ids_DB) == set(ids):
        return

    (uniprot_id, alias_type, source_id) = key

    locus_id = get_locus_id(uniprot_id, uniprot_id_to_sgdid, sgdid_to_locus_id)
    if locus_id is None:
        return
    for ID in ids:
        if ID in ids_DB:
            ids_DB.remove(ID)
            continue
        insert_alias(nex_session, fw, locus_id, alias_type, 
                     id_to_source[source_id], source_id, ID)
        
    for ID in ids_DB:
        delete_alias(nex_session, fw, locus_id, alias_type, ID)

def delete_alias(nex_session, fw, locus_id, alias_type, ID):
    
    print "DELETE ",   locus_id, alias_type, ID

    nex_session.query(LocusAlias).filter_by(locus_id=locus_id, alias_type=alias_type, display_name=ID).delete()
    
    fw.write("Delete "+alias_type+" "+ID+"\n")
    
def insert_alias(nex_session, fw, locus_id, alias_type, source, source_id, ID):
    
    print "INSERT ", locus_id, alias_type, source, ID

    obj_url = get_url(alias_type, ID, source)

    x = LocusAlias(display_name = ID,
                   obj_url = obj_url,
                   source_id = source_id,
                   locus_id = locus_id,
                   has_external_id_section = "1",
                   alias_type = alias_type,
                   created_by = CREATED_BY)
    nex_session.add(x)

    fw.write("Insert a new "+alias_type+": "+ID+"\n")
    
def update_uniprot_id(nex_session, fw, locus_id, alias_type, ID):

    print locus_id, alias_type, ID
        
    nex_session.query(LocusAlias).filter_by(locus_id=locus_id, alias_type=alias_type).update({"display_name": ID, "obj_url": "http://www.uniprot.org/uniprot/"+ID})
        
    fw.write("Update "+alias_type+" to "+ID+" for locus_id="+str(locus_id)+"\n")

def get_url(alias_type, ID, source):
    
    if source == "DIP" and alias_type == "Gene ID":
        return "http://dip.doe-mbi.ucla.edu/dip/Browse.cgi?PK="+ID+"&D=1"
    if source == "NCBI" and alias_type == "Gene ID":
        return "http://www.ncbi.nlm.nih.gov/gene/"+ID
    if source == "BioGRID" and alias_type == "Gene ID":
        return "https://thebiogrid.org/"+ID+"/summary/saccharomyces-cerevisiae"
    # if source == "PDB" and alias_type == "PDB ID":
    #    return "http://www.rcsb.org/pdb/explore/explore.do?structureId="+ID
    if source == "NCBI" and alias_type == "RefSeq protein version ID":
        return "https://www.ncbi.nlm.nih.gov/protein/"+ID
    if source == "NCBI" and alias_type == "RefSeq nucleotide version ID":
        return "https://www.ncbi.nlm.nih.gov/nuccore/" + ID
    if source == "NCBI" and alias_type == "TPA protein version ID":
        return "https://www.ncbi.nlm.nih.gov/protein/" + ID
    if source == "GenBank/EMBL/DDBJ" and alias_type == "Protein version ID":
        return "https://www.ncbi.nlm.nih.gov/protein/" + ID
    if source == "GenBank/EMBL/DDBJ" and alias_type == "DNA accession ID":
        return "https://www.ncbi.nlm.nih.gov/nuccore/" + ID
    if source == "UniParc" and alias_type == "UniParc ID":
        return "http://www.uniprot.org/uniparc/"+ID
    
    print "Unknown source & alias_type:", source, alias_type    
    return ""


def read_uniprot_file(source_to_id):

    f = open(infile)    
    sgdid_to_uniprot_id = {}
    uniprot_id_to_sgdid = {}
    key_to_ids = {}
    for line in f:
        pieces = line.strip().split("\t")
        uniprot_id = pieces[0].strip()
        type = pieces[1].strip()
        ID = pieces[2].strip()
        if ID == '-' or ID == '_' or ID == None:
            continue
        if type.startswith('EMBL') and ID.startswith('BK'):
            continue
        if "-" in uniprot_id and len(uniprot_id) > 6:
            uniprot_id = uniprot_id[0:6]
        if type == "SGD":
            sgdid_to_uniprot_id[ID] = uniprot_id
            uniprot_id_to_sgdid[uniprot_id] = ID
            # print uniprot_id, ID
        if type == 'DIP':
            ## example ID = "DIP-310N"
            ID = ID.replace("DIP-", "").replace("N", "")
        if type == "EMBL-CDS" and ID.startswith("DAA"):
            type = "EMBL-CDS-TPA"
        if type in ID_type_mapping:
            (db_type, src) = ID_type_mapping[type]
            key = (uniprot_id, db_type, source_to_id.get(src)) 
            id_list = []
            if key in key_to_ids:
                id_list = key_to_ids[key] 
            if ID not in id_list:
                id_list.append(ID)
            key_to_ids[key] = id_list        
    f.close()

    return [sgdid_to_uniprot_id, uniprot_id_to_sgdid, key_to_ids] 


if __name__ == '__main__':

    update_data()




