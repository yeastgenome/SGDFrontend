import logging
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Locusdbentity, Referencedbentity, Dbentity, LocusAlias, \
    LocusReferences, LocusAliasReferences, ArchLocuschange, Source, Locusnote, \
    LocusnoteReference
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

# CREATED_BY = os.environ['DEFAULT_USER']

def change_name(infile, logfile):

    nex_session = get_session()

    name_to_locus_id = dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    alias_name_to_id = dict([(x.display_name, x.alias_id) for x in nex_session.query(LocusAlias).filter_by(alias_type='Uniform').all()])
    # pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    sgd = nex_session.query(Source).filter_by(display_name='SGD').one_or_none()
    source_id = sgd.source_id

    fw = open(logfile, "w")    
    f = open(infile)

    for line in f:
        if line.startswith('ORF'):
            continue
        pieces = line.strip().split("\t")
        orf_name = pieces[0]
        old_gene_name = pieces[1]
        old_alias_name = pieces[2]
        name_desc = pieces[3].replace('"', '')
        date_created = pieces[4]
        created_by = pieces[5]

        locus_id = name_to_locus_id.get(orf_name)       
        if locus_id is None:
            print("The ORF name:", orf_name, " is not in the database.")
            continue

        old_alias_id = alias_name_to_id.get(old_alias_name)
        if old_alias_id is None:
            print("The alias_name: ", old_alias_name, " is not in the database.")
            continue

        reference_id_list_for_old_gene = []
        get_reference_ids_from_gene(nex_session, locus_id, 'gene_name', 
                                    reference_id_list_for_old_gene)
        get_reference_ids_from_gene(nex_session, locus_id, 'name_description', 
                                    reference_id_list_for_old_gene)

        reference_id_list_for_old_alias = []
        get_reference_ids_from_alias(nex_session, old_alias_id, 
                                     reference_id_list_for_old_alias)
        
        # 1. update dbentity.display_name = old alias_name in the file
        update_dbentity(nex_session, fw, locus_id, old_alias_name)
       
        # 2. update locusdbentity.gene_name = old_alias_name in the file 
        #    update locusdbentity.name_description = name_description in the file
        update_locusdbentity(nex_session, fw, locus_id, old_alias_name, name_desc)

        # 3. move old gene name to locus_alias table
        alias_id = insert_locus_alias(nex_session, fw, locus_id, old_gene_name, 
                                      "Uniform", source_id, date_created, created_by)

        # 4. add rows into locusalias_reference table for old gene name and its reference(s) 
        for reference_id in reference_id_list_for_old_gene:
            insert_locusalias_reference(nex_session, fw, alias_id, reference_id,
                                        source_id, date_created, created_by)

        # 5. remove rows from locus_alias table/locusalias_reference tables for 
        #    the old_alias name
        delete_locusalias_and_reference(nex_session, fw, old_alias_id, old_alias_name)    
    
        # 6. delete old locus_reference rows for this locus entry with reference_class 
        #    in ['gene_name', 'name_description'] 
        for x in nex_session.query(LocusReferences).filter_by(locus_id=locus_id).all():
            if x.reference_class in ['gene_name', 'name_description']:
                delete_locus_reference(nex_session, fw, locus_id, x.reference_id, x.reference_class)

        # 7. add rows to LOCUS_REFERENCE for the papers for old alias name where
        #    reference_class = 'gene_name' and 'name_description' 
        for reference_id in reference_id_list_for_old_alias:
            insert_locus_reference(nex_session, fw, locus_id, reference_id,
                                   'gene_name', source_id, created_by, date_created)
            if name_desc:
                insert_locus_reference(nex_session, fw, locus_id, reference_id,
                                       'name_description', source_id, created_by,
                                       date_created)

        # 8. Update ARCH_LOCUSCHANGE.date_name_standardized = date_standardized in the file
        #    for the given locus_id, with change_type = 'Gene name' and new_value = [NEW GENE NAME] 
        update_arch_locuschange(nex_session, fw, locus_id, old_alias_name, date_created)
                
        # 8. insert new note into locusnote table        
        # note_id = insert_locusnote(nex_session, fw, locus_id, old_alias_name, source_id, 
        #                           created_by, date_created)

        # 9. insert reference(s) into locusnote_reference
        # for reference_id in reference_id_list_for_old_alias:
        #    insert_locusnote_reference(nex_session, fw, note_id, reference_id, 
        #                               source_id, created_by, date_created)
        
    # nex_session.rollback()
    nex_session.commit()

    fw.close()
    f.close()

def delete_locusalias_and_reference(nex_session, fw, alias_id, alias_name):

    nex_session.query(LocusAliasReferences).filter_by(alias_id=alias_id).delete()
    nex_session.query(LocusAlias).filter_by(alias_id=alias_id).delete()

    fw.write("Alias row and reference(s) have been deleted from the database for alias_name="+alias_name+"\n")


def get_reference_ids_from_gene(nex_session, locus_id, reference_class, reference_id_list):

    for x in nex_session.query(LocusReferences).filter_by(locus_id=locus_id, reference_class=reference_class).all():
        if x.reference_id not in reference_id_list:
            reference_id_list.append(x.reference_id)

