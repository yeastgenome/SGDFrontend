from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('utf-8')
sys.path.insert(0, '../../../src/')
from models import Source, Proteindomain, ProteindomainUrl
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
                 
__author__ = 'sweng66'

## Created on June 2017
## This script is used to update protein domains in NEX2.

domain_file = 'data/protein_domains.lst'
log_file = 'logs/protein_domain.log'

def load_domains():

    nex_session = get_session()

    fw = open(log_file, "w")
    
    read_data_and_update_database(nex_session, fw)

    nex_session.commit()

    nex_session.close()

    fw.close()


def read_data_and_update_database(nex_session, fw):
    
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    format_name_to_domain =  dict([(x.format_name, x) for x in nex_session.query(Proteindomain).all()])
    
    f = open(domain_file)

    loaded = {}
    for line in f:
        items = line.strip().split("\t")
        source_id = source_to_id.get(items[2])
        if source_id is None:
            print("SOURCE:", items[2], " is not in the database.")
            continue
        display_name = items[1]
        format_name = items[1].replace(' ', '_')
        if format_name in loaded:
            continue
            
        interpro_id = ""
        desc = ""
        if len(items) > 5:
            interpro_id = items[5]
        if len(items) > 6:
            desc = items[6]
            
        x = format_name_to_domain.get(format_name)
        if x is not None and items[2] in ['Gene3D', 'HAMAP']:
            insert_url(nex_session, fw, display_name, items[2],  x.proteindomain_id,
                       source_id)
            loaded[format_name] = 1
        
    f.close()

def insert_url(nex_session, fw, display_name, source, proteindomain_id, source_id):
    
    link = None
    if source == 'SMART':
        link = "http://smart.embl-heidelberg.de/smart/do_annotation.pl?DOMAIN=" + display_name
    elif source == 'Pfam':
        link = "http://pfam.xfam.org/family/" + display_name
    elif source == 'GENE3D' or source == 'Gene3D':
        source = 'GENE3D'
        link = "http://www.cathdb.info/version/latest/superfamily/" + display_name[6:]
    elif source == 'SUPERFAMILY':
        link = "http://supfam.org/SUPERFAMILY/cgi-bin/scop.cgi?ipid=" + display_name
    elif source == 'PANTHER':
        link = "http://www.pantherdb.org/panther/family.do?clsAccession=" + display_name
    elif source == 'TIGRFAM':
        link = "http://www.jcvi.org/cgi-bin/tigrfams/HmmReportPage.cgi?acc=" + display_name
    elif source == 'PRINTS':
        link = "http:////www.bioinf.man.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&amp;category=None&amp;queryform=false&amp;prints_accn=" + display_name
    elif source == 'ProDom':
        link = "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&amp;query=" + display_name
    elif source == 'PIRSF':
        link = "http://pir.georgetown.edu/cgi-bin/ipcSF?id=" + display_name
    elif source == 'PROSITE':
        link = "http://prosite.expasy.org/cgi-bin/prosite/nicesite.pl?" + display_name 
    elif source == 'HAMAP':
        link = "http://hamap.expasy.org/profile/" + display_name
    if link is not None:
        x = ProteindomainUrl(display_name = display_name,
                             obj_url = link,
                             source_id = source_id,
                             proteindomain_id = proteindomain_id,
                             url_type = source,
                             created_by = CREATED_BY)
        nex_session.add(x)        
        
        fw.write("Add URL: " + link + " for " + display_name + "\n")

if __name__ == "__main__":
        
    load_domains()


    
        
