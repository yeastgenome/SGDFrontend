from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('utf-8')
sys.path.insert(0, '../../../src/')
from models import Source, Disease, DiseaseUrl, DiseaseAlia, DiseaseRelation, Ro
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from ontology import read_owl  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update Disease ontology in NEX2.

ontology_file = 'data/doid.owl'
log_file = 'logs/doid.log'
ontology = 'DOID'
src = 'DO'

def load_ontology():

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    doid_to_disease =  dict([(x.doid, x) for x in nex_session.query(Disease).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    
    disease_id_to_alias = {}
    for x in nex_session.query(DiseaseAlia).all():
        aliases = []
        if x.disease_id in disease_id_to_alias:
            aliases = disease_id_to_alias[x.disease_id]
        aliases.append((x.display_name, x.alias_type))
        disease_id_to_alias[x.disease_id] = aliases

    disease_id_to_parent = {}
    for x in nex_session.query(DiseaseRelation).all():
        parents = []
        if x.child_id in disease_id_to_parent:
            parents = disease_id_to_parent[x.child_id]
        parents.append(x.parent_id)
        disease_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    is_sgd_term = {}
    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 doid_to_disease, 
                                                 term_to_ro_id['is a'],
                                                 disease_id_to_alias,
                                                 disease_id_to_parent,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, doid_to_disease, ro_id, disease_id_to_alias, disease_id_to_parent, fw):

    active_doid = []
    update_log = {}
    relation_just_added = {}
    alias_just_added = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0
    
    for x in data:
        if "DOID:" not in x['id']:
            continue
        disease_id = None
        if x['id'] in doid_to_disease:
            ## in database
            y = doid_to_disease[x['id']]
            disease_id = y.disease_id

            if y.is_obsolete is True:
                y.is_obsolete = '0'
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                fw.write("The is_obsolete for " + x['id'] + " has been updated from " + y.is_obsolete + " to " + 'False' + "\n")

            if x['term'] != y.display_name:
                ## update term
                print "UPDATED: ", y.doid, y.display_name, x['term']
                fw.write("The display_name for " + x['id'] + " has been updated from " + y.display_name + " to " + x['term'] + "\n")
                y.display_name = x['term']
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
            # else:
            #    print "SAME: ", y.doid, y.display_name, x['namespace'], x['definition'], x['aliases'], x['parents']
            active_doid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Disease(source_id = source_to_id[src],
                             format_name = x['id'],
                             doid = x['id'],
                             display_name = x['term'],
                             description = x['definition'],
                             obj_url = '/disease/' + x['id'],
                             is_obsolete = '0',
                             created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            disease_id = this_x.disease_id
            update_log['added'] = update_log['added'] + 1
            print "NEW: ", x['id'], x['term'], x['namespace'], x['definition']

            ## add three URLs
            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_to_id['DO'], 'DO', disease_id,
                       'http://www.disease-ontology.org/?id=' + x['id'],
                       fw)
            insert_url(nex_session, source_to_id['BioPortal'], 'BioPortal', disease_id,
                       'http://bioportal.bioontology.org/ontologies/DOID/?p=classes&conceptid=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)
            insert_url(nex_session, source_to_id['OLS'], 'OLS', disease_id,
                       'http://www.ebi.ac.uk/ols/ontologies/doid/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)
            insert_url(nex_session, source_to_id['Ontobee'], 'Ontobee', disease_id, 
                       'http://www.ontobee.org/ontology/DOID?iri=http://purl.obolibrary.org/obo/'+link_id,
                       fw)

            ## add RELATIONS                                                                      
            for parent_doid in x['parents']:
                parent = doid_to_disease.get(parent_doid)
                if parent is not None:
                    parent_id = parent.disease_id
                    child_id = disease_id
                    insert_relation(nex_session, source_to_id[src], parent_id, child_id, ro_id, relation_just_added, fw)
            
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, alias_type, disease_id, alias_just_added, fw)

        ## update RELATIONS
        # print x['id'], "RELATION", disease_id_to_parent.get(disease_id), x['parents']

        update_relations(nex_session, disease_id, disease_id_to_parent.get(disease_id), 
                         x['parents'], source_to_id[src], doid_to_disease, ro_id, relation_just_added, fw)
                    
        ## update ALIASES
        # print x['id'], "ALIAS", disease_id_to_alias.get(disease_id), x['aliases']

        update_aliases(nex_session, disease_id, disease_id_to_alias.get(disease_id), 
                       x['aliases'], source_to_id[src], doid_to_disease, alias_just_added, fw)

    to_delete = []
    for doid in doid_to_disease:
        if doid in active_doid:
            continue
        x = doid_to_disease[doid]
        if doid.startswith('NTR'):
            continue
        to_delete.append((doid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + doid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")
        
    nex_session.commit()

    return [update_log, to_delete]


def update_aliases(nex_session, disease_id, curr_aliases, new_aliases, source_id, doid_to_disease, alias_just_added, fw):

    # print "BEFORE:", curr_aliases, new_aliases

    

    if curr_aliases is None:
        curr_aliases = []
             
    for (alias, type) in new_aliases:
        if (alias, type) not in curr_aliases:
            insert_alias(nex_session, source_id, alias, type, disease_id, alias_just_added, fw)
             
    for (alias, type) in curr_aliases:
        if(alias, type) not in new_aliases:
            ## remove the old one                                                             
            to_delete = nex_session.query(DiseaseAlia).filter_by(disease_id=disease_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            # fw.write("The old alias = " + str(alias) + " has been deleted for disease_id = " + str(disease_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, source_id, doid_to_disease, ro_id, relation_just_added, fw):
    
    if curr_parent_ids is None:
        curr_parent_ids = []
    
    new_parent_ids = []
    for parent_doid in new_parents:
        parent = doid_to_disease.get(parent_doid)
        if parent is not None:
            parent_id = parent.disease_id
            new_parent_ids.append(parent_id)
            if parent_id not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw)

    for parent_id in curr_parent_ids:
        if parent_id not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(DiseaseRelation).filter_by(child_id=child_id, parent_id=parent_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for disease_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, disease_id, url, fw):

    # print "Added new URL: " + url + " for disease_id = " + str(disease_id) + "\n"
    x = DiseaseUrl(display_name = display_name,
               url_type = display_name,
               source_id = source_id,
               disease_id = disease_id,
               obj_url = url,
               created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for disease_id = " + str(disease_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, disease_id, alias_just_added, fw):
    
    if (disease_id, display_name, alias_type) in alias_just_added:
        return
    
    alias_just_added[(disease_id, display_name, alias_type)] = 1

    x = DiseaseAlia(display_name = display_name,
                    alias_type = alias_type,
                    source_id = source_id,
                    disease_id = disease_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for disease_id = " + str(disease_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    print "Added new PARENT: parent_id = " + str(parent_id) + " for disease_id = " + str(child_id) + "\n"
    x = DiseaseRelation(parent_id = parent_id,
                        child_id = child_id,
                        source_id = source_id,
                        ro_id = ro_id,
                        created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for disease_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    # if len(to_delete_list) > 0:
    #    summary = summary + "The following Disease terms are not in the current release:\n"
    #    for (doid, term) in to_delete_list:
    #        summary = summary + "\t" + doid + " " + term + "\n"
                                          
    fw.write(summary)
    print summary


if __name__ == "__main__":
        
    load_ontology()


    
        
