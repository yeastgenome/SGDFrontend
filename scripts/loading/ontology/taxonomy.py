import urllib.request, urllib.parse, urllib.error
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Source, Taxonomy, TaxonomyUrl, TaxonomyAlia, TaxonomyRelation, Ro
from scripts.loading.database_session import get_session
from scripts.loading.ontology import children_for_taxonomy_ancestor, read_owl
from scripts.loading.database_session import get_session
                 
__author__ = 'sweng66'

## Created on May 2017
## This script is used to update TAXONOMY ontology in NEX2.

# ontology_file = 'data/ncbitaxon.owl'
log_file = 'scripts/loading/ontology/logs/taxonomy.log'
ontology = 'TAXONOMY'
src = 'NCBI'
ancestor = 'NCBITaxon:4893'
alias_type = 'Synonym'

CREATED_BY = os.environ['DEFAULT_USER']

def load_ontology(ontology_file):

    nex_session = get_session()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    taxid_to_taxonomy =  dict([(x.taxid, x) for x in nex_session.query(Taxonomy).all()])
    term_to_ro_id = dict([(x.display_name, x.ro_id) for x in nex_session.query(Ro).all()])
    
    taxonomy_id_to_alias = {}
    for x in nex_session.query(TaxonomyAlia).all():
        aliases = []
        if x.taxonomy_id in taxonomy_id_to_alias:
            aliases = taxonomy_id_to_alias[x.taxonomy_id]
        aliases.append((x.display_name, x.alias_type))
        taxonomy_id_to_alias[x.taxonomy_id] = aliases

    taxonomy_id_to_parent = {}
    for x in nex_session.query(TaxonomyRelation).all():
        parents = []
        if x.child_id in taxonomy_id_to_parent:
            parents = taxonomy_id_to_parent[x.child_id]
        parents.append(x.parent_id)
        taxonomy_id_to_parent[x.child_id] = parents


    ####################################
    fw = open(log_file, "w")
    
    [filtered_set, id_to_rank] = children_for_taxonomy_ancestor(ontology_file,
                                                                ancestor)

    ## total 1037 in the filtered set 
    ## print "COUNT=", len(filtered_set)  
    
    data = read_owl(ontology_file, ontology)
    
    [update_log, to_delete_list] = load_new_data(nex_session, data, 
                                                 source_to_id, 
                                                 taxid_to_taxonomy, 
                                                 term_to_ro_id['is a'],
                                                 taxonomy_id_to_alias,
                                                 taxonomy_id_to_parent,
                                                 filtered_set,
                                                 id_to_rank,
                                                 fw)
    
    write_summary_and_send_email(fw, update_log, to_delete_list)
    
    nex_session.close()

    fw.close()


