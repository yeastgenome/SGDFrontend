import sys
from src.models import LocusAlias, Locusdbentity, Source
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

data_file = "scripts/loading/locus/data/tRNA_to_product_name.lst"

def load_data():
    
    nex_session = get_session()

    name_to_locus_id = dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id


    f = open(data_file)
    for line in f:
        pieces = line.strip().split(" ")
        name = pieces[0]
        locus_id = name_to_locus_id.get(name)
        product_name = " ".join(pieces[1:])
        insert_into_database(nex_session, source_id, locus_id, product_name)

    f.close()

def insert_into_database(nex_session, source_id, locus_id, product_name):
    
    print (source_id, locus_id, product_name)

    x = LocusAlias(locus_id=locus_id,
                   source_id=source_id,
                   display_name=product_name,
                   has_external_id_section='0',
                   alias_type='NCBI protein name',
                   created_by='STACIA')
                           
    nex_session.add(x)
    nex_session.commit()
        
if __name__ == "__main__":

    load_data()
    
