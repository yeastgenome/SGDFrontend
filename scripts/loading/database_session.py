from util import prepare_schema_connection
import config

__author__ = 'sweng66'

def get_qa_session(DBUSER=config.NEX_DBUSER):

    nex_session_maker = prepare_schema_connection(config.NEX_DBTYPE, config.MASTER_QA_HOST, config.NEX_DBNAME, config.NEX_SCHEMA, DBUSER, config.NEX_DBPASS)

    return nex_session_maker()

def get_dev_session(DBUSER=config.NEX_DBUSER):

    nex_session_maker = prepare_schema_connection(config.NEX_DBTYPE, config.CURATE_QA_HOST, config.NEX_DBNAME, config.NEX_SCHEMA, DBUSER, config.NEX_DBPASS)

    return nex_session_maker()

def get_nex_session(DBUSER=config.NEX_DBUSER):

    nex_session_maker = prepare_schema_connection(config.NEX_DBTYPE, config.NEX_HOST, config.NEX_DBNAME, config.NEX_SCHEMA, DBUSER, config.NEX_DBPASS)

    return nex_session_maker()    
