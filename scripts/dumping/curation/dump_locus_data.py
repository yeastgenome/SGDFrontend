from src.models import Dbentity, Locusdbentity
from scripts.loading.database_session import get_session

__author__ = 'sweng66'


datafile = "scripts/dumping/curation/data/locus.txt"

def dump_data():
 
    nex_session = get_session()

    dbentity_id_to_sgdid = dict([(x.dbentity_id, x.sgdid) for x in nex_session.query(Dbentity).filter_by(subclass='LOCUS').all()])

    fw = open(datafile, "w")

    for x in nex_session.query(Locusdbentity).all():
        if x.dbentity_id not in dbentity_id_to_sgdid:
            continue
        # if "_" in x.systematic_name and x.headline is None:
        #    continue
        gene_name = x.gene_name
        if gene_name is None:
            gene_name = ""
        headline = x.headline
        if headline is None:
            headline = ""
        fw.write(x.systematic_name + "\t" + gene_name + "\t" +  dbentity_id_to_sgdid[x.dbentity_id] + "\t" + headline + "\n")
       
    fw.close()

    nex_session.close()


if __name__ == '__main__':
    
    dump_data()

    