def load_new_data(nex_session, data, source_to_id, taxid_to_taxonomy, ro_id, taxonomy_id_to_alias, taxonomy_id_to_parent, filtered_set, id_to_rank, fw):

    active_taxid = []
    update_log = {}
    for count_name in ['updated', 'added', 'deleted']:
        update_log[count_name] = 0

    relation_just_added = {}
    alias_just_added = {}
    for x in data:
        if x['id'] not in filtered_set:
            continue
        rank = id_to_rank.get(x['id'])
        if rank is None:
            rank = "no rank"
        taxonomy_id = None
        taxid = x['id'].replace("NCBITaxon", "TAX")
        if taxid in taxid_to_taxonomy:
            ## in database
            y = taxid_to_taxonomy[taxid]
            taxonomy_id = y.taxonomy_id
            if y.is_obsolete is True:
                y.is_obsolete = '0'
                nex_session.add(y)
                nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                fw.write("The is_obsolete for " + taxid + " has been updated from " + y.is_obsolete + " to " + 'False' + "\n")
            if x['term'] != y.display_name.strip():
                ## update term
                fw.write("The display_name for " + taxid + " has been updated from " + y.display_name + " to " + x['term'] + "\n")
                y.display_name = x['term']
                # nex_session.add(y)
                # nex_session.flush()
                update_log['updated'] = update_log['updated'] + 1
                print("UPDATED: ", y.taxid, y.display_name, x['term'])
            # else:
            #    print "SAME: ", taxid, y.display_name, x['aliases'], x['parents']
            active_taxid.append(taxid)
        else:
            fw.write("NEW entry = " + taxid + " " + x['term'] + "\n")
            format_name = x['term'].replace(" ", "_")
            this_x = Taxonomy(source_id = source_to_id[src],
                              format_name = format_name,
                              taxid = taxid,
                              display_name = x['term'],
                              rank = rank,
                              obj_url = '/taxonomy/' + format_name,
                              is_obsolete = '0',
                              created_by = CREATED_BY)
            nex_session.add(this_x)
            nex_session.flush()
            taxonomy_id = this_x.taxonomy_id
            update_log['added'] = update_log['added'] + 1
            print("NEW: ", taxid, x['term'])

            ## add three URLs
            link_id =taxid.split(':')[1]
            insert_url(nex_session, source_to_id[src], 'NCBI Taxonomy', taxonomy_id, 
                       'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' + link_id, 
                       fw)
            
            ## add RELATIONS
            for parent_taxid in x['parents']:
                parent_taxid = parent_taxid.replace("NCBITaxon", "TAX")
                parent = taxid_to_taxonomy.get(parent_taxid)
                if parent is not None:
                    parent_id = parent.taxonomy_id
                    child_id = taxonomy_id
                    insert_relation(nex_session, source_to_id[src], parent_id, 
                                    child_id, ro_id, relation_just_added, fw)
            
            ## add ALIASES
            for (alias, type) in x['aliases']:
                insert_alias(nex_session, source_to_id[src], alias, 
                             alias_type, taxonomy_id, alias_just_added, fw)

        ## update RELATIONS
        # print taxid, "RELATION", taxonomy_id_to_parent.get(taxonomy_id), x['parents']

        update_relations(nex_session, taxonomy_id, 
                         taxonomy_id_to_parent.get(taxonomy_id), 
                         x['parents'], source_to_id[src], 
                         taxid_to_taxonomy, ro_id, relation_just_added, fw)
                    
        ## update ALIASES
        # print taxid, "ALIAS", taxonomy_id_to_alias.get(taxonomy_id), x['aliases']

        update_aliases(nex_session, taxonomy_id, 
                       taxonomy_id_to_alias.get(taxonomy_id), 
                       x['aliases'], source_to_id[src], 
                       taxid_to_taxonomy, alias_just_added, fw)
    
    to_delete = []
    for taxid in taxid_to_taxonomy:
        if taxid in active_taxid:
            continue
        x = taxid_to_taxonomy[taxid]
        if taxid.startswith('NTR'):
            continue
        to_delete.append((taxid, x.display_name))
        if x.is_obsolete is False:
            x.is_obsolete = '1'
            nex_session.add(x)
            nex_session.flush()
            update_log['updated'] = update_log['updated'] + 1
            fw.write("The is_obsolete for " + x.taxid + " has been updated from " + x.is_obsolete +" to " + 'True' + "\n")

    nex_session.commit()
 
    return [update_log, to_delete]


def update_aliases(nex_session, taxonomy_id, curr_aliases, new_aliases, source_id, taxid_to_taxonomy, alias_just_added, fw):

    # print "ALIAS: ", curr_aliases, new_aliases
    # return

    if curr_aliases is None:
        curr_aliases = []
     
    ## force to use alias_type = 'Synonym' =(
    new_alias_list = []
    for (alias, type) in new_aliases:
        new_alias_list.append((alias, alias_type))
        if (alias, alias_type) not in curr_aliases:
            insert_alias(nex_session, source_id, alias, alias_type, taxonomy_id, alias_just_added, fw)

    for (alias, type) in curr_aliases:
        if (alias, type) not in new_alias_list:
            ## remove the old one                                                             
            to_delete = nex_session.query(TaxonomyAlia).filter_by(taxonomy_id=taxonomy_id, display_name=alias, alias_type=type).first()
            nex_session.delete(to_delete) 
            fw.write("The old alias = " + alias + " has been deleted for taxonomy_id = " + str(taxonomy_id) + "\n")
             

