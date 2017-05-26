from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('utf-8')
sys.path.insert(0, '../../../src/')
from models import Source, Go, GoUrl, GoAlias, GoRelation, Ro
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from ontology import read_owl  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update GO ontology in NEX2.

ontology_file = 'data/go.owl'
log_file = 'logs/go.log'
ontology = 'GO'
src = 'GOC'

def load_ontology():

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    goid_to_go =  dict([(x.goid, x) for x in nex_session.query(Go).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    roid_to_ro_id = dict([(x.roid, x.ro_id) for x in nex_session.query(Ro).all()])

    go_id_to_alias = {}
    for x in nex_session.query(GoAlias).all():
        aliases = []
        if x.go_id in go_id_to_alias:
            aliases = go_id_to_alias[x.go_id]
        aliases.append((x.display_name, x.alias_type))
        go_id_to_alias[x.go_id] = aliases

    go_id_to_parent = {}
    for x in nex_session.query(GoRelation).all():
        parents = []
        if x.child_id in go_id_to_parent:
            parents = go_id_to_parent[x.child_id]
        parents.append((x.parent_id, x.ro_id))
        go_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    

    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 goid_to_go, 
                                                 term_to_ro_id['is a'],
                                                 roid_to_ro_id,
                                                 go_id_to_alias,
                                                 go_id_to_parent,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, goid_to_go, ro_id, roid_to_ro_id, go_id_to_alias, go_id_to_parent, fw):

    active_goid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    relation_just_added = {}
    alias_just_added = {}
    for x in data:
        go_id = None
        if "GO:" not in x['id']:
            continue
        if x['id'] in goid_to_go:
            ## in database
            y = goid_to_go[x['id']]
            go_id = y.go_id
            if y.is_obsolete is True:
                y.is_obsolete = '0'
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                fw.write("The is_obsolete for " + x['id'] + " has been updated from " + y.is_obsolete + " to " + 'False' + "\n")
            if x['term'] != y.display_name.strip():
                ## update term
                fw.write("The display_name for " + x['id'] + " has been updated from " + y.display_name + " to " + x['term'] + "\n")
                y.display_name = x['term']
                # nex_session.add(y)
                # nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                print "UPDATED: ", y.goid, ":"+y.display_name+ ":" + ":"+x['term']+":"
            # else:
            #    print "SAME: ", y.goid, y.display_name, x['definition'], x['aliases'], x['parents'], x['other_parents']
            active_goid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Go(source_id = source_to_id[src],
                         format_name = x['id'],
                         goid = x['id'],
                         display_name = x['term'],
                         go_namespace = x['namespace'].replace("_", " "),
                         description = x['definition'],
                         obj_url = '/go/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            go_id = this_x.go_id
            update_log['added'] = update_log['added'] + 1
            print "NEW: ", x['id'], x['term'], x['definition']

            ## add three URLs
            insert_url(nex_session, source_to_id['GOC'], x['id'], go_id, 
                       'http://amigo.geneontology.org/amigo/term/'+x['id'],
                       fw, 'GO')
            insert_url(nex_session, source_to_id['GOC'], 
                       'View GO Annotations in other species in AmiGO', go_id,
                       'http://amigo.geneontology.org/amigo/term/'+x['id']+'#display-associations-tab',
                       fw, 'Amigo')
            

            ## add RELATIONS
            for parent_goid in x['parents']:
                parent = goid_to_go.get(parent_goid)
                if parent is not None:
                    parent_id = parent.go_id
                    child_id = go_id
                    insert_relation(nex_session, source_to_id[src], parent_id, 
                                    child_id, ro_id, relation_just_added, fw)
            for (parent_goid, roid) in x['other_parents']:
                parent = goid_to_go.get(parent_goid)
                if parent is not None:
                    parent_id = parent.go_id
                    child_id = go_id
                    this_ro_id = roid_to_ro_id.get(roid)
                    if this_ro_id is None:
                        print "The ROID:", roid, " is not found in the database"
                        continue
                    insert_relation(nex_session, source_to_id[src], parent_id,
                                    child_id, this_ro_id, relation_just_added, fw)
                    
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, 
                             alias_type, go_id, alias_just_added, fw)

        ## update RELATIONS
        curr_parents = go_id_to_parent.get(go_id)
        if curr_parents is None:
            curr_parents = []
        # if len(curr_parents) > len(x['parents']) + len(x['other_parents']):
        #    print "RELATION-missing:",  x['id'], go_id_to_parent.get(go_id), x['parents'], x['other_parents']
        # elif len(curr_parents) < len(x['parents']) + len(x['other_parents']):
        #    print "RELATION-adding:",  x['id'], go_id_to_parent.get(go_id), x['parents'], x['other_parents']

        update_relations(nex_session, go_id, curr_parents, x['parents'], 
                         x['other_parents'], roid_to_ro_id, 
                         source_to_id[src], goid_to_go, ro_id, relation_just_added, fw)
                    
        ## update ALIASES
        # print x['id'], "ALIAS", go_id_to_alias.get(go_id), x['aliases']

        update_aliases(nex_session, go_id, go_id_to_alias.get(go_id), x['aliases'],
                       source_to_id[src], goid_to_go, alias_just_added, fw)
    
    to_delete = []
    for goid in goid_to_go:
        if goid in active_goid:
            continue
        x = goid_to_go[goid]
        if goid.startswith('NTR'):
            continue
        to_delete.append((goid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.goid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]


def update_aliases(nex_session, go_id, curr_aliases, new_aliases, source_id, goid_to_go, alias_just_added, fw):

    # print "ALIAS: ", curr_aliases, new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    for (alias, type) in new_aliases:
        if (alias, type) not in curr_aliases:
            insert_alias(nex_session, source_id, alias, type, go_id, alias_just_added, fw)

    for (alias, type) in curr_aliases:
        if(alias, type) not in new_aliases:
            ## remove the old one                         
            
            print "NEED TO DELETE ALIAS:", alias, type
            continue

            to_delete = nex_session.query(GoAlias).filter_by(go_id=go_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for go_id = " + str(go_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, other_parents, roid_to_ro_id, source_id, goid_to_go, ro_id, relation_just_added, fw):

    print "RELATION: ", curr_parent_ids, new_parents, other_parents
    # return 
    
    new_parent_ids = []
    for parent_goid in new_parents:
        parent = goid_to_go.get(parent_goid)
        if parent is not None:
            parent_id = parent.go_id
            new_parent_ids.append((parent_id, ro_id))
            if (parent_id, ro_id) not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id,
                                ro_id, relation_just_added, fw)

    for (parent_goid, roid) in other_parents:
        parent = goid_to_go.get(parent_goid)
        if parent is not None:
            parent_id = parent.go_id
            this_ro_id = roid_to_ro_id.get(roid)
            if this_ro_id is None:
                print "The ROID:", roid, " is not found in the database"
                continue
            new_parent_ids.append((parent_id, this_ro_id))
            if (parent_id, this_ro_id) not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, 
                                this_ro_id, relation_just_added, fw)

    for (parent_id, ro_id) in curr_parent_ids:
        if (parent_id, ro_id) not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(GoRelation).filter_by(child_id=child_id, parent_id=parent_id, ro_id=ro_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for go_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, go_id, url, fw, url_type=None):
    
    # print url
    # return

    if url_type is None:
        url_type = display_name

    x = GoUrl(display_name = display_name,
              url_type = url_type,
              source_id = source_id,
              go_id = go_id,
              obj_url = url,
              created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for go_id = " + str(go_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, go_id, alias_just_added, fw):

    # print display_name, alias_type
    # return

    if (go_id, display_name, alias_type) in alias_just_added:
        return

    alias_just_added[(go_id, display_name, alias_type)] = 1

    x = GoAlias(display_name = display_name,
                alias_type = alias_type,
                source_id = source_id,
                go_id = go_id,
                created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for go_id = " + str(go_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):
    
    # print "PARENT/CHILD: ", parent_id, child_id
    # return

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    x = GoRelation(parent_id = parent_id,
                    child_id = child_id,
                    source_id = source_id,
                    ro_id = ro_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for go_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    if len(to_delete_list) > 0:
        summary = summary + "The following GO terms are not in the current release:\n"
        for (goid, term) in to_delete_list:
            summary = summary + "\t" + goid + " " + term + "\n"
                                          
    fw.write(summary)
    print summary


if __name__ == "__main__":
        
    load_ontology()


    
        
