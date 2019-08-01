import urllib.request, urllib.parse, urllib.error
import logging
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Source, Ec, EcUrl, EcAlias
from scripts.loading.database_session import get_session
from scripts.loading.ontology import read_data_file  
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update EC ontology in NEX2.

log_file = 'scripts/loading/ontology/logs/ec.log'
src = 'ExPASy'
CREATED_BY = os.environ['DEFAULT_USER']

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

log.info("EC Loading Report:\n")

def load_ontology(enzyme_file):

    nex_session = get_session()

    log.info(str(datetime.now()))
    log.info("Getting data from database...")

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    ecid_to_ec =  dict([(x.ecid, x) for x in nex_session.query(Ec).all()])
    
    ec_id_to_alias = {}
    for x in nex_session.query(EcAlias).all():
        aliases = []
        if x.ec_id in ec_id_to_alias:
            aliases = ec_id_to_alias[x.ec_id]
        aliases.append(x.display_name)
        ec_id_to_alias[x.ec_id] = aliases

    ####################################
    fw = open(log_file, "w")

    log.info("Reading data from enzyme file...")

    data = read_data_file(enzyme_file)

    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 ecid_to_ec, 
                                                 ec_id_to_alias,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()

    log.info(str(datetime.now()))
    log.info("Done!\n\n")

def load_new_data(nex_session, data, source_to_id, ecid_to_ec, ec_id_to_alias, fw):

    active_ecid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    alias_just_added = {}
    for x in data:
        ec_id = None
        id = "EC:" + x['id']
        if id in ecid_to_ec:
            ## in database
            y = ecid_to_ec[id]
            ec_id = y.ec_id
            if y.is_obsolete is True:
                y.is_obsolete = '0'
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                fw.write("The is_obsolete for " + id + " has been updated from " + y.is_obsolete + " to " + 'False' + "\n")
            if x['description'] != y.description:
                ## update description
                fw.write("The description for " + id + " has been updated from " + y.description + " to " + x['description'] + "\n")
                y.description = x['description']
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
            # else:
            #    print "SAME: ", y.ecid, x['description'], x['aliases']
            active_ecid.append(id)
        else:
            fw.write("NEW entry = " + "\n")
            this_x = Ec(source_id = source_to_id[src],
                        format_name = id,
                        display_name = id,
                        ecid = id,
                        description = x['description'],
                        obj_url = '/ecnumber/' + id,
                        is_obsolete = '0',
                        created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            ec_id = this_x.ec_id
            update_log['added'] = update_log['added'] + 1
            # print "NEW entry:", id
            ## add three URLs
            insert_url(nex_session, source_to_id[src], src, ec_id, 
                       'http://enzyme.expasy.org/EC/'+x['id'],
                       fw)
            insert_url(nex_session, source_to_id['BRENDA'], 'BRENDA', ec_id,
                       'http://www.brenda-enzymes.org/php/result_flat.php4?ecno=' + x['id'],
                       fw)
            
            ## add ALIASES
            for alias in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, 
                             'Synonym', ec_id, alias_just_added, fw)
                    
        ## update ALIASES
        # print x['id'], "ALIAS", ec_id_to_alias.get(ec_id), x['aliases']

        update_aliases(nex_session, ec_id, ec_id_to_alias.get(ec_id), x['aliases'],
                       source_to_id[src], ecid_to_ec, alias_just_added, fw)
    
    to_delete = []
    for ecid in ecid_to_ec:
        if ecid in active_ecid:
            continue
        x = ecid_to_ec[ecid]
        if ecid.startswith('NTR'):
            continue
        to_delete.append(ecid)
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.ecid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]


def update_aliases(nex_session, ec_id, curr_aliases, new_aliases, source_id, ecid_to_ec, alias_just_added, fw):

    # print "ALIAS: ", curr_aliases, new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    for alias in new_aliases:
        if alias not in curr_aliases:
            insert_alias(nex_session, source_id, alias, 'Synonym', ec_id, alias_just_added, fw)

    for alias in curr_aliases:
        if alias not in new_aliases:
            ## remove the old one                                                             
            to_delete = nex_session.query(EcAlias).filter_by(ec_id=ec_id, display_name=alias).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for ec_id = " + str(ec_id) + "\n")
             
def insert_url(nex_session, source_id, display_name, ec_id, url, fw):
    
    # print url
    # return

    x = EcUrl(display_name = display_name,
              url_type = display_name,
              source_id = source_id,
              ec_id = ec_id,
              obj_url = url,
              created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for ec_id = " + str(ec_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, ec_id, alias_just_added, fw):

    # print display_name
    # return

    if (ec_id, display_name) in alias_just_added:
        return

    alias_just_added[(ec_id, display_name)] = 1

    x = EcAlias(display_name = display_name,
                alias_type = alias_type,
                source_id = source_id,
                ec_id = ec_id,
                created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for ec_id = " + str(ec_id) + "\n")

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    if len(to_delete_list) > 0:
        summary = summary + "The following EC numbers are not in the current release:\n"
        for ecid in to_delete_list:
            summary = summary + "\t" + ecid + "\n"
                                          
    fw.write(summary)
    print(summary)


if __name__ == "__main__":
        
    url_path = "ftp://ftp.expasy.org/databases/enzyme/"
    ec_file = "enzyme.dat"
    urllib.request.urlretrieve(url_path + ec_file, ec_file)

    load_ontology(ec_file)


    
        
