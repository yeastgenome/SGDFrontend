from src.sgd.convert.util import get_relation_to_ro_id, read_gpi_file, \
     read_gpad_file, get_go_extension_link, sendmail
from src.sgd.convert.gpad_config import email_receiver, email_subject
from datetime import datetime
import sys

__author__ = 'sweng66'

## Created on June, 2016
## This script is used to load the go annotation (gpad) file into NEX2.

TAXON_ID = 'TAX:4932'
GPI_FILE = 'src/sgd/convert/data/gp_information.559292_sgd'
GPAD_FILE = 'src/sgd/convert/data/gp_association.559292_sgd'

def load_go_annotations(annotation_type, log_file):

    nex_session = get_nex_session()

    from src.sgd.model.nex.source import Source
    from src.sgd.model.nex.taxonomy import Taxonomy
    from src.sgd.model.nex.go import Go

    source_to_id = dict([(x.display_name, x.id) for x in nex_session.query(Source).all()])
    go_id_to_aspect =  dict([(x.id, x.go_namespace) for x in nex_session.query(Go).all()])

    fw = open(log_file, "w")
    
    fw.write(str(datetime.now()) + "\n")
    taxid_to_taxonomy_id =  dict([(x.taxid, x.id) for x in nex_session.query(Taxonomy).all()])
    taxonomy_id = taxid_to_taxonomy_id.get(TAXON_ID)
    if taxonomy_id is None:
        fw.write("The Taxon_id = " + TAXON_ID + " is not in the database\n")
        return
    
    fw.write(str(datetime.now()) + "\n")
    fw.write("getting old annotations from database...\n")
    key_to_annotation = all_go_annotations(nex_session, annotation_type)

    fw.write(str(datetime.now()) + "\n")
    fw.write("getting old go extensions from database...\n")
    annotation_id_to_extensions = all_go_extensions(nex_session)

    fw.write(str(datetime.now()) + "\n")
    fw.write("getting old go supporting evidences from database...\n")
    annotation_id_to_support_evidences = all_go_support_evidences(nex_session)

    fw.write(str(datetime.now()) + "\n")
    fw.write("reading gpi file...\n")
    [uniprot_to_date_assigned, uniprot_to_sgdid_list] = read_gpi_file(GPI_FILE)

    fw.write(str(datetime.now()) + "\n")
    fw.write("reading gpad file...\n")
    yes_goextension = 1
    yes_gosupport = 1
    new_pmids = []
    dbentity_id_with_new_pmid = {}
    dbentity_id_with_uniprot = {}
    bad_ref = []
    data = read_gpad_file(GPAD_FILE, nex_session, uniprot_to_date_assigned, 
    	   	          uniprot_to_sgdid_list, yes_goextension, yes_gosupport, 
			  new_pmids, dbentity_id_with_new_pmid, 
                          dbentity_id_with_uniprot, bad_ref)
    
    nex_session.close()

    # load the new data into the database
    fw.write(str(datetime.now()) + "\n")
    fw.write("loading the new data into the database...\n")
    [hasGoodAnnot, annotation_update_log] = load_new_data(data, source_to_id, annotation_type,
                                                          key_to_annotation, 
                                                          annotation_id_to_extensions, 
                                                          annotation_id_to_support_evidences, 
                                                          taxonomy_id, go_id_to_aspect, fw)
    
    ## uncomment out the following when it is ready
    fw.write(str(datetime.now()) + "\n")
    fw.write("deleting obsolete go_annotation entries...\n") 
    delete_obsolete_annotations(key_to_annotation, 
                                hasGoodAnnot, 
                                go_id_to_aspect,
                                annotation_update_log, 
                                source_to_id,
                                dbentity_id_with_new_pmid,
                                dbentity_id_with_uniprot,
                                fw)
    
    fw.write(str(datetime.now()) + "\n") 
    fw.write("writing summary and sending an email to curator about new pmids...\n")
    write_summary_and_send_email(annotation_update_log, new_pmids, bad_ref, fw)
    
    fw.close()


