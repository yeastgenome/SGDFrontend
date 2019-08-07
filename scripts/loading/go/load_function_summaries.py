from scripts.loading.go.gpad_config import curator_id
import sys
from src.models import Dbentity, Locussummary,  Source, Updatelog
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

gpi_file = "scripts/loading/go/data/gp_information.559292_sgd"
log_file = "scripts/loading/go/logs/function_summary.log"
summary_type = 'Function'

def load_summaries(summary_file):
    
    nex_session = get_session()

    sgdid_to_locus_id = dict([(x.sgdid, x.dbentity_id) for x in nex_session.query(Dbentity).filter_by(subclass='LOCUS').all()])    
    locus_id_to_summary = dict([(x.locus_id, x) for x in nex_session.query(Locussummary).filter_by(summary_type=summary_type).all()])

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id

    uniprot_to_sgdid_list = read_gpi_file()

    f = open(summary_file)
    fw = open(log_file, "w")
    
    for line in f:

        pieces = line.strip().split("\t")
        if pieces[0] == 'Group':
            continue
        
        if len(pieces) < 8:
            print("BAD LINE:", line)
            continue
        
        curatorName = pieces[1].strip().replace(" [Expired account]", "")
        curator = curator_id.get(curatorName)
        if curator is None:
            print("The curator name:", pieces[1], " is not in the mapping file.")
            continue

        date_created = pieces[6].strip()
        summary_text = pieces[7].strip()

        sgdid_list = uniprot_to_sgdid_list.get(pieces[3].strip())
        if sgdid_list is None:
            print("The uniprot ID:", pieces[3], " is not found in the GPI file.")
            continue

    
        for sgdid in sgdid_list:
            locus_id = sgdid_to_locus_id.get(sgdid)
            if locus_id is None:
                print("The sgdid:", sgdid, " is not in the database.")
                continue

            x = locus_id_to_summary.get(locus_id)
            if x is None:
                insert_locussummary(nex_session, fw, locus_id, summary_text, 
                                    source_id, curator, date_created)
            else:
                update_summary(nex_session, fw, locus_id, summary_text, source_id, 
                               curator, date_created, x)
            
    f.close()
    fw.close()
    
def update_summary(nex_session, fw, locus_id, summary, source_id, created_by, date_created, x):

    print("UPDATE SUMMARY: ", locus_id, summary, source_id, created_by, date_created)

    date_created_db = str(x.date_created).split(' ')[0]

    if x.text == summary and x.html == summary:
        return
     
    old_text_value = x.text
    old_html_value = x.html

    if x.text != summary: 
        x.text = summary  
    if x.html != summary:
        x.html = summary
    nex_session.add(x)
    nex_session.commit()

    fw.write("update summary for locus_id=" + str(locus_id) + " to: " + summary + "\n")

    tab_name = "LOCUSSUMMARY"

    update_log(nex_session, fw, x.summary_id, tab_name, "TEXT",
               old_text_value, summary, created_by)

    update_log(nex_session, fw, x.summary_id, tab_name, "HTML",
               old_html_value, summary, created_by)


def update_log(nex_session, fw, primary_key, tab_name, col_name, old_value, new_value, created_by):

    print("UPDATE UPDATELOG:", primary_key, tab_name, col_name, old_value, new_value, created_by)

    nex_session.query(Updatelog).filter_by(tab_name=tab_name, primary_key=primary_key, col_name=col_name, old_value=old_value, new_value=new_value).update({"created_by": created_by})

    nex_session.commit()

def insert_locussummary(nex_session, fw, locus_id, summary, source_id, created_by, date_created):

    x = Locussummary(locus_id = locus_id,
                     summary_type = summary_type,
                     text = summary,
                     html = summary, 
                     source_id = source_id, 
                     date_created = date_created,
                     created_by = created_by)
    nex_session.add(x)
    nex_session.commit()

    fw.write("insert summary for locus_id=" + str(locus_id) + ": TEXT=" + summary + "\n")
    

def read_gpi_file():

    f = open(gpi_file)

    uniprot_to_sgdid_list = {}

    for line in f:
        field = line.split("\t")
        if len(field) < 10:
            continue
        uniprotID = field[1]
        sgdidlist = field[8].replace('SGD:', '')
        sgdid_list = [] if uniprot_to_sgdid_list.get(uniprotID) is None else uniprot_to_sgdid_list.get(uniprotID)
        for sgdid in sgdidlist.split('|'):
            if sgdid not in sgdid_list:
                sgdid_list.append(sgdid)
        uniprot_to_sgdid_list[uniprotID] = sgdid_list

    f.close()

    return uniprot_to_sgdid_list


if __name__ == "__main__":
        
    summary_file = ""
    if len(sys.argv) >= 2:
        summary_file = sys.argv[1]
    else:
        print("Usage: load_function_summaries.py summary_file_name_with_path")
        print("Example: scripts/loading/go/load_function_summaries.py scripts/loading/go/data/protein2go_report031518.tsv")
        exit()

    load_summaries(summary_file)
    
