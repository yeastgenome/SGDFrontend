import urllib
import logging
import os
from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('utf-8')
from src.helpers import upload_file
from scripts.loading.database_session import get_session
from scripts.loading.ontology import read_owl
from src.models import Source, Ro, Edam, Dbentity, Filedbentity, \
                       Efo, EfoUrl, EfoAlias, EfoRelation
                 
__author__ = 'sweng66'

## Created on August 2018
## This script is used to update EFO ontology in NEX2.

log_file = 'scripts/loading/ontology/logs/efo.log'
ontology = 'EFO'
src = 'EFO'
CREATED_BY = os.environ['DEFAULT_USER']

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

log.info("EFO Ontology Loading Report:\n")

def load_ontology(ontology_file):

    nex_session = get_session()

    log.info(str(datetime.now()))
    log.info("Getting data from database...")

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    efoid_to_efo =  dict([(x.efoid, x) for x in nex_session.query(Efo).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    roid_to_ro_id = dict([(x.roid, x.ro_id) for x in nex_session.query(Ro).all()])
    edam_to_id = dict([(x.format_name, x.edam_id) for x in nex_session.query(Edam).all()])

    efo_id_to_alias = {}
    for x in nex_session.query(EfoAlias).all():
        aliases = []
        if x.efo_id in efo_id_to_alias:
            aliases = efo_id_to_alias[x.efo_id]
        aliases.append((x.display_name, x.alias_type))
        efo_id_to_alias[x.efo_id] = aliases

    efo_id_to_parent = {}
    for x in nex_session.query(EfoRelation).all():
        parents = []
        if x.child_id in efo_id_to_parent:
            parents = efo_id_to_parent[x.child_id]
        parents.append((x.parent_id, x.ro_id))
        efo_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    log.info("Reading data from ontology file...")

    data = read_owl(ontology_file, ontology)

    log.info("Updating efo ontology data in the database...")

    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 efoid_to_efo, 
                                                 term_to_ro_id['is a'],
                                                 roid_to_ro_id,
                                                 efo_id_to_alias,
                                                 efo_id_to_parent,
                                                 fw)

    log.info("Uploading file to S3...")

    update_database_load_file_to_s3(nex_session, ontology_file, source_to_id, edam_to_id)

    log.info("Writing loading summary...")

    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()

    log.info(str(datetime.now()))
    log.info("Done!\n\n")


def load_new_data(nex_session, data, source_to_id, efoid_to_efo, ro_id, roid_to_ro_id, efo_id_to_alias, efo_id_to_parent, fw):

    active_efoid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    relation_just_added = {}
    alias_just_added = {}

    max_length = 0

    for x in data:
        efo_id = None
        if "EFO:" not in x['id']:
            continue

        if x.get('definition') and len(x['definition']) > max_length:
            max_length = len(x['definition'])            

        if x['id'] in efoid_to_efo:
            ## in database
            y = efoid_to_efo[x['id']]
            efo_id = y.efo_id
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
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                print "UPDATED: ", y.efoid, ":"+y.display_name+ ":" + ":"+x['term']+":"
            if x.get('definition') and x['definition'] != y.description.strip():
                ## update description
                fw.write("The description for " + x['id'] + " has been updated from " + y.description + " to " + x['definition'] + "\n")
                y.description = x['definition']
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                print "UPDATED: ", y.efoid, ":"+y.description+ ":" + ":"+x['definition']+":"
            # else:
            #    print "SAME: ", y.efoid, y.display_name, x['definition'], x['aliases'], x['parents'], x['other_parents']
            active_efoid.append(x['id'])
        else:
            fw.write("NEW entry = " + x['id'] + " " + x['term'] + "\n")
            this_x = Efo(source_id = source_to_id[src],
                         format_name = x['id'],
                         efoid = x['id'],
                         display_name = x['term'],
                         description = x['definition'],
                         obj_url = '/efo/' + x['id'],
                         is_obsolete = '0',
                         created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            efo_id = this_x.efo_id
            update_log['added'] = update_log['added'] + 1
            # print "NEW: ", x['id'], x['term'], x['definition']

            link_id = x['id'].replace(':', '_')
            insert_url(nex_session, source_to_id['OLS'], 'OLS', efo_id,
                       "http://www.ebi.ac.uk/efo/" + link_id, fw)

            ## add RELATIONS
            for parent_efoid in x['parents']:
                parent = efoid_to_efo.get(parent_efoid)
                if parent is not None:
                    parent_id = parent.efo_id
                    child_id = efo_id
                    insert_relation(nex_session, source_to_id[src], parent_id, 
                                    child_id, ro_id, relation_just_added, fw)
            for (parent_efoid, roid) in x['other_parents']:
                parent = efoid_to_efo.get(parent_efoid)
                if parent is not None:
                    parent_id = parent.efo_id
                    child_id = efo_id
                    this_ro_id = roid_to_ro_id.get(roid)
                    if this_ro_id is None:
                        log.info("The ROID:" + str(roid) + " is not found in the database")
                        continue
                    insert_relation(nex_session, source_to_id[src], parent_id,
                                    child_id, this_ro_id, relation_just_added, fw)
                    
            ## add ALIASES
            for (alias, alias_type) in x['aliases']:
                if alias_type != 'EAXCT':
                    continue
                insert_alias(nex_session, source_to_id[src], alias, 
                             alias_type, efo_id, alias_just_added, fw)

            nex_session.commit()

        ## update RELATIONS
        curr_parents = efo_id_to_parent.get(efo_id)
        if curr_parents is None:
            curr_parents = []

        update_relations(nex_session, efo_id, curr_parents, x['parents'], 
                         x['other_parents'], roid_to_ro_id, 
                         source_to_id[src], efoid_to_efo, ro_id, relation_just_added, fw)
                    
        ## update ALIASES

        update_aliases(nex_session, efo_id, efo_id_to_alias.get(efo_id), x['aliases'],
                       source_to_id[src], efoid_to_efo, alias_just_added, fw)
    
    to_delete = []
    for efoid in efoid_to_efo:
        if efoid in active_efoid:
            continue
        x = efoid_to_efo[efoid]
        if efoid.startswith('NTR'):
            continue
        to_delete.append((efoid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.efoid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
    # nex_session.rollback()

    # print "max_length=", max_length
                             
    return [update_log, to_delete]


def update_aliases(nex_session, efo_id, curr_aliases, new_aliases, source_id, efoid_to_efo, alias_just_added, fw):

    # print "ALIAS: ", curr_aliases, new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    for (alias, type) in new_aliases:
        if type != 'EXACT':
            continue
        if (alias, type) not in curr_aliases:
            insert_alias(nex_session, source_id, alias, type, efo_id, alias_just_added, fw)

    for (alias, type) in curr_aliases:
        if(alias, type) not in new_aliases:
            to_delete = nex_session.query(EfoAlias).filter_by(efo_id=efo_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for efo_id = " + str(efo_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, other_parents, roid_to_ro_id, source_id, efoid_to_efo, ro_id, relation_just_added, fw):

    # print "RELATION: ", curr_parent_ids, new_parents, other_parents
    # return 
    
    new_parent_ids = []
    for parent_efoid in new_parents:
        parent = efoid_to_efo.get(parent_efoid)
        if parent is not None:
            parent_id = parent.efo_id
            new_parent_ids.append((parent_id, ro_id))
            if (parent_id, ro_id) not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id,
                                ro_id, relation_just_added, fw)

    for (parent_efoid, roid) in other_parents:
        parent = efoid_to_efo.get(parent_efoid)
        if parent is not None:
            parent_id = parent.efo_id
            this_ro_id = roid_to_ro_id.get(roid)
            if this_ro_id is None:
                log.info("The ROID:" + str(roid) + " is not found in the database")
                continue
            new_parent_ids.append((parent_id, this_ro_id))
            if (parent_id, this_ro_id) not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, 
                                this_ro_id, relation_just_added, fw)

    for (parent_id, ro_id) in curr_parent_ids:
        if (parent_id, ro_id) not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(EfoRelation).filter_by(child_id=child_id, parent_id=parent_id, ro_id=ro_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for efo_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, efo_id, url, fw, url_type=None):
    
    # print display_name, efo_id, url
    # return

    if url_type is None:
        url_type = display_name

    x = EfoUrl(display_name = display_name,
              url_type = url_type,
              source_id = source_id,
              efo_id = efo_id,
              obj_url = url,
              created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for efo_id = " + str(efo_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, efo_id, alias_just_added, fw):

    # print display_name, alias_type
    # return
    
    if (efo_id, display_name, alias_type) in alias_just_added:
        return

    alias_just_added[(efo_id, display_name, alias_type)] = 1

    x = EfoAlias(display_name = display_name,
                alias_type = alias_type,
                source_id = source_id,
                efo_id = efo_id,
                created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for efo_id = " + str(efo_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):
    
    # print "PARENT/CHILD: ", parent_id, child_id
    # return

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    x = EfoRelation(parent_id = parent_id,
                    child_id = child_id,
                    source_id = source_id,
                    ro_id = ro_id,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for efo_id = " + str(child_id) + "\n")
    

def update_database_load_file_to_s3(nex_session, ontology_file, source_to_id, edam_to_id):

    gzip_file = ontology_file + ".gz"
    import gzip
    import shutil
    with open(ontology_file, 'rb') as f_in, gzip.open(gzip_file, 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)

    local_file = open(gzip_file)

    import hashlib
    efo_md5sum = hashlib.md5(local_file.read()).hexdigest()
    efo_row = nex_session.query(Filedbentity).filter_by(md5sum = efo_md5sum).one_or_none()

    if efo_row is not None:
        return

    nex_session.query(Dbentity).filter_by(display_name=gzip_file, dbentity_status='Active').update({"dbentity_status": 'Archived'})
    nex_session.commit()
    
    data_id = edam_to_id.get('EDAM:2353')   ## data:2353 Ontology data
    topic_id = edam_to_id.get('EDAM:0089')  ## topic:0089 Ontology and terminology
    format_id = edam_to_id.get('EDAM:3262') ## format:3262 OWL/XML

    from sqlalchemy import create_engine
    from src.models import DBSession
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)

    upload_file(CREATED_BY, local_file,
                filename=gzip_file,
                file_extension='gz',
                description='EFO Ontology in OWL RDF/XML format',
                display_name=gzip_file,
                data_id=data_id,
                format_id=format_id,
                topic_id=topic_id,
                status='Active',          
                is_public='0',
                is_in_spell='0',
                is_in_browser='0',
                file_date=datetime.now(),
                source_id=source_to_id['SGD'])


def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    summary_4_email = summary
    if len(to_delete_list) > 0:
        summary = summary + "The following EFO terms are not in the current release:\n"
        for (efoid, term) in to_delete_list:
            summary = summary + "\t" + efoid + " " + term + "\n"
                                          
    fw.write(summary)
    log.info(summary_4_email)


if __name__ == "__main__":
        
    url_path = "http://www.ebi.ac.uk/efo/"
    efo_owl_file = "efo.owl"
    urllib.urlretrieve(url_path + efo_owl_file, efo_owl_file)
    
    load_ontology(efo_owl_file)
