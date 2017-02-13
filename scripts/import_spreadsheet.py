from sqlalchemy import create_engine
import os

from ..src.models import DBSession, Base, Locus ##

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

def import_spreadsheet(filename):
#    file = open(filename, 'r')
    # DBSession.query(Locus).filter_by(dbentity=10).one_or_none() ... .all() 
    pass
    
