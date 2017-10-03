from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
from elasticsearch import Elasticsearch
from mapping import mapping
import os
import requests

from threading import Thread
import pdb
import time


engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = os.environ.get('ES_INDEX_NAME', 'searchable_items_aws')
DOC_TYPE = 'searchable_item'
ES_URI = os.environ['WRITE_ES_URI']
es = Elasticsearch(ES_URI, retry_on_timeout=True)


class IndexESHelper:
    """
    Elastic search index script helper methods
    """
    def __init__(self):
        pass

    @classmethod
    def get_ref_abstracts(cls):
        """
        Get join between Referencedbentity and Referencedocument
            :param cls: 
        """
        obj = {}
        _abstracts = DBSession.query(Referencedbentity, Referencedocument).join(
            Referencedocument,
            Referencedbentity.dbentity_id == Referencedocument.reference_id).filter(
                Referencedocument.document_type == "Abstract").all()
        for item in _abstracts:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].text)
        return obj

    @classmethod
    def get_ref_aliases(cls):
        """
        Get join between Referencedbentity and ReferenceAlias
            :param cls:
        """
        obj = {}
        _aliases = DBSession.query(Referencedbentity, ReferenceAlias).join(
            ReferenceAlias,
            Referencedbentity.dbentity_id == ReferenceAlias.reference_id).filter(
                ReferenceAlias.alias_type == "Secondary SGDID").all()
        for item in _aliases:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].display_name)
        return obj

    @classmethod
    def get_ref_authors(cls):
        """
        Get join between Referencedbentity and Referenceauthor
            :param cls: 
        """
        obj = {}
        _authors = DBSession.query(Referencedbentity, Referenceauthor).join(
            Referenceauthor,
            Referencedbentity.dbentity_id == Referenceauthor.reference_id).all()
        for item in _authors:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].display_name)
        return obj
