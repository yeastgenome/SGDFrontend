from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('utf-8')
sys.path.insert(0, '../../../src/')
from models import Source, Eco, EcoUrl, EcoAlias, EcoRelation, Ro
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from ontology import read_owl  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update ECO ontology in NEX2.

ontology_file = 'data/eco.owl'
log_file = 'logs/eco.log'
ontology = 'ECO'
src = 'ECO'

def load_ontology():

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    ecoid_to_eco =  dict([(x.ecoid, x) for x in nex_session.query(Eco).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    
    eco_id_to_alias = {}
    for x in nex_session.query(EcoAlias).all():
        aliases = []
        if x.eco_id in eco_id_to_alias:
            aliases = eco_id_to_alias[x.eco_id]
        aliases.append((x.display_name, x.alias_type))
        eco_id_to_alias[x.eco_id] = aliases

    eco_id_to_parent = {}
    for x in nex_session.query(EcoRelation).all():
        parents = []
        if x.child_id in eco_id_to_parent:
            parents = eco_id_to_parent[x.child_id]
        parents.append(x.parent_id)
        eco_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    is_sgd_term = {}
    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 ecoid_to_eco, 
                                                 term_to_ro_id['is a'],
                                                 eco_id_to_alias,
                                                 eco_id_to_parent,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, ecoid_to_eco, ro_id, eco_id_to_alias, eco_id_to_parent, fw):

    active_ecoid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    relation_just_added = {}
    alias_just_added = {}
    for x in data:
        eco_id = None
        if "ECO:" not in x['id']:
            continue
        if x['id'] in ecoid_to_eco:
            ## in database
            y = ecoid_to_eco[x['id']]
            eco_id = y.eco_id
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
                # print "UPDATED: ", y.ecoid, y.display_name, x['term']
            # else:
            #    print "SAME: ", y.ecoid, y.display_name, x['definition'], x['aliases'], x['parents']
            active_ecoid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Eco(source_id = source_to_id[src],
                         format_name = x['id'],
                         ecoid = x['id'],
                         display_name = x['term'],
                         description = x['definition'],
                         obj_url = '/eco/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            eco_id = this_x.eco_id
            update_log['added'] = update_log['added'] + 1
            # print "NEW: ", x['id'], x['term'], x['definition']

            ## add three URLs
            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_to_id['Ontobee'], 'Ontobee', eco_id, 
                       'http://www.ontobee.org/ontology/ECO?iri=http://purl.obolibrary.org/obo/'+link_id,
                       fw)
            insert_url(nex_session, source_to_id['BioPortal'], 'BioPortal', eco_id,
                       'http://bioportal.bioontology.org/ontologies/ECO/?p=classes&conceptid=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)
            insert_url(nex_session, source_to_id['OLS'], 'OLS', eco_id, 
                       'http://www.ebi.ac.uk/ols/ontologies/eco/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2F' + link_id,
                       fw)

            ## add RELATIONS                                                                      
            for parent_ecoid in x['parents']:
                parent = ecoid_to_eco.get(parent_ecoid)
                if parent is not None:
                    parent_id = parent.eco_id
                    child_id = eco_id
                    insert_relation(nex_session, source_to_id[src], parent_id, 
                                    child_id, ro_id, relation_just_added, fw)
            
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, 
                             alias_type, eco_id, alias_just_added, fw)

        ## update RELATIONS
        # print x['id'], "RELATION", eco_id_to_parent.get(eco_id), x['parents']

        update_relations(nex_session, eco_id, eco_id_to_parent.get(eco_id), x['parents'], 
                         source_to_id[src], ecoid_to_eco, ro_id, relation_just_added, fw)
                    
        ## update ALIASES
        # print x['id'], "ALIAS", eco_id_to_alias.get(eco_id), x['aliases']

        update_aliases(nex_session, eco_id, eco_id_to_alias.get(eco_id), x['aliases'],
                       source_to_id[src], ecoid_to_eco, alias_just_added, fw)
    
    to_delete = []
    for ecoid in ecoid_to_eco:
        if ecoid in active_ecoid:
            continue
        x = ecoid_to_eco[ecoid]
        if ecoid.startswith('NTR'):
            continue
        to_delete.append((ecoid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.ecoid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]


def update_aliases(nex_session, eco_id, curr_aliases, new_aliases, source_id, ecoid_to_eco, alias_just_added, fw):

    # print "ALIAS: ", curr_aliases, new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    for (alias, type) in new_aliases:
        if (alias, type) not in curr_aliases:
            insert_alias(nex_session, source_id, alias, type, eco_id, alias_just_added, fw)

    for (alias, type) in curr_aliases:
        if(alias, type) not in new_aliases:
            ## remove the old one                                                             
            to_delete = nex_session.query(EcoAlias).filter_by(eco_id=eco_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for eco_id = " + str(eco_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, source_id, ecoid_to_eco, ro_id, relation_just_added, fw):

    # print "RELATION: ", curr_parent_ids, new_parents
    # return 

    if curr_parent_ids is None:
        curr_parent_ids = []
    
    new_parent_ids = []
    for parent_ecoid in new_parents:
        parent = ecoid_to_eco.get(parent_ecoid)
        if parent is not None:
            parent_id = parent.eco_id
            new_parent_ids.append(parent_id)
            if parent_id not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, 
                                ro_id, relation_just_added, fw)

    for parent_id in curr_parent_ids:
        if parent_id not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(EcoRelation).filter_by(child_id=child_id, parent_id=parent_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for eco_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, eco_id, url, fw):
    
    # print url
    # return

    x = EcoUrl(display_name = display_name,
               url_type = display_name,
               source_id = source_id,
               eco_id = eco_id,
               obj_url = url,
               created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for eco_id = " + str(eco_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, eco_id, alias_just_added, fw):

    # print display_name
    # return

    if (eco_id, display_name, alias_type) in alias_just_added:
        return

    alias_just_added[(eco_id, display_name, alias_type)] = 1

    x = EcoAlias(display_name = display_name,
                alias_type = alias_type,
                source_id = source_id,
                eco_id = eco_id,
                created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for eco_id = " + str(eco_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):
    
    # print "PARENT/CHILD: ", parent_id, child_id
    # return

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    x = EcoRelation(parent_id = parent_id,
                    child_id = child_id,
                    source_id = source_id,
                    ro_id = ro_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for eco_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    # if len(to_delete_list) > 0:
    #    summary = summary + "The following ECO terms are not in the current release:\n"
    #    for (ecoid, term) in to_delete_list:
    #        summary = summary + "\t" + ecoid + " " + term + "\n"
                                          
    fw.write(summary)
    print summary


if __name__ == "__main__":
        
    load_ontology()


    
        
