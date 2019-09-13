import sys
from src.models import LocusAlias, Source
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

data_file = "scripts/loading/locus/data/locus_id_to_protein_name.lst"

def load_data():
    
    nex_session = get_session()

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id

    f = open(data_file)
    for line in f:
        if line.startswith('dbentity_id'):
            continue
        pieces = line.strip().split(" ")
        locus_id = int(pieces[0])
        protein_name = " ".join(pieces[4:])

        insert_into_database(nex_session, source_id, locus_id, protein_name)

    f.close()

def insert_into_database(nex_session, source_id, locus_id, protein_name):
    
    print (source_id, locus_id, protein_name)

    x = LocusAlias(locus_id=locus_id,
                   source_id=source_id,
                   display_name=protein_name,
                   has_external_id_section='0',
                   alias_type='NCBI protein name',
                   created_by='STACIA')
                           
    nex_session.add(x)
    nex_session.commit()
        
if __name__ == "__main__":

    load_data()
    
