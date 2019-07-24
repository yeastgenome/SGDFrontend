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
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    sgd = nex_session.query(Source).filter_by(display_name='SGD').one_or_none()
    source_id = sgd.source_id

    fw = open(logfile, "w")    
    f = open(infile)

    for line in f:
        if line.startswith('ORF'):
            continue
        pieces = line.strip().split("\t")
        orf_name = pieces[0]
        alias_name = pieces[1]
        alias_type = pieces[2]
        pmid = int(pieces[3])
        date_created = pieces[4]
        created_by = pieces[5]

        locus_id = name_to_locus_id.get(orf_name)       
        if locus_id is None:
            print("The ORF name:", orf_name, " is not in the database.")
            continue

        reference_id = pmid_to_reference_id.get(pmid)
        if reference_id is None:
            print("The PMID:", pmid, " is not in the database.")
            continue

        alias_id = insert_locus_alias(nex_session, fw, locus_id, alias_name, 
                                      alias_type, source_id, date_created, created_by)

        insert_locusalias_reference(nex_session, fw, alias_id, reference_id,
                                    source_id, date_created, created_by)

        note_id = insert_locusnote(nex_session, fw, locus_id, alias_name, source_id,                                                   
                                   created_by, date_created)                                                                                
    
        insert_locusnote_reference(nex_session, fw, note_id, reference_id,                                                              
                                   source_id, created_by, date_created)      
        
    # nex_session.rollback()
    nex_session.commit()

    fw.close()
    f.close()


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



if __name__ == '__main__':

    infile = None
    if len(sys.argv) >= 2:
         infile = sys.argv[1]
    else:
        print("Usage:         python addAliasName.py datafile")
        print("Usage example: python addAliasName.py scripts/loading/locus/data/addAliasName080718.txt")
        exit()
    
    logfile = "scripts/loading/locus/logs/addAliasName.log"
    
    change_name(infile, logfile)
                                                  