def load_new_data(data, source_to_id, annotation_type, key_to_annotation, annotation_id_to_extensions, annotation_id_to_support_evidences, taxonomy_id, go_id_to_aspect, fw):

    from src.sgd.model.nex.goannotation2 import Goannotation

    annotation_update_log = {}
    for count_name in ['annotation_updated', 'annotation_added', 'annotation_deleted',
                       'extension_added', 'extension_deleted', 'supportevidence_added',
                       'supportevidence_deleted']:
        annotation_update_log[('manually curated', count_name)] = 0
        annotation_update_log[('computational', count_name)] = 0
                        
    hasGoodAnnot = {}

    seen = {}
    key_to_annotation_id = {}
    annotation_id_to_extension = {}
    annotation_id_to_support = {}
    for x in data:
        if x['annotation_type'] != annotation_type:
            continue
        source_id = source_to_id.get(x['source'])
        if source_id is None:
            print "The source: ", x['source'], " is not in the SOURCE table."
            continue

        try:
            nex_session = get_nex_session()

            dbentity_id = x['dbentity_id']
            go_id = x['go_id']

            key = (dbentity_id, go_id, x['eco_id'], x['reference_id'], x['annotation_type'],
                   x['source'], x['go_qualifier'], taxonomy_id)

            if key in seen:
                if str(x) == str(seen[key]):
                    continue                
                annotation_id = key_to_annotation_id[key]
                if x.get('goextension') is not None:
                    if annotation_id in annotation_id_to_extension:
                        (goextension, date_created, created_by, annotation_type) = annotation_id_to_extension[annotation_id]
                        goextension = goextension + "|" + x['goextension']
                    else:
                        goextension = x['goextension']
                    annotation_id_to_extension[annotation_id] = (goextension, x['date_created'], x['created_by'], x['annotation_type'])
                if x.get('gosupport') is not None:
                    if annotation_id in annotation_id_to_support:
                        (gosupport, date_created, created_by, annotation_type) = annotation_id_to_support[annotation_id]
                        gosupport = gosupport + "|" + x['gosupport']
                    else:
                        gosupport = x['gosupport']
                    annotation_id_to_support[annotation_id] = (gosupport, x['date_created'], x['created_by'], x['annotation_type'])
                continue

            seen[key] = x

            annotation_id = None
    
            if key in key_to_annotation:
                
                print "KEY=", str(key), " is in the database"
 
                # remove the new key from the dictionary
                # and the rest can be deleted later
                thisAnnot = key_to_annotation.pop(key)
                annotation_id = thisAnnot.id
                ## this annotation is in the database, so update  
                ## the date_assigned if it is changed
                ## but no need to update created_by and date_created
                #####  date_assigned_in_db = str(getattr(thisAnnot, 'date_assigned'))
                date_assigned_in_db = thisAnnot.date_assigned
                if str(date_assigned_in_db) != str(x['date_assigned']):
                    fw.write("UPDATE GOANNOTATION: key=" + str(key) + " OLD date_assignedd=" + str(date_assigned_in_db) + ", NEW date_assigned=" + str(x['date_assigned']) + "\n")
                    nex_session.query(Goannotation).filter_by(id=thisAnnot.id).update({"date_assigned": x['date_assigned']})
                    # thisAnnot.date_assigned = x['date_assigned']
                    # nex_session.flush()
                    count_key = (x['annotation_type'], 'annotation_updated')
                    annotation_update_log[count_key] = annotation_update_log[count_key] + 1
            else:
                
                print "KEY=", str(key), " is a NEW ENTRY"

                fw.write("NEW GOANNOTATION: key=" + str(key) + "\n")
                thisAnnot = Goannotation(dbentity_id, 
                                         source_id, 
                                         taxonomy_id, 
                                         x['reference_id'], 
                                         go_id, 
                                         x['eco_id'], 
                                         x['annotation_type'], 
                                         x['go_qualifier'], 
                                         x['date_assigned'], 
                                         x['date_created'], 
                                         x['created_by'])
                nex_session.add(thisAnnot)
                nex_session.flush()
                annotation_id = thisAnnot.id
                count_key= (x['annotation_type'], 'annotation_added')
                annotation_update_log[count_key] = annotation_update_log[count_key] + 1

            nex_session.commit()

            key_to_annotation_id[key] = annotation_id
            if x.get('goextension') is not None:
                annotation_id_to_extension[annotation_id] = (x['goextension'], x['date_created'], x['created_by'], x['annotation_type'])
            if x.get('gosupport') is not None:
                annotation_id_to_support[annotation_id] = (x['gosupport'], x['date_created'], x['created_by'], x['annotation_type'])

            hasGoodAnnot[(dbentity_id, go_id_to_aspect[go_id])] = 1
        
        finally:
            nex_session.close()

    ## update goextension table

    print "Upadting GO extension data..."

    for annotation_id in annotation_id_to_extension:
        (goextension, date_created, created_by, annotation_type) = annotation_id_to_extension[annotation_id]
        update_goextension(annotation_id, goextension, annotation_id_to_extensions, 
                           date_created, created_by, annotation_type, 
                           annotation_update_log, fw)

    ## update gosupportingevidence table

    print "Updating GO supporting evidence data..."
    
    for annotation_id in annotation_id_to_support:
        (gosupport, date_created, created_by, annotation_type) = annotation_id_to_support[annotation_id]
        update_gosupportevidence(annotation_id, gosupport, annotation_id_to_support_evidences, 
                                 date_created, created_by, annotation_type, 
                                 annotation_update_log, fw)

    return [hasGoodAnnot, annotation_update_log]


