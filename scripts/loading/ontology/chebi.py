from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('utf-8')
sys.path.insert(0, '../../../src/')
from models import Source, Chebi, ChebiUrl, ChebiAlia
sys.path.insert(0, '../')
from config import CREATED_BY
from database_session import get_nex_session as get_session
from ontology import read_owl  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update APO ontology in NEX2.

ontology_file = 'data/chebi.owl'
log_file = 'logs/chebi.log'
ontology = 'CHEBI'
src = 'ChEBI'

def load_ontology():

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    chebiid_to_chebi =  dict([(x.chebiid, x) for x in nex_session.query(Chebi).all()])
    
    chebi_id_to_alias = {}
    for x in nex_session.query(ChebiAlia).all():
        aliases = []
        if x.chebi_id in chebi_id_to_alias:
            aliases = chebi_id_to_alias[x.chebi_id]
        aliases.append((x.display_name, x.alias_type))
        chebi_id_to_alias[x.chebi_id] = aliases

    ####################################
    fw = open(log_file, "w")

    is_3_star_term = {}
    data = read_owl(ontology_file, ontology, is_3_star_term)
    
    [update_log, to_delete_list, term_name_changed] = load_new_data(nex_session, data, 
                                                                    source_to_id, 
                                                                    chebiid_to_chebi, 
                                                                    chebi_id_to_alias,
                                                                    is_3_star_term,
                                                                    fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list, term_name_changed)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, chebiid_to_chebi, chebi_id_to_alias, is_3_star_term, fw):

    active_chebiid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0
    
    alias_just_loaded = {}
    term_name_changed = ""
    i = 0

    for x in data:

        if "CHEBI:" not in x['id']:
            continue
        if len(x['term']) > 500:
            continue
        if x['id'] not in is_3_star_term:
            continue

        chebi_id = None
        if x['id'] in chebiid_to_chebi:
            ## in database
            y = chebiid_to_chebi[x['id']]
            chebi_id = y.chebi_id

            if y.is_obsolete is True:
                y.is_obsolete = '0'
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                fw.write("The is_obsolete for " + x['id'] + " has been updated from " + y.is_obsolete + " to " + 'False' + "\n")

            if x['term'].replace("'", "").replace("->", "").replace("-&gt;", "") != y.display_name.replace("'", "").replace("->", "").replace("-&gt;", ""):

                ## update term
                fw.write("The display_name for " + x['id'] + " has been updated from " + y.display_name + " to " + x['term'] + "\n")
                term_name_changed = term_name_changed + "The display_name for " + x['id'] + " has been updated from " + y.display_name + " to " + x['term'] + "\n"

                y.display_name = x['term']
                # nex_session.add(y)
                # nex_session.flush()
                # update_log['updated'] = update_log['updated'] + 1
                # print "UPDATED: ", y.chebiid, y.display_name, x['term']
            # else:
            #    print "SAME: ", y.chebiid, y.display_name, x['definition'], x['aliases']
            active_chebiid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Chebi(source_id = source_to_id[src],
                         format_name = x['id'],
                         chebiid = x['id'],
                         display_name = x['term'],
                         description = x['definition'],
                         obj_url = '/chemical/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            chebi_id = this_x.chebi_id
            update_log['added'] = update_log['added'] + 1
            # print "NEW: ", x['id'], x['term'], x['definition']

            ## add URL            
            insert_url(nex_session, source_to_id['ChEBI'], 'ChEBI', chebi_id, 
                       'https://www.ebi.ac.uk/chebi/searchId.do?chebiId='+x['id'],
                       fw)
            
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, alias_type, chebi_id, alias_just_loaded, fw)
        
        ## update ALIASES
        # print x['id'], "ALIAS", chebi_id_to_alias.get(chebi_id), x['aliases']

        update_aliases(nex_session, chebi_id, chebi_id_to_alias.get(chebi_id), x['aliases'],
                       source_to_id[src], chebiid_to_chebi, alias_just_loaded, fw)

        i = i + 1
        if i > 200:
            nex_session.commit()
            i = 0

    to_delete = []
    for chebiid in chebiid_to_chebi:
        if chebiid in active_chebiid:
            continue
        x = chebiid_to_chebi[chebiid]
        if chebiid.startswith('NTR'):
            continue
        to_delete.append((chebiid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.chebiid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
            
    return [update_log, to_delete, term_name_changed]


def update_aliases(nex_session, chebi_id, curr_aliases, new_aliases, source_id, chebiid_to_chebi, alias_just_loaded, fw):

    # print "CURR_ALIASES=", curr_aliases, ", NEW_ALIASES=", new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    for (alias, type) in new_aliases:
        if (alias, type) not in curr_aliases:
             insert_alias(nex_session, source_id, alias, type, chebi_id, alias_just_loaded, fw)

    for (alias, type) in curr_aliases:
        if(alias, type) not in new_aliases:
            ## remove the old one                                                             
            to_delete = nex_session.query(ChebiAlia).filter_by(chebi_id=chebi_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for chebi_id = " + str(chebi_id) + "\n")
             

def insert_url(nex_session, source_id, display_name, chebi_id, url, fw):
    
    # print url
    # return

    x = ChebiUrl(display_name = display_name,
               url_type = display_name,
               source_id = source_id,
               chebi_id = chebi_id,
               obj_url = url,
               created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for chebi_id = " + str(chebi_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, chebi_id, alias_just_loaded, fw):
    
    # print display_name, alias_type
    # return

    if len(display_name) > 500:
        return
    
    if (chebi_id, display_name, alias_type) in alias_just_loaded:
        return
    alias_just_loaded[(chebi_id, display_name, alias_type)] = 1

    x = ChebiAlia(display_name = display_name,
                alias_type = alias_type,
                source_id = source_id,
                chebi_id = chebi_id,
                created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for chebi_id = " + str(chebi_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list, term_name_changed):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    if len(to_delete_list) > 0:
        summary = summary + "The following ChEBI terms are not in the current release:\n"
        for (chebiid, term) in to_delete_list:
            summary = summary + "\t" + chebiid + " " + term + "\n"
                                          
    summary = summary + term_name_changed

    fw.write(summary)
    print summary


if __name__ == "__main__":
        
    load_ontology()


    
        
