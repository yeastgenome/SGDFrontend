import sys
sys.path.insert(0, '../../../src/')
from models import ArchLocuschange, Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_arch_locuschange.log"
change_type = 'Gene name'
files_to_load = ["data/nex2-genename_dates-toload.txt"]

def load_data():
    
    nex_session = get_session()

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id
    
    key_to_id = {}
    for x in nex_session.query(ArchLocuschange).all():
        old_value = ""
        if x.old_value is not None:
            old_value = x.old_value
        key = (x.dbentity_id, x.change_type, old_value, x.new_value, x.date_added_to_database)
        key_to_id[key] = x.archive_id

    fw = open(log_file, "w")
    
    for file in files_to_load:

        f = open(file)

        for line in f:

            if line.startswith('dbentity_id'):
                continue
            pieces = line.strip().split("\t")
            if len(pieces) < 9:
                print("Unknown line: ", line)
                continue
            date_added_to_database = reformat_date(pieces[5].strip())
            date_standardized = reformat_date(pieces[7].strip())
            date_archived = reformat_date(pieces[8].strip())
            
            # key = (int(pieces[0].strip()), change_type, pieces[3].strip(), pieces[4].strip(), date_added_to_database)
            # if key in key_to_id:
            #    print "In database: ", key
            #    continue

            insert_into_database(nex_session, fw, int(pieces[0].strip()), source_id, int(pieces[1].strip()), 
                                 pieces[3].strip(), pieces[4].strip(), date_added_to_database, pieces[6].strip(), 
                                 date_archived, date_standardized), 


        f.close()

    fw.close()
    

def insert_into_database(nex_session, fw, dbentity_id, source_id, bud_id, old_value, new_value, date_added_to_database, added_by, date_archived, date_name_standardized):
    
    # print dbentity_id, source_id, bud_id, old_value, new_value, date_added_to_database, added_by, date_archived, date_name_standardized
    
    x = None
    if old_value and date_name_standardized:
        print("CASE1:", dbentity_id, source_id, bud_id, old_value, new_value, date_added_to_database, added_by, date_archived, date_name_standardized) 
        x = ArchLocuschange(dbentity_id = dbentity_id,
                            source_id = source_id,
                            bud_id = bud_id,
                            change_type = change_type,
                            old_value = old_value,
                            new_value = new_value,
                            date_added_to_database = date_added_to_database,
                            added_by = added_by,
                            date_archived = date_archived,
                            date_name_standardized = date_name_standardized)
    elif old_value and date_name_standardized is None:
        print("CASE2:", dbentity_id, source_id, bud_id, old_value, new_value, date_added_to_database, added_by, date_archived, date_name_standardized) 
        x = ArchLocuschange(dbentity_id = dbentity_id,
                            source_id = source_id,
                            bud_id = bud_id,
                            change_type = change_type,
                            old_value = old_value,
                            new_value = new_value,
                            date_added_to_database = date_added_to_database,
                            added_by = added_by,
                            date_archived = date_archived)
    elif old_value == "" and date_name_standardized:
        print("CASE3:", dbentity_id, source_id, bud_id, old_value, new_value, date_added_to_database, added_by, date_archived, date_name_standardized)
        x = ArchLocuschange(dbentity_id = dbentity_id,
                            source_id = source_id,
                            bud_id = bud_id,
                            change_type = change_type,
                            new_value = new_value,
                            date_added_to_database = date_added_to_database,
                            added_by = added_by,
                            date_archived = date_archived,
                            date_name_standardized = date_name_standardized)
    else:
        print("CASE4:", dbentity_id, source_id, bud_id, old_value, new_value, date_added_to_database, added_by, date_archived, date_name_standardized)
        x = ArchLocuschange(dbentity_id = dbentity_id,
                            source_id = source_id,
                            bud_id = bud_id,
                            change_type = change_type,
                            new_value = new_value,
                            date_added_to_database = date_added_to_database,
                            added_by = added_by,
                            date_archived = date_archived)
    nex_session.add(x)
    nex_session.commit()
    
    fw.write("insert arch_locuschange for dbentity_id=" + str(dbentity_id) + "\n")
    

def reformat_date(this_date):

    if this_date == "":
        return

    dates = this_date.split(" ")[0].split("/")
    month = dates[0]
    if len(dates) <3:
        print("BAD DATE:", this_date)
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

if __name__ == "__main__":

    load_data()
    