def update_goextension(annotation_id, goextension, annotation_id_to_extensions, date_created, created_by, annotation_type, annotation_update_log, fw):

    from src.sgd.model.nex.goextension2 import Goextension

    nex_session = get_nex_session()

    key_to_extension = {}
    if annotation_id in annotation_id_to_extensions:
        key_to_extension = annotation_id_to_extensions[annotation_id]
   
    groups = goextension.split('|')
    seen_this_group = {}
    group_id = 0
    for group in groups:
        if group in seen_this_group:
            continue
        seen_this_group[group] = 1
        members = group.split(',')
        group_id = group_id + 1
        seen_this_member = {}
        for member in members:
            if member in seen_this_member:
                continue
            seen_this_member[member] = 1
            pieces = member.split('(')
            role = pieces[0].replace('_', ' ')
            ro_id = get_relation_to_ro_id(role)
            if ro_id is None:
                print role, " is not in RO table."
                continue
            dbxref_id = pieces[1][:-1]
            link = get_go_extension_link(dbxref_id)
            if link.startswith('Unknown'):
                print "unknown ID: ", dbxref_id
                continue
            key = (group_id, role, dbxref_id)
            if key in key_to_extension:
                
                print "GO extension ", key, " is in the database."

                key_to_extension.pop(key)
            else:

                print "NEW GO extension ", key
                
                thisExtension = Goextension(annotation_id,
                                            group_id,
                                            dbxref_id,
                                            link,
                                            ro_id,
                                            date_created,
                                            created_by)
                fw.write("NEW GOEXTENSION: key=" + str(key) + "\n")
                nex_session.add(thisExtension)
                key= (annotation_type, 'extension_added')
                annotation_update_log[key] = annotation_update_log[key] + 1
    to_be_deleted = key_to_extension.values()
    
    for row in to_be_deleted:

        print "DELETE GO extension: ", row.annotation_id, row.group_id, row.ro_id, row.dbxref_id  

        fw.write("DELETE GOEXTENSION: row=" + str(row) + "\n")
        nex_session.delete(row)
        key= (annotation_type, 'extension_deleted')
        annotation_update_log[key] = annotation_update_log[key] + 1
    nex_session.commit()    
    nex_session.close()


