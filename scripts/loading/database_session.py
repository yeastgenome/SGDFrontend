from util import prepare_schema_connection
import config

__author__ = 'sweng66'

def get_dev_session():

    nex_session_maker = prepare_schema_connection(config.DEV_DBTYPE, config.DEV_HOST, config.DEV_DBNAME, config.DEV_SCHEMA, config.DEV_DBUSER, config.DEV_DBPASS)

    return nex_session_maker()

def get_nex_session():

    nex_session_maker = prepare_schema_connection(config.NEX_DBTYPE, config.NEX_HOST, config.NEX_DBNAME, config.NEX_SCHEMA, config.NEX_DBUSER, config.NEX_DBPASS)

    return nex_session_maker()    
