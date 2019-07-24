import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Dbentity, Referencedbentity, Locusdbentity, LocusReference, ColleagueLocus, \
                   Colleague, Reservedname, Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_nex_session
from config import CREATED_BY

__author__ = 'sweng66'

file_to_load = "data/GeneNameReservationsColleagueForms081117.txt"
log_file = "logs/load_gene_registry.log"
created_by = 'STACIA'
reference_class = 'gene_name'

def load_data():
 
    nex_session = get_nex_session()

    bud_id_to_reference_id =  dict([(x.bud_id, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    name_to_locus_id =  dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    bud_id_to_colleague_id = dict([(x.bud_id, x.colleague_id) for x in nex_session.query(Colleague).all()])
    key_to_colleague_locus_id = dict([((x.colleague_id, x.locus_id), x.colleague_locus_id) for x in nex_session.query(ColleagueLocus).all()])

    sgd = nex_session.query(Source).filter_by(display_name='SGD').one_or_none()
    sgd_source_id = sgd.source_id
    direct = nex_session.query(Source).filter_by(display_name='Direct submission').one_or_none()
    direct_source_id = direct.source_id
    

    fw = open(log_file, "w")

    f = open(file_to_load)

    for line in f:
        pieces = line.strip().split("\t")
        gene_name = pieces[0].strip()
        name_desc = pieces[2].strip()
        if pieces[1] == 'ORF':
            continue
        locus_id = name_to_locus_id.get(pieces[1].strip())
        if locus_id is None:
            print("The ORF name: ", pieces[1], " is not in the database.")
            continue
        colleague_id = bud_id_to_colleague_id.get(int(pieces[3]))
        if colleague_id is None:
            print("The colleague bud_id:", pieces[3], " is not in the database.")
            continue
        reference_id = None
        if pieces[4]:
            if int(pieces[4]) in bud_id_to_reference_id:
                reference_id = bud_id_to_reference_id.get(int(pieces[4]))
            else:
                print("The reference bud_id:", pieces[4], " is not in the database.")
                continue
        else:
            print("NO reference_no provided.")
            print(line)
            continue

        [reserved_date, expired_date] = reformat_date(pieces[6])

        print(gene_name, locus_id, colleague_id, reference_id, reserved_date, expired_date, name_desc)        
        
        # update LOCUSDBENTITY
        nex_session.query(Locusdbentity).filter_by(dbentity_id=locus_id).update({"gene_name": gene_name, "name_description": name_desc})
        fw.write("Update LOCUSDBENTITY row for "+pieces[1]+": gene_name="+gene_name+", name_desc="+name_desc+"\n")

        # update DBENTITY

        nex_session.query(Dbentity).filter_by(dbentity_id=locus_id).update({"display_name": gene_name})

        fw.write("Update DBENTITY row for "+pieces[1]+": display_name="+gene_name+"\n")

        
        add_locus_reference(nex_session, fw, locus_id, reference_id, sgd_source_id)
    
        if (colleague_id, locus_id) not in key_to_colleague_locus_id:
            add_colleague_locus(nex_session, fw, locus_id, colleague_id, direct_source_id)
        
        add_reservedname(nex_session, fw, locus_id, gene_name, reference_id, colleague_id,
                         reserved_date, expired_date, direct_source_id)

    f.close()
    fw.close()

    # nex_session.rollback()
    nex_session.commit()

def add_reservedname(nex_session, fw, locus_id, gene_name, reference_id, colleague_id, reserved_date, expired_date, source_id):

    print(locus_id, gene_name, reference_id, colleague_id, reserved_date, expired_date, source_id)

    if reference_id is None:
        reference_id = ""

    x = Reservedname(format_name = gene_name,
                     display_name = gene_name,
                     obj_url = "/reservedname/"+gene_name,
                     source_id = source_id,
                     locus_id = locus_id,
                     reference_id = reference_id,
                     colleague_id = colleague_id,
                     reservation_date = reserved_date,
                     expiration_date = expired_date,
                     created_by = created_by)
    
    nex_session.add(x)

    fw.write("Add reservedname row for "+gene_name+"\n")
    
    
def add_colleague_locus(nex_session, fw, locus_id, colleague_id, source_id):
    
    print(locus_id, colleague_id, source_id)

    x = ColleagueLocus(locus_id = locus_id,
                       colleague_id = colleague_id,
                       source_id = source_id,
                       created_by = created_by)

    nex_session.add(x)

    fw.write("Add a new COLLEAGUE_LOCUS row:"+" locus_id="+str(locus_id)+", colleague_id="+str(colleague_id)+"\n") 


def add_locus_reference(nex_session, fw, locus_id, reference_id, source_id):
    
    print(locus_id, reference_id, source_id)

    x = LocusReference(locus_id = locus_id,
                       reference_id = reference_id,
                       reference_class = reference_class,
                       source_id = source_id,
                       created_by = created_by)
    nex_session.add(x)
    
    fw.write("Add a new LOCUS_REFERENCE row:"+" locus_id="+str(locus_id)+", reference_id="+str(reference_id)+"\n")
    
           
def reformat_date(this_date):

    if this_date == "":
        return

    dates = this_date.split(" ")[0].split("/")
    month = dates[0]
    if len(dates) <3:
        print("BAD DATE:", this_date)
        return [None, None]
    day= dates[1]
    year = dates[2]
    if len(year) == 2 and year.startswith('9'):
        year = "19" + year
    elif len(year) == 2 and (year.startswith('0') or year.startswith('1')):
        year = '20' + year
    elif len(year) == 2:
        print("WRONG YEAR")
        return [None, None]
    if len(month) == 1:
        month ="0" + month
    if len(day) == 1:
        day = "0" + day
    next_year = str(int(year) + 1)

    return [year + "-" + month + "-" + day, next_year + "-" + month + "-" + day]

    
if __name__ == '__main__':
    
    load_data()