def get_reference_ids_from_alias(nex_session, alias_id, reference_id_list):
    
    for x in nex_session.query(LocusAliasReferences).filter_by(alias_id=alias_id).all():
        if x.reference_id not in reference_id_list:
            reference_id_list.append(x.reference_id)

def update_arch_locuschange(nex_session, fw, locus_id, gene_name, date_created):

    x = nex_session.query(ArchLocuschange).filter_by(dbentity_id=locus_id, change_type='Gene name', new_value=gene_name).one_or_none()
    if x is None:
        return
    x.date_name_standardized = date_created
    nex_session.add(x)

    fw.write("The date_name_standardized for dbentity_id = " + str(locus_id) + " and new_value=" + gene_name + " is set to: " + date_created + "\n")


def insert_locus_alias(nex_session, fw, locus_id, alias_name, alias_type, source_id, date_created, created_by):

    x = LocusAlias(locus_id = locus_id,
                   display_name = alias_name,
                   alias_type = alias_type,
                   has_external_id_section = '0',
                   source_id = source_id,
                   created_by = created_by,
                   date_created = date_created)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

    fw.write("Insert Locus_alias row for locus_id = " + str(locus_id) + ", alias_name = " + alias_name + ", created_by = " + created_by + ", date_created = " + date_created + "\n")

    return x.alias_id

def insert_locusalias_reference(nex_session, fw, alias_id, reference_id, source_id, date_created, created_by):
    
    x = LocusAliasReferences(alias_id = alias_id,
                             reference_id = reference_id,
                             source_id = source_id,
                             created_by = created_by,
                             date_created = date_created)

    nex_session.add(x)

    fw.write("Insert Locusalias_reference row for alias_id = " + str(alias_id) + ", reference_id = " + str(reference_id) + ", created_by = " +created_by + ", date_created = " + date_created + "\n")


def delete_locus_reference(nex_session, fw, locus_id, reference_id, reference_class):
    
    x = nex_session.query(LocusReferences).filter_by(locus_id=locus_id, reference_id=reference_id, reference_class=reference_class).one_or_none()

    nex_session.delete(x)

    fw.write("The locus_reference row for locus_id=" + str(locus_id) + ", reference_id=" + str(reference_id) + ", and reference_class=" + reference_class + " has been deleted\n")
    

def insert_locusnote(nex_session, fw, locus_id, gene_name, source_id, created_by, date_created):

    x = Locusnote(locus_id = locus_id,
                  note_class = 'Locus',
                  note_type = 'Name',
                  note = '<b>Name:</b> ' + gene_name,
                  source_id = source_id,
                  created_by = created_by,
                  date_created = date_created)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    
    fw.write("Insert Locusnote row for locus_id = " + str(locus_id) + ", gene_name = " + gene_name + ", created_by = " + created_by + ", date_created = " + date_created + "\n")

    return x.note_id


def insert_locusnote_reference(nex_session, fw, note_id, reference_id, source_id, created_by, date_created):
    
    x = LocusnoteReference(note_id = note_id,
                           reference_id = reference_id,
                           source_id = source_id,
                           created_by = created_by,
                           date_created = date_created)

    nex_session.add(x)

    fw.write("Insert Locusnote_reference row for note_id = " + str(note_id) + ", reference_id = " + str(reference_id) + ", created_by = " + created_by + ", date_created = " + date_created + "\n")


def insert_locus_reference(nex_session, fw, locus_id, reference_id, reference_class, source_id, created_by, date_created):
    
    x = LocusReferences(locus_id = locus_id,
                        reference_id = reference_id,
                        reference_class = reference_class,
                        source_id = source_id,
                        created_by = created_by,
                        date_created = date_created)

    nex_session.add(x)

    fw.write("Insert Locus_reference row for locus_id = " + str(locus_id) + ", reference_id = " + str(reference_id) + ", reference_class = " + reference_class + ", created_by = " + created_by + ", date_created = " + date_created + "\n")
 

def update_locusdbentity(nex_session, fw, locus_id, gene_name, name_desc):

    x = nex_session.query(Locusdbentity).filter_by(dbentity_id=locus_id).one_or_none()
    if x is None:
        return
    x.gene_name = gene_name
    if name_desc:
        x.name_description = name_desc
    nex_session.add(x)

    fw.write("Update locusdbentity.gene_name for dbentity_id=" + str(locus_id) + " to: " + gene_name + "\n")
    if name_desc:
        fw.write("Update locusdbentity.name_description for dbentity_id=" + str(locus_id) + " to: " + name_desc + "\n")


def update_dbentity(nex_session, fw, locus_id, gene_name):
    
    x = nex_session.query(Dbentity).filter_by(dbentity_id=locus_id).one_or_none()
    if x is None:
        return
    x.display_name = gene_name
    nex_session.add(x)

    fw.write("Update dbentity.display_name for dbentity_id=" + str(locus_id) + " to: " + gene_name + "\n")


if __name__ == '__main__':

    infile = None
    if len(sys.argv) >= 2:
         infile = sys.argv[1]
    else:
        print("Usage:         python switchGeneAliasName.py datafile")
        print("Usage example: python switchGeneAliasName.py scripts/loading/locus/data/change_std_name-02152018.txt")
        exit()
    
    logfile = "scripts/loading/locus/logs/switchGeneAliasName.log"
    
    change_name(infile, logfile)
                                                  
