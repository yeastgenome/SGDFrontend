from sqlalchemy import create_engine
import os
import sys

sys.path.insert(0, '../src/')

from models import DBSession, Base, Locusdbentity ##

import pdb; pdb.set_trace()
engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

loci = DBSession.query(Locusdbentity).filter_by(dbentity_id=10).all() 

print loci

exit

# def import_spreadsheet(filename):
#    file = open(filename, 'r')
#    # DBSession.query(Locus).filter_by(dbentity=10).one_or_none() ... .all() 
#    pass
    
