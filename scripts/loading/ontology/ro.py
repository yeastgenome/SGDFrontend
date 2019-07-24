import urllib.request, urllib.parse, urllib.error
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Source, Ro, RoUrl
from scripts.loading.database_session import get_session
from scripts.loading.ontology import read_owl
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update RO ontology in NEX2.

# ontology_file = 'data/ro.owl'
log_file = 'scripts/loading/ontology/logs/ro.log'
ontology = 'RO'
src = 'GOC'

CREATED_BY = os.environ['DEFAULT_USER']

def load_ontology(ontology_file):

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    roid_to_ro =  dict([(x.roid, x) for x in nex_session.query(Ro).all()])

    fw = open(log_file, "w")
    
    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id[src], 
                                                 roid_to_ro, fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_id, roid_to_ro, fw):

    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0
    
    for x in data:
        ro_id = None
        if x['id'] in roid_to_ro:
            ## in database
            y = roid_to_ro[x['id']]
            ro_id = y.ro_id
            
            if y.is_obsolete is True:
                y.is_obsolete = '0'
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                fw.write("The is_obsolete for " + x['id'] + " has been updated from " + y.is_obsolete + " to " + 'False' + "\n")
            if x['term'] != y.display_name:
                ## update term
                fw.write("The display_name for " + x['id'] + " has been updated from " + y.display_name + " to " + x['term'] + "\n")
                y.display_name = x['term']
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                # print "UPDATED: ", y.roid, y.display_name, x['term']
            # else:
            #     print "SAME: ", y.roid, y.display_name
            roid_to_ro.pop(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Ro(source_id = source_id,
                        format_name = x['id'],
                        roid = x['id'],
                        display_name = x['term'],
                        obj_url = 'ro/' + x['id'],
                        is_obsolete = '0',
                        created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            ro_id = this_x.ro_id
            update_log['added'] = update_log['added'] + 1
            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_id, 'Ontobee', ro_id, 
                       'http://www.ontobee.org/ontology/RO?iri=http://purl.obolibrary.org/obo/' + link_id)
            insert_url(nex_session, source_id, 'OLS', ro_id,
                       'http://www.ebi.ac.uk/ols/ontologies/ro/properties?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id)
    
    to_delete = []
    for roid in roid_to_ro:
        x = roid_to_ro[roid]
        if roid.startswith('NTR'):
            continue
        to_delete.append((roid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.roid + " has been updated from " + x.is_obsolete + " to " + 'True' + "\n")

    nex_session.commit()

    return [update_log, to_delete]

    
def insert_url(nex_session, source_id, display_name, ro_id, url):
    x = RoUrl(display_name = display_name,
              url_type = display_name,
              source_id = source_id,
              ro_id = ro_id,
              obj_url = url,
              created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()


def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    # if len(to_delete_list) > 0:
    #    summary = summary + "The following RO terms are not in the current release:\n"
    #    for (roid, term) in to_delete_list:
    #        summary = summary + "\t" + roid + " " + term + "\n"
                                          
    fw.write(summary)
    print(summary)


if __name__ == "__main__":

    url_path = 'https://raw.githubusercontent.com/oborel/obo-relations/master/'
    owl_file = 'ro.owl'
    urllib.request.urlretrieve(url_path + owl_file, owl_file)

    load_ontology(owl_file)


    
        
