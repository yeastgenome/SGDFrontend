from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Source, Apo, ApoUrl, ApoAlia, ApoRelation, Ro
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from ontology import read_owl  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update APO ontology in NEX2.

ontology_file = 'data/apo.owl'
log_file = 'logs/apo.log'
ontology = 'APO'
src = 'SGD'

def load_ontology():

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    apoid_to_apo =  dict([(x.apoid, x) for x in nex_session.query(Apo).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    
    apo_id_to_alias = {}
    for x in nex_session.query(ApoAlia).all():
        aliases = []
        if x.apo_id in apo_id_to_alias:
            aliases = apo_id_to_alias[x.apo_id]
        aliases.append((x.display_name, x.alias_type))
        apo_id_to_alias[x.apo_id] = aliases

    apo_id_to_parent = {}
    for x in nex_session.query(ApoRelation).all():
        parents = []
        if x.child_id in apo_id_to_parent:
            parents = apo_id_to_parent[x.child_id]
        parents.append(x.parent_id)
        apo_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    is_sgd_term = {}
    data = read_owl(ontology_file, ontology, is_sgd_term)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 apoid_to_apo, 
                                                 is_sgd_term, 
                                                 term_to_ro_id['is a'],
                                                 apo_id_to_alias,
                                                 apo_id_to_parent,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, apoid_to_apo, is_sgd_term, ro_id, apo_id_to_alias, apo_id_to_parent, fw):

    active_apoid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0
    
    for x in data:
        apo_id = None
        if x['id'] not in is_sgd_term:
            # print "NOT SGD TERM", x['id'], x['term'], x['namespace']
            continue
        if x['term'] == 'mutant type':
            x['term'] = 'mutant_type'
        if x['term'] == 'experiment type':
            x['term'] = 'experiment_type'
        if x['id'] in apoid_to_apo:
            ## in database
            y = apoid_to_apo[x['id']]
            apo_id = y.apo_id
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
                # print "UPDATED: ", y.apoid, y.display_name, x['term']
            # else:
            #    # print "SAME: ", y.apoid, y.display_name, x['namespace'], x['definition'], x['aliases'], x['parents']
            active_apoid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Apo(source_id = source_to_id[src],
                         format_name = x['id'],
                         apoid = x['id'],
                         display_name = x['term'],
                         apo_namespace = x['namespace'],
                         description = x['definition'],
                         obj_url = x['namespace'] + '/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            apo_id = this_x.apo_id
            update_log['added'] = update_log['added'] + 1
            # print "NEW: ", x['id'], x['term'], x['namespace'], x['definition']

            ## add three URLs
            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_to_id['Ontobee'], 'Ontobee', apo_id, 
                       'http://www.ontobee.org/ontology/APO?iri=http://purl.obolibrary.org/obo/'+link_id,
                       fw)
            insert_url(nex_session, source_to_id['BioPortal'], 'BioPortal', apo_id,
                       'http://bioportal.bioontology.org/ontologies/APO/?p=classes&conceptid=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)
            insert_url(nex_session, source_to_id['OLS'], 'OLS', apo_id, 
                       'http://www.ebi.ac.uk/ols/ontologies/apo/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)

            ## add RELATIONS                                                                      
            for parent_apoid in x['parents']:
                parent = apoid_to_apo.get(parent_apoid)
                if parent is not None:
                    parent_id = parent.apo_id
                    child_id = apo_id
                    insert_relation(nex_session, source_to_id[src], parent_id, child_id, ro_id, fw)
            
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, alias_type, apo_id, fw)

        ## update RELATIONS
        # print x['id'], "RELATION", apo_id_to_parent.get(apo_id), x['parents']

        update_relations(nex_session, apo_id, apo_id_to_parent.get(apo_id), x['parents'], 
                         source_to_id[src], apoid_to_apo, ro_id, fw)
                    
        ## update ALIASES
        # print x['id'], "ALIAS", apo_id_to_alias.get(apo_id), x['aliases']

        update_aliases(nex_session, apo_id, apo_id_to_alias.get(apo_id), x['aliases'],
                       source_to_id[src], apoid_to_apo, fw)
    
    to_delete = []
    for apoid in apoid_to_apo:
        if apoid in active_apoid:
            continue
        x = apoid_to_apo[apoid]
        if apoid.startswith('NTR'):
            continue
        to_delete.append((apoid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.apoid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]


def update_aliases(nex_session, apo_id, curr_aliases, new_aliases, source_id, apoid_to_apo, fw):

     if curr_aliases is None:
        curr_aliases = []
     
     for (alias, type) in new_aliases:
         if (alias, type) not in curr_aliases:
             insert_alias(nex_session, source_id, alias, type, apo_id, fw)

     for (alias, type) in curr_aliases:
         if(alias, type) not in new_aliases:
            ## remove the old one                                                             
             to_delete = nex_session.query(ApoAlia).filter_by(apo_id=apo_id, display_name=alias, alias_type=type).first()
             nex_session.delete(to_delete) 
             fw.write("The old alias = " + alias + " has been deleted for apo_id = " + str(apo_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, source_id, apoid_to_apo, ro_id, fw):
    
    if curr_parent_ids is None:
        curr_parent_ids = []
    
    new_parent_ids = []
    for parent_apoid in new_parents:
        parent = apoid_to_apo.get(parent_apoid)
        if parent is not None:
            parent_id = parent.apo_id
            new_parent_ids.append(parent_id)
            if parent_id not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, ro_id, fw)

    for parent_id in curr_parent_ids:
        if parent_id not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(ApoRelation).filter_by(child_id=child_id, parent_id=parent_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for apo_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, apo_id, url, fw):
    x = ApoUrl(display_name = display_name,
               url_type = display_name,
               source_id = source_id,
               apo_id = apo_id,
               obj_url = url,
               created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for apo_id = " + str(apo_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, apo_id, fw):
    x = ApoAlia(display_name = display_name,
                alias_type = alias_type,
                source_id = source_id,
                apo_id = apo_id,
                created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for apo_id = " + str(apo_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, fw):
    x = ApoRelation(parent_id = parent_id,
                    child_id = child_id,
                    source_id = source_id,
                    ro_id = ro_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for apo_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    # if len(to_delete_list) > 0:
    #    summary = summary + "The following APO terms are not in the current release:\n"
    #    for (apoid, term) in to_delete_list:
    #        summary = summary + "\t" + apoid + " " + term + "\n"
                                          
    fw.write(summary)
    print summary


if __name__ == "__main__":
        
    load_ontology()


    
        