def update_gosupportevidence(annotation_id, gosupport, annotation_id_to_support_evidences, date_created, created_by, annotation_type, annotation_update_log, fw):

    from src.sgd.model.nex.gosupportingevidence2 import Gosupportingevidence

    nex_session = get_nex_session()

    key_to_support = {}
    if annotation_id in annotation_id_to_support_evidences:
        key_to_support = annotation_id_to_support_evidences[annotation_id]

    groups = gosupport.split('|')
    seen_this_group = {}
    group_id = 0
    for group in groups:
        if group in seen_this_group:
            continue
        seen_this_group[group] = 1
        if group.startswith('With:Not_supplied'):
            break
        dbxref_ids = group.split(',')
        group_id = group_id + 1
        seen_this_id = {}
        for dbxref_id in dbxref_ids:
            if dbxref_id in seen_this_id:
                continue
            seen_this_id[dbxref_id] = 1
            link = get_go_extension_link(dbxref_id)
            if link.startswith('Unknown'):
                print "Unknown ID: ", dbxref_id
                continue
            evidence_type = 'with'
            if dbxref_id.startswith('GO:'):
                evidence_type = 'from'
                        
            key = (group_id, evidence_type, dbxref_id)
    
            if key in key_to_support:
                
                print "GO supporting evidence ", key, " is in the database"

                key_to_support.pop(key)
            else:

                print "NEW GO supporting evidence ", key

                thisSupport = Gosupportingevidence(annotation_id,
                                                   group_id,
                                                   dbxref_id,
                                                   link,
                                                   evidence_type,
                                                   date_created,
                                                   created_by)

                fw.write("NEW GOSUPPORTINGEVIDENCE: key=" + str(key) + "\n")
                nex_session.add(thisSupport)
                key= (annotation_type, 'supportevidence_added')
                annotation_update_log[key] = annotation_update_log[key] + 1

    to_be_deleted = key_to_support.values()

    for row in to_be_deleted:

        print "DELETE GO supporting evidence ", row.annotation_id, row.group_id, row.evidence_type, row.dbxref_id

        fw.write("DELETE GOSUPPORTINGEVIDENCE: row=" + str(row) +"\n")
        nex_session.delete(row)
        key= (annotation_type, 'supportevidence_deleted')
        annotation_update_log[key] = annotation_update_log[key] + 1
    nex_session.commit()
    nex_session.close()

def all_go_extensions(nex_session):
    
    from src.sgd.model.nex.goextension2 import Goextension

    annotation_id_to_extensions = {}

    for x in nex_session.query(Goextension).all():
        key_to_extension = {}
        if x.annotation_id in annotation_id_to_extensions:
            key_to_extension = annotation_id_to_extensions[x.annotation_id]
        key = (x.group_id, x.role, x.dbxref_id) 
        key_to_extension[key] = x
        annotation_id_to_extensions[x.annotation_id] = key_to_extension
        
    return annotation_id_to_extensions


def all_go_support_evidences(nex_session):

    from src.sgd.model.nex.gosupportingevidence2 import Gosupportingevidence

    annotation_id_to_support_evidences = {}

    for x in nex_session.query(Gosupportingevidence).all():
        key_to_support_evidence = {}
        if x.annotation_id in annotation_id_to_support_evidences:
            key_to_support_evidence = annotation_id_to_support_evidences[x.annotation_id]
        key = (x.group_id, x.evidence_type, x.dbxref_id)
        key_to_support_evidence[key] =x
        annotation_id_to_support_evidences[x.annotation_id] = key_to_support_evidence

    return annotation_id_to_support_evidences


def all_go_annotations(nex_session, annotation_type):
    
    from src.sgd.model.nex.goannotation2 import Goannotation
    
    key_to_annotation = {}
    for x in nex_session.query(Goannotation).all():
        if (x.source.display_name == 'SGD' and x.annotation_type == 'manually curated' and annotation_type == 'manually curated') or (annotation_type == 'computational' and x.annotation_type=='computational'):
            key = (x.dbentity_id, x.go_id, x.eco_id, x.reference_id, x.annotation_type, x.source.display_name, x.go_qualifier, x.taxonomy_id)
            key_to_annotation[key] = x

    return key_to_annotation 