def update_relations(nex_session, child_id, curr_parent_ids, new_parents, source_id, taxid_to_taxonomy, ro_id, relation_just_added, fw):

    # print "RELATION: ", curr_parent_ids, new_parents
    # return 

    if curr_parent_ids is None:
        curr_parent_ids = []
    
    new_parent_ids = []
    for parent_taxid in new_parents:
        parent_taxid = parent_taxid.replace("NCBITaxon", "TAX")
        parent = taxid_to_taxonomy.get(parent_taxid)
        if parent is not None:
            parent_id = parent.taxonomy_id
            new_parent_ids.append(parent_id)
            if parent_id not in curr_parent_ids:
                insert_relation(nex_session, source_id, parent_id, child_id, 
                                ro_id, relation_just_added, fw)

    for parent_id in curr_parent_ids:
        if parent_id not in new_parent_ids:
            ## remove the old one
            to_delete = nex_session.query(TaxonomyRelation).filter_by(child_id=child_id, parent_id=parent_id).first()
            nex_session.delete(to_delete)
            fw.write("The old parent: parent_id = " + str(parent_id) + " has been deleted for taxonomy_id = " + str(child_id)+ "\n")

def insert_url(nex_session, source_id, display_name, taxonomy_id, url, fw, url_type=None):
    
    # print url
    # return

    if url_type is None:
        url_type = display_name

    x = TaxonomyUrl(display_name = display_name,
                    url_type = url_type,
                    source_id = source_id,
                    taxonomy_id = taxonomy_id,
                    obj_url = url,
                    created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new URL: " + url + " for taxonomy_id = " + str(taxonomy_id) + "\n")
    

def insert_alias(nex_session, source_id, display_name, alias_type, taxonomy_id, alias_just_added, fw):

    # print display_name
    # return

    if (taxonomy_id, display_name, alias_type) in alias_just_added:
        return

    alias_just_added[(taxonomy_id, display_name, alias_type)] = 1

    x = TaxonomyAlia(display_name = display_name,
                      alias_type = alias_type,
                      source_id = source_id,
                      taxonomy_id = taxonomy_id,
                      created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new ALIAS: " + display_name + " for taxonomy_id = " + str(taxonomy_id) + "\n")


def insert_relation(nex_session, source_id, parent_id, child_id, ro_id, relation_just_added, fw):
    
    # print "PARENT/CHILD: ", parent_id, child_id
    # return

    if (parent_id, child_id) in relation_just_added:
        return

    relation_just_added[(parent_id, child_id)] = 1

    x = TaxonomyRelation(parent_id = parent_id,
                         child_id = child_id,
                         source_id = source_id,
                         ro_id = ro_id,
                         created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    fw.write("Added new PARENT: parent_id = " + str(parent_id) + " for taxonomy_id = " + str(child_id) + "\n")
    

def write_summary_and_send_email(fw, update_log, to_delete_list):

    summary = "Updated: " + str(update_log['updated'])+ "\n"
    summary = summary + "Added: " + str(update_log['added']) + "\n"
    if len(to_delete_list) > 0:
        summary = summary + "The following TAXONOMY terms are not in the current release:\n"
        for (taxid, term) in to_delete_list:
            summary = summary + "\t" + taxid + " " + term + "\n"
                                          
    fw.write(summary)
    print(summary)


if __name__ == "__main__":
            
    url_path = 'http://purl.obolibrary.org/obo/'
    owl_file = 'ncbitaxon.owl'
    urllib.request.urlretrieve(url_path + owl_file, owl_file)

    load_ontology(owl_file)


    
        
