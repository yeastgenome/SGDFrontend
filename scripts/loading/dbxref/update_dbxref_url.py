import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import LocusAlias, Source
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

log_file = "logs/update_dbxref_url.log"

def update_data():

    nex_session = get_session()

    fw = open(log_file,"w")

    source_id_to_source = dict([(x.source_id, x.display_name) for x in nex_session.query(Source).all()])

    all_aliases = nex_session.query(LocusAlias).all()

    nex_session.close()
    nex_session = get_session()

    i = 0
    for x in all_aliases:
        if x.obj_url:
            # print "OLD:", x.obj_url
            continue
        else:
            obj_url = get_url(x.alias_type, x.display_name, source_id_to_source[x.source_id])
            if obj_url != "":
                print("OLD:", x.obj_url, "NEW:", obj_url) 
                nex_session.query(LocusAlias).filter_by(locus_id=x.locus_id, alias_type=x.alias_type, display_name=x.display_name, source_id=x.source_id).update({"obj_url": obj_url})
                i = i + 1
                if i > 500:
                    nex_session.commit()
                    i = 0

    nex_session.commit()
    nex_session.close() 

def get_url(alias_type, ID, source):
    
    if source == "DIP" and alias_type == "Gene ID":
        return "http://dip.doe-mbi.ucla.edu/dip/Browse.cgi?PK="+ID+"&D=1"
    if source == "NCBI" and alias_type == "Gene ID":
        return "http://www.ncbi.nlm.nih.gov/gene/"+ID
    if source == "BioGRID" and alias_type == "Gene ID":
        return "https://thebiogrid.org/"+ID+"/summary/saccharomyces-cerevisiae"
    if source == "NCBI" and alias_type == "RefSeq protein version ID":
        return "https://www.ncbi.nlm.nih.gov/protein/"+ID
    if source == "NCBI" and alias_type in ["RefSeq nucleotide version ID", "TPA accession ID", "RefSeq accession ID"]:
        return "https://www.ncbi.nlm.nih.gov/nuccore/" + ID
    if source == "NCBI" and alias_type == "TPA protein version ID":
        return "https://www.ncbi.nlm.nih.gov/protein/" + ID
    if source == "GenBank/EMBL/DDBJ" and alias_type == "Protein version ID":
        return "https://www.ncbi.nlm.nih.gov/protein/" + ID
    if source == "GenBank/EMBL/DDBJ" and alias_type == "DNA accession ID":
        return "https://www.ncbi.nlm.nih.gov/nuccore/" + ID
    if source == "UniProt" and alias_type == "UniParc ID":
        return "http://www.uniprot.org/uniparc/" + ID
    if source == "GenBank/EMBL/DDBJ" and alias_type == "DNA version ID":
        return "https://www.ncbi.nlm.nih.gov/nuccore/" + ID
    if source == "GenBank/EMBL/DDBJ" and alias_type == "Protein GI":
        return "https://www.ncbi.nlm.nih.gov/protein/" + ID
    # if source == "" and alias_type == "":
    if source == "PDB" and alias_type == "PDB ID Chain":
        # if "." in ID:
        #    ID = ID[:-2]
        # return "https://www.rcsb.org/pdb/explore/explore.do?structureId=" + ID
        return ""
    if source == "IUBMB" and alias_type == "EC number":
        return "http://www.expasy.org/enzyme/" + ID
    if alias_type == "UniProtKB ID":
        return "http://www.uniprot.org/uniprot/" + ID
    if source == "LoQAte" and alias_type == "LoQAtE ID": 
        return "http://www.weizmann.ac.il/molgen/loqate/gene/view/" + ID
    if source == "AspGD" and alias_type == "Gene ID":
        return "http://www.aspgd.org/cgi-bin/locus.pl?locus=" + ID

    if source != "SGD":
        print("Unknown source & alias_type:", source, alias_type)    
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
            id_list.append(ID)
            key_to_ids[key] = id_list        
    f.close()

    return [sgdid_to_uniprot_id, uniprot_id_to_sgdid, key_to_ids] 


if __name__ == '__main__':

    update_data()