def delete_obsolete_annotations(key_to_annotation, hasGoodAnnot, go_id_to_aspect, annotation_update_log, source_to_id, dbentity_id_with_new_pmid, dbentity_id_with_uniprot, fw):

    nex_session = get_nex_session()

    from src.sgd.model.nex.eco import EcoAlias
    
    evidence_to_eco_id = dict([(x.display_name, x.eco_id) for x in nex_session.query(EcoAlias).all()])

    src_id = source_to_id['SGD']

    to_be_deleted = key_to_annotation.values()

    try:

        ## add check to see if there are any valid htp annotations..                                         

        from src.sgd.model.nex.goannotation2 import Goannotation

        for x in nex_session.query(Goannotation).filter_by(source_id=src_id).filter_by(annotation_type='high-throughput').all():
            hasGoodAnnot[(x.dbentity_id, go_id_to_aspect[x.go_id])] = 1

        ## delete the old ones -                                                                            
  
        for x in to_be_deleted:

            ## don't delete the annotations for the features with a pmid not in db yet 
            ## (so keep the old annotations for now) 
            if dbentity_id_with_new_pmid.get(x.dbentity_id) is not None:
                continue

            ## don't delete PAINT annotations (they are not in GPAD files yet)                              
            if x.source_id == source_to_id['GO_Central']:
                continue

            aspect = go_id_to_aspect[x.go_id]
            if x.eco_id == evidence_to_eco_id['ND'] and hasGoodAnnot.get((x.dbentity_id, aspect)) is None:
                ## still keep the ND annotation if there is no good annotation available yet 
                continue
            elif dbentity_id_with_uniprot.get(x.dbentity_id):
                ## don't want to delete the annotations that are not in GPAD file yet
                nex_session.delete(x)
                nex_session.commit()
                fw.write("DELETE GOANNOTATION: row=" + str(x) + "\n")
                key = (x.annotation_type, 'annotation_deleted')
                annotation_update_log[key] = annotation_update_log[key] + 1
    finally:
        nex_session.close()



def get_nex_session():

    from src.sgd.convert.util import prepare_schema_connection
    from src.sgd.convert import config
    from src.sgd.model import nex

    nex_session_maker = prepare_schema_connection(nex, config.NEX_DBTYPE, config.NEX_HOST, config.NEX_DBNAME, config.NEX_SCHEMA, config.NEX_DBUSER, config.NEX_DBPASS)

    return nex_session_maker()
                                             

def write_summary_and_send_email(annotation_update_log, new_pmids, bad_ref, fw):

## WORK FROM HERE

    summary = ''
    
    if len(new_pmids) > 0:
        summary = "The following Pubmed ID(s) are not in the oracle database. Please add them into the database so the missing annotations can be added @next run." + "\n" + ", ".join(new_pmids) + "\n\n"

    if len(bad_ref) > 0:
        summary = summary + "The following new GO_Reference(s) don't have a corresponding SGDID yet." + "\n" + ', '.join(bad_ref) + "\n"

    count_names = ['annotation_added', 'annotation_updated', 'annotation_deleted', 'extension_added', 'extension_deleted', 'supportevidence_added', 'supportevidence_deleted']

    for annotation_type in ['manually curated', 'computational']:
        header = annotation_type.title()
        summary = summary + "\n" + header + " annotations: \n\n"
        for count_name in count_names:
            key = (annotation_type, count_name)
            if annotation_update_log.get(key) is not None:
                if count_name.endswith('updated'):
                    words = count_name.replace('_', ' entries with date_assigned ')
                else:
                    words = count_name.replace('_', ' entries ')
                summary = summary + "In total " + str(annotation_update_log[key]) + " " + words + "\n"
    
    # summary = summary + "GO Annotation Summary updated this week:\n\n"

    # summary = summary + "Added: " + str(added) + "\n"
    # summary = summary + "Edited: " + str(edited) + "\n"
    # summary = summary + "Removed: " + str(deleted) + "\n"
        
    fw.write(summary)

    ## send email here
    
    # sendmail(email_subject, summary, email_receiver)

    print summary


if __name__ == "__main__":
    
    log_file = "src/sgd/convert/logs/GPAD_loading.log"
    
    if len(sys.argv) >= 2:
        annotation_type = sys.argv[1]
    else:
        annotation_type = "manually curated"

    # if annotation_type == "manually curated":
    #    source = 'SGD'
    # else:
    #    source = None

    load_go_annotations(annotation_type, log_file)


    
        
