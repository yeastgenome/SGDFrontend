import urllib.request, urllib.parse, urllib.error
import logging
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!                   
from src.models import Source, Obi, ObiUrl, ObiRelation, Ro
from scripts.loading.database_session import get_session
from scripts.loading.ontology import read_owl
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update OBI ontology in NEX2.

log_file = 'scripts/loading/ontology/logs/obi.log'
ontology = 'OBI'
src = 'OBI Consortium'

CREATED_BY = os.environ['DEFAULT_USER']

def load_ontology(ontology_file):

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    obiid_to_obi =  dict([(x.obiid, x) for x in nex_session.query(Obi).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    
    obi_id_to_parent = {}
    for x in nex_session.query(ObiRelation).all():
        parents = []
        if x.child_id in obi_id_to_parent:
            parents = obi_id_to_parent[x.child_id]
        parents.append(x.parent_id)
        obi_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    is_sgd_term = {}
    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 obiid_to_obi, 
                                                 term_to_ro_id['is a'],
                                                 obi_id_to_parent,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, obiid_to_obi, ro_id, obi_id_to_parent, fw):

    active_obiid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    relation_just_added = {}
    for x in data:
        obi_id = None
        if x['id'] in obiid_to_obi:
            ## in database
            y = obiid_to_obi[x['id']]
            obi_id = y.obi_id
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
                print("UPDATED: ", y.obiid, y.display_name, x['term'])
            # else:
            #    print "SAME: ", y.obiid, y.display_name, x['definition'], x['aliases'], x['parents']
            active_obiid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Obi(source_id = source_to_id[src],
                         format_name = x['id'],
                         obiid = x['id'],
                         display_name = x['term'],
                         description = x['definition'],
                         obj_url = '/obi/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            obi_id = this_x.obi_id
            update_log['added'] = update_log['added'] + 1
            print("NEW: ", x['id'], x['term'], x['definition'])

            ## add three URLs
            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_to_id['Ontobee'], 'Ontobee', obi_id, 
                       'http://www.ontobee.org/ontology/OBI?iri=http://purl.obolibrary.org/obo/'+link_id,
                       fw)
            insert_url(nex_session, source_to_id['BioPortal'], 'BioPortal', obi_id,
                       'http://bioportal.bioontology.org/ontologies/OBI/?p=classes&conceptid=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)
            insert_url(nex_session, source_to_id['OLS'], 'OLS', obi_id, 
                       'http://www.ebi.ac.uk/ols/ontologies/obi/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)

            ## add RELATIONS                                                                      
            for parent_obiid in x['parents']:
                parent = obiid_to_obi.get(parent_obiid)
                if parent is not None:
                    parent_id = parent.obi_id
                    child_id = obi_id
                    insert_relation(nex_session, source_to_id[src], parent_id, 
                                    child_id, ro_id, relation_just_added, fw)
            
        ## update RELATIONS
        # print x['id'], "RELATION", obi_id_to_parent.get(obi_id), x['parents']

        update_relations(nex_session, obi_id, obi_id_to_parent.get(obi_id), x['parents'], 
                         source_to_id[src], obiid_to_obi, ro_id, relation_just_added, fw)
                    
    
    to_delete = []
    for obiid in obiid_to_obi:
        if obiid in active_obiid:
            continue
        x = obiid_to_obi[obiid]
        if obiid.startswith('NTR'):
            continue
        to_delete.append((obiid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.obiid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, source_id, obiid_to_obi, ro_id, relation_just_added, fw):

    # print "RELATION: ", curr_parent_ids, new_parents
    # return 

    if curr_parent_ids is None:
        curr_parent_ids = []
    
    new_parent_ids = []
    for parent_obiid in new_parents:
        parent = obiid_to_obi.get(parent_obiid)
        if parent is not None:
            parent_id = parent.obi_id
            new_parent_ids.append(parent_id)
            if parent_id not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, 
                                ro_id, relation_just_added, fw)

    for parent_id in curr_parent_ids:
        if parent_id not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(ObiRelation).filter_by(child_id=child_id, parent_id=parent_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for obi_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, obi_id, url, fw):
    
    # print url
    # return

    x = ObiUrl(display_name = display_name,
               url_type = display_name,
               source_id = source_id,
               obi_id = obi_id,
               obj_url = url,
               created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for obi_id = " + str(obi_id) + "\n")
    
def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):
    
    # print "PARENT/CHILD: ", parent_id, child_id
    # return

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    x = ObiRelation(parent_id = parent_id,
                    child_id = child_id,
                    source_id = source_id,
                    ro_id = ro_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for obi_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    if len(to_delete_list) > 0:
        summary = summary + "The following OBI terms are not in the current release:\n"
        for (obiid, term) in to_delete_list:
            summary = summary + "\t" + obiid + " " + term + "\n"
                                          
    fw.write(summary)
    print(summary)


if __name__ == "__main__":
        
    url_path = 'http://purl.obolibrary.org/obo/'
    owl_file = 'obi.owl'
    urllib.request.urlretrieve(url_path + owl_file, owl_file)

    load_ontology(owl_file)


    
        
