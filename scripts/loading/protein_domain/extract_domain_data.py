from datetime import datetime
import sys

__author__ = 'sweng66'

uniprot_file = "data/YEAST_559292_idmapping.dat"
match_file = "data/match_complete_yeast.xml"
out_file = "data/protein_domains_yeast.lst"
log_file = "logs/extract_domains_yeast.log"

def extract_domains():
 
    f = open(uniprot_file)
    
    proteinid_to_sgdid = {}
    for line in f:
        if "SGD" not in line:
            continue
        items = line.strip().split("\t")
        proteinid_to_sgdid[items[0]] = items[2]
        # print items[0], items[2]

    f.close()
    
    f = open(match_file)
    fw = open(out_file, "w")
    
    dbname_to_source = get_source_mapping()

    sgdid = None
    match = {}
    for line in f:
        line = line.strip()
        # <protein id="A0A023PXN9" name="YI171_YEAST" length="150" crc64="758F5E7B8903AEF7"></protein>        
        if "<protein id=" in line:
            sgdid = None
            items = line.split(" ")
            protein_id = items[1].replace('id="', '').replace('"', '')
            if protein_id in proteinid_to_sgdid:
                sgdid = proteinid_to_sgdid[protein_id]
        elif sgdid is not None:
            if "<match id=" in line and 'status="T"' in line:
                items = line.strip().split('" ')
                for item in items:
                    if '=' in item:
                        pair = item.split('=')
                        key = pair[0].replace("<match id", "id")
                        match[key] = pair[1].replace('"', '')
                continue
            if "ipr id=" in line:
                items = line.strip().split('" ')
                for item in items:
                    if '=' in item:
                        pair = item.split('=')
                        key = pair[0].replace("<ipr id", "id")
                        match["ipr_"+key] = pair[1].replace('"', '')
                continue
            if "<lcn start=" in line:
                items = line.strip().split(' ')
                for item in items:
                    if '=' in item:
                        pair = item.split('=')
                        match[pair[0]] = pair[1].replace('"', '')
                continue
            if "</match>" in line:
                dbname = match.get('dbname')
                if dbname is None:
                    print("No dbname for line:", line)
                    match = {}
                    continue
                source = dbname_to_source.get(dbname)
                if source is None:
                    print("Unknown source:", dbname)
                    match = {}
                    continue
                id = match.get('id')
                if id is None:
                    print("No ID for line:", line)
                    match = {}
                    continue
                start = match.get('start')
                end = match.get('end')
                if start is None or end is None:
                    print("No start or end_index for line:", line)
                    match = {}
                    continue

                desc = ''
                name = match.get('name')
                ipr_name = match.get('ipr_name')
                if (name and name == id) or name is None:
                    name = ""
                if (ipr_name and ipr_name == ipr_id) or ipr_name is None:
                    ipr_name = ""
                    
                if name.lower() == ipr_name.lower():
                    name = ipr_name
                    ipr_name = ''

                if name != '' and ipr_name != '':
                    desc = name + "; " + ipr_name
                elif name != '':
                    desc = name
                elif ipr_name != '':
                    desc = ipr_name
                
                ipr_id = match.get('ipr_id')
                if ipr_id is None:
                    ipr_id = ''
                fw.write(sgdid + "\t" + id + "\t" + source + "\t" + start + "\t" + end + "\t" + ipr_id + "\t" + desc + "\n")
                match = {}

    f.close()

def get_source_mapping():

    return { "GENE3D": "Gene3D",
             "HAMAP": "HAMAP",
             "PANTHER": "PANTHER",
             "PFAM": "Pfam",
             "PIRSF": "PIRSF",
             "PRINTS": "PRINTS",
             "PRODOM": "ProDom",
             "PROSITE": "PROSITE",
             "PROFILE": "PROSITE",
             "SMART": "SMART",
             "TIGRFAMs": "TIGRFAM",
             "SSF": "SUPERFAMILY" }


if __name__ == '__main__':
    
    extract_domains()



