import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

__author__ = 'sweng66'

def get_session():

    engine = create_engine(os.environ['NEX2_URI'])
    session_maker = sessionmaker(bind=engine)
    return session_maker()

