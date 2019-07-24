import logging
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Locusdbentity, Referencedbentity, Reservedname, Source, Locusnote, \
                       LocusReferences, LocusnoteReference
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

# CREATED_BY = os.environ['DEFAULT_USER']

def load_data(infile, logfile):

    nex_session = get_session()

    name_to_locus_id = dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    citation_to_reference_id = dict([(x.citation, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    sgd = nex_session.query(Source).filter_by(display_name='SGD').one_or_none()
    source_id = sgd.source_id
    
    fw = open(logfile, "w")    
    f = open(infile)

    for line in f:
        pieces = line.strip().split("\t")
        if pieces[0] == 'feature_name':
            continue
        locus_id = name_to_locus_id[pieces[0]]
        display_name = pieces[1]

        colleague_id = None
        if pieces[2]:
            colleague_id = int(pieces[2])
        reference_id = None
        if pieces[3]:
            reference_id = citation_to_reference_id.get(pieces[3].replace('"', ''))
        if reference_id is None:
            print("No citation provided or the citation is not in the database:", pieces[3])
            continue
        reservation_date = reformat_date(pieces[4])
        expiration_date = reformat_date(pieces[5])
        name_description = pieces[6].replace('"', '')
        created_by = pieces[7]

        insert_reservedname(nex_session, fw, locus_id, display_name, reference_id, colleague_id, 
                            source_id, reservation_date, expiration_date, name_description, created_by)

        if name_description:
            insert_locus_reference(nex_session, fw, locus_id, reference_id, source_id, reservation_date, created_by)

        note_id = insert_locusnote(nex_session, fw, locus_id, display_name, source_id, reservation_date, created_by)

        insert_locusnote_reference(nex_session, fw, note_id, reference_id, source_id, reservation_date, created_by)

    # nex_session.rollback()
    nex_session.commit()

    fw.close()
    f.close()


def insert_locus_reference(nex_session, fw, locus_id, reference_id, source_id, date_created, created_by):

    x = LocusReferences(locus_id = locus_id,
                        reference_id = reference_id,
                        reference_class = 'name_description',
                        source_id = source_id,
                        date_created = date_created,
                        created_by = created_by)
    nex_session.add(x)

    fw.write("Insert Locus_reference row for locus_id = " + str(locus_id) + ", reference_id = " + str(reference_id\
) + ", created_by = " + created_by + ", date_created = " + date_created + "\n")
           

def insert_locusnote_reference(nex_session, fw, note_id, reference_id, source_id, date_created, created_by):

    x = LocusnoteReference(note_id = note_id,
                           reference_id = reference_id,
                           source_id = source_id,
                           created_by = created_by,
                           date_created = date_created)
    nex_session.add(x)

    fw.write("Insert Locusnote_reference row for note_id = " + str(note_id) + ", reference_id = " + str(reference_id) + ", created_by = " + created_by + ", date_created = " + date_created + "\n")


def insert_locusnote(nex_session, fw, locus_id, display_name, source_id, date_created, created_by):

    x = Locusnote(source_id = source_id,
                  locus_id = locus_id,
                  note_class = 'Locus',
                  note_type = 'Name',
                  note = "<b>Name:</b> " + display_name,
                  date_created = date_created,
                  created_by = created_by)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    
    fw.write("Insert a new locusnote for locus_id=" + str(locus_id) + "\n")
    
    return x.note_id


def insert_reservedname(nex_session, fw, locus_id, display_name, reference_id, colleague_id, source_id, reservation_date, expiration_date, name_description, created_by):

    # print locus_id, display_name, reference_id, colleague_id, source_id, reservation_date, expiration_date, name_description, created_by
    
    x = Reservedname(format_name = display_name,
                     display_name = display_name,
                     obj_url = '/reservedname/' + display_name,
                     source_id = source_id,
                     locus_id = locus_id,
                     reference_id = reference_id,
                     colleague_id = colleague_id,
                     reservation_date = reservation_date, 
                     expiration_date = expiration_date,
                     name_description = name_description,
                     created_by = created_by,
                     date_created = reservation_date)

    nex_session.add(x)

    fw.write("Insert reservedname row for gene_name = " + display_name + ", locus_id = " + str(locus_id) + ", reference_id = " + str(reference_id) + ", colleague_id = " + str(colleague_id) + ", reservation_date = " + reservation_date + ", expiration_date = " + expiration_date + ", created_by = " + created_by + ", date_created = " + reservation_date + "\n")
 
def reformat_date(this_date):

    if this_date == "":
        return

    if "-" in this_date:
        return this_date

    dates = this_date.split("/")
    if len(dates) <3:
        print("BAD DATE:", this_date)
        return
    month = dates[0]
    day= dates[1]
    year = dates[2]
    if len(year) == 2 and year.startswith('9'):
        year = "19" + year
    elif len(year) == 2 and (year.startswith('0') or year.startswith('1')):
        year = '20' + year
    elif len(year) == 2:
        print("WRONG YEAR")
        return 
    if len(month) == 1:
        month ="0" + month
    if len(day) == 1:
        day = "0" + day

    return year + "-" + month + "-" + day


if __name__ == '__main__':

    infile = None
    if len(sys.argv) >= 2:
         infile = sys.argv[1]
    else:
        print("Usage:         python loadGeneRegistries.py datafile")
        print("Usage example: python loadGeneRegistries.py scripts/loading/locus/data/geneRegistries-2018-01-10.txt")
        exit()
    
    logfile = "scripts/loading/locus/logs/loadGeneRegistries.log"
    
    load_data(infile, logfile)
                                                  
