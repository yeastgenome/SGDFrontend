from sqlalchemy import create_engine
import os
import sys

sys.path.insert(0, '../src/')

from models import DBSession, Base, Locusdbentity ##

engine = create_engine("postgresql://otto:db4auto@54.70.240.102:5432/sgd", pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

loci = DBSession.query(Locusdbentity).filter_by(dbentity_id=1266440).all() 

print loci[0].display_name

exit

# def import_spreadsheet(filename):
#    file = open(filename, 'r')
#    # DBSession.query(Locus).filter_by(dbentity=10).one_or_none() ... .all() 
#    pass
    
