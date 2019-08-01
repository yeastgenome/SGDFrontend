import urllib.request, urllib.parse, urllib.error
from datetime import datetime
import sys
import os
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Source, Edam, EdamUrl, EdamAlia, EdamRelation, Ro
from scripts.loading.database_session import get_session
from scripts.loading.ontology import read_owl  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update EDAM ontology in NEX2.

log_file = 'scripts/loading/ontology/logs/edam.log'
ontology = 'EDAM'
src = 'EDAM'
CREATED_BY = os.environ['DEFAULT_USER']

def load_ontology(ontology_file):

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    edamid_to_edam =  dict([(x.edamid, x) for x in nex_session.query(Edam).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    
    edam_id_to_alias = {}
    for x in nex_session.query(EdamAlia).all():
        aliases = []
        if x.edam_id in edam_id_to_alias:
            aliases = edam_id_to_alias[x.edam_id]
        aliases.append((x.display_name, x.alias_type))
        edam_id_to_alias[x.edam_id] = aliases

    edam_id_to_parent = {}
    for x in nex_session.query(EdamRelation).all():
        parents = []
        if x.child_id in edam_id_to_parent:
            parents = edam_id_to_parent[x.child_id]
        parents.append(x.parent_id)
        edam_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    is_sgd_term = {}
    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 edamid_to_edam, 
                                                 term_to_ro_id['is a'],
                                                 edam_id_to_alias,
                                                 edam_id_to_parent,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, edamid_to_edam, ro_id, edam_id_to_alias, edam_id_to_parent, fw):

    active_edamid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    relation_just_added = {}
    alias_just_added = {}
    for x in data:
        edam_id = None
        if "EDAM:" not in x['id']:
            continue
        if x['id'] in edamid_to_edam:
            ## in database
            y = edamid_to_edam[x['id']]
            edam_id = y.edam_id
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
                print("UPDATED: ", y.edamid, y.display_name, x['term'])
            # else:
            #    print "SAME: ", y.edamid, y.display_name, x['definition'], x['aliases'], x['parents']
            active_edamid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Edam(source_id = source_to_id[src],
                         format_name = x['id'],
                         edamid = x['id'],
                         display_name = x['term'],
                         edam_namespace = x['namespace'],
                         description = x['definition'],
                         obj_url = '/edam/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            edam_id = this_x.edam_id
            update_log['added'] = update_log['added'] + 1
            # print "NEW: ", x['id'], x['term'], x['definition']

            ## add three URLs
            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_to_id['Ontobee'], 'Ontobee', edam_id, 
                       'http://www.ontobee.org/ontology/EDAM?iri=http://purl.obolibrary.org/obo/'+link_id,
                       fw)
            insert_url(nex_session, source_to_id['BioPortal'], 'BioPortal', edam_id,
                       'http://bioportal.bioontology.org/ontologies/EDAM/?p=classes&conceptid=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)
            insert_url(nex_session, source_to_id['OLS'], 'OLS', edam_id, 
                       'http://www.ebi.ac.uk/ols/ontologies/edam/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)

            ## add RELATIONS                                                                      
            for parent_edamid in x['parents']:
                parent = edamid_to_edam.get(parent_edamid)
                if parent is not None:
                    parent_id = parent.edam_id
                    child_id = edam_id
                    insert_relation(nex_session, source_to_id[src], parent_id, 
                                    child_id, ro_id, relation_just_added, fw)
            
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, 
                             alias_type, edam_id, alias_just_added, fw)

        ## update RELATIONS
        # print x['id'], "RELATION", edam_id_to_parent.get(edam_id), x['parents']

        update_relations(nex_session, edam_id, edam_id_to_parent.get(edam_id), x['parents'], 
                         source_to_id[src], edamid_to_edam, ro_id, relation_just_added, fw)
                    
        ## update ALIASES
        # print x['id'], "ALIAS", edam_id_to_alias.get(edam_id), x['aliases']

        update_aliases(nex_session, edam_id, edam_id_to_alias.get(edam_id), x['aliases'],
                       source_to_id[src], edamid_to_edam, alias_just_added, fw)
    
    to_delete = []
    for edamid in edamid_to_edam:
        if edamid in active_edamid:
            continue
        x = edamid_to_edam[edamid]
        if edamid.startswith('NTR'):
            continue
        to_delete.append((edamid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            # nex_session.add(x)
            # nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.edamid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]


def update_aliases(nex_session, edam_id, curr_aliases, new_aliases, source_id, edamid_to_edam, alias_just_added, fw):

    # print "ALIAS: ", curr_aliases, new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    for (alias, type) in new_aliases:
        if (alias, type) not in curr_aliases:
            insert_alias(nex_session, source_id, alias, type, edam_id, alias_just_added, fw)

    for (alias, type) in curr_aliases:
        if(alias, type) not in new_aliases:
            ## remove the old one                                                             
            to_delete = nex_session.query(EdamAlia).filter_by(edam_id=edam_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for edam_id = " + str(edam_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, source_id, edamid_to_edam, ro_id, relation_just_added, fw):

    # print "RELATION: ", curr_parent_ids, new_parents
    # return 

    if curr_parent_ids is None:
        curr_parent_ids = []
    
    new_parent_ids = []
    for parent_edamid in new_parents:
        parent = edamid_to_edam.get(parent_edamid)
        if parent is not None:
            parent_id = parent.edam_id
            new_parent_ids.append(parent_id)
            if parent_id not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, 
                                ro_id, relation_just_added, fw)

    for parent_id in curr_parent_ids:
        if parent_id not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(EdamRelation).filter_by(child_id=child_id, parent_id=parent_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for edam_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, edam_id, url, fw):
    
    # print url
    # return

    x = EdamUrl(display_name = display_name,
               url_type = display_name,
               source_id = source_id,
               edam_id = edam_id,
               obj_url = url,
               created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for edam_id = " + str(edam_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, edam_id, alias_just_added, fw):

    # print display_name
    # return

    if (edam_id, display_name, alias_type) in alias_just_added:
        return

    alias_just_added[(edam_id, display_name, alias_type)] = 1

    x = EdamAlia(display_name = display_name,
                 alias_type = alias_type,
                 source_id = source_id,
                 edam_id = edam_id,
                 created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for edam_id = " + str(edam_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):
    
    # print "PARENT/CHILD: ", parent_id, child_id
    # return

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    x = EdamRelation(parent_id = parent_id,
                    child_id = child_id,
                    source_id = source_id,
                    ro_id = ro_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for edam_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    if len(to_delete_list) > 0:
        summary = summary + "The following EDAM terms are not in the current release:\n"
        for (edamid, term) in to_delete_list:
            summary = summary + "\t" + edamid + " " + term + "\n"
                                          
    fw.write(summary)
    print(summary)


if __name__ == "__main__":
        
    # http://edamontology.org/EDAM_1.20.owl
    url_path = "http://edamontology.org/"
    owl_file = "EDAM_1.20.owl"
    urllib.request.urlretrieve(url_path + owl_file, owl_file)
    load_ontology(owl_file)


    
        
