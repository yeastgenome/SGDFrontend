from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
from elasticsearch import Elasticsearch
from mapping import mapping
import os
import requests

from threading import Thread
import pdb
import time
from multiprocess import Pool


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
            :param cls: not required
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
            :param cls: not required
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
            :param cls: not required
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

    @classmethod
    def get_locus_dbentity_summary(cls):
        """
        Get join between locusdbentity and locussummary
            :param cls: not required
        """
        obj = {}
        _locus_summary = DBSession.query(Locusdbentity, Locussummary).join(Locussummary, Locusdbentity.dbentity_id == Locussummary.locus_id).all()

        for item in _locus_summary:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].text)
        return obj



    @classmethod
    def get_locus_dbentity_alias(cls, filter_container=[]):
        """
        Get join between locusdbentity and locusalias
            :param cls: not required
            :param filter_container: optional 
        """
        obj = {}
        _locus_aliases_protein = []
        if (len(filter_container) > 0):
            _locus_aliases_protein = DBSession.query(
                Locusdbentity, LocusAlias).join(
                    LocusAlias,
                    Locusdbentity.dbentity_id == LocusAlias.locus_id).filter(
                        LocusAlias.alias_type.in_(filter_container)).all()
        else:
            _locus_aliases_protein = DBSession.query(
                Locusdbentity, LocusAlias).join(
                    LocusAlias,
                    Locusdbentity.dbentity_id == LocusAlias.locus_id).all()
        for item in _locus_aliases_protein:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1])
        return obj


    @classmethod
    def get_phenotypes_phenotypeannotation(cls, filter_container=[]):
        """
        Get join between phenotype and phenotypeannotation
        """
        obj = {}
        _phenotypes = []
        if len(filter_container) > 0 :
            _phenotypes = DBSession.query(Phenotype, Phenotypeannotation).join(Phenotypeannotation, Phenotype.phenotype_id == Phenotypeannotation.phenotype_id).filter().all()
        else:
            _phenotypes = DBSession.query(Phenotype, Phenotypeannotation).join(
                Phenotypeannotation, Phenotype.phenotype_id ==
                Phenotypeannotation.phenotype_id).all()
        for item in _phenotypes:
            if item[0] not in obj:
                obj[item[0].phenotype_id] = []
            obj[item[0].phenotype_id].append(item[1])
        return obj

    @classmethod
    def get_locus_phenotypeannotation(cls):
        """
        Get a join between locusdbentity and phenotypeannotation
            :param cls: not required
        """
        obj = {}
        _locus_phenotype = DBSession.query(Locusdbentity, Phenotypeannotation).join(Phenotypeannotation, Locusdbentity.dbentity_id == Phenotypeannotation.dbentity_id).all()
        for item in _locus_phenotype:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1])
        return obj

    @classmethod
    def get_locus_go_annotation(cls):
        """
        Get a join between locusdbentity and goannotation
            :param cls: not required
        """
        obj = {}
        _locus_go_annotation = DBSession.query(Locusdbentity, Goannotation).join(Goannotation, Locusdbentity.dbentity_id == Goannotation.dbentity_id).filter(Goannotation.go_qualifier == 'NOT').all()
        for item in _locus_go_annotation:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1])
        return obj

    @classmethod
    def get_colleague_locus(cls):
        """
        Get join between colleague and colleaguelocus
            :param:cls: not required
        """
        obj = {}
        _colleague_locus = DBSession.query(
            Colleague, ColleagueLocus).join(ColleagueLocus).filter(Colleague.colleague_id == ColleagueLocus.colleague_id).all()
        for item in _colleague_locus:
            if item[0].colleague_id not in obj:
                obj[item[0].colleague_id] = []
            obj[item[0].colleague_id].append(item[1])

        return obj

    @classmethod
    def get_colleague_locusdbentity(cls):
        """
        Get join between colleague and locusdbentity
            :param:cls: not required
        """
        obj = {}

        _colleague_locus = DBSession.query(
            Locusdbentity, ColleagueLocus).join(ColleagueLocus).filter(
                Locusdbentity.dbentity_id ==
                ColleagueLocus.locus_id).all()
        for item in _colleague_locus:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[0])


        return obj

    @classmethod
    def get_go_goannotation(cls):
        """
        Get join between Go and GoAnnotation
            param: cls: not required
        """
        obj = {}
        _go_goannotation = DBSession.query(Go, Goannotation).join(Goannotation, Go.go_id == Goannotation.go_id).all()

    @classmethod
    def get_locus_names(cls, id_lst, dict_obj):
        """
        Get items from given list by id
            param: cls: not required
            param: id: id to match key in dictionary
            param: dict_obj: dictionary object 
        """
        temp = []
        for item_id in id_lst:
            tmp = dict_obj.get(item_id)
            if tmp is not None:
                temp.append(tmp)
        if len(temp) > 0:
            return [item for sublist in temp for item in sublist]
        else:
            return []
    @classmethod
    def combine_locusdbentity_colleague(cls, colleagues, locus_obj, colleague_obj):
        """
        Combine locus_obj and colleague_obj
            :param cls: not required
            :param locus_obj: dictionary
            :param colleague_obj: dictionary
        """
        p = Pool(4)
        obj = {}
        result = {}
        col_obj = {}
        bulk_data = []
        if locus_obj:
            for item_key, item_value in colleague_obj.items():
                if len(item_value) > 0:
                    for item in item_value:
                        temp = locus_obj.get(item.locus_id)
                        if temp is not None:
                            if item.colleague_id not in obj:
                                obj[item.colleague_id] = []
                            obj[item.colleague_id].append(temp)
            for k, v in obj.items():
                temp = [item for sublist in v for item in sublist]
                result[k] = temp

        _dict_obj = dict.fromkeys([c.colleague_id for c in colleagues])

        for item in colleagues:
            description_fields = []
            temp = []
            locus = []
            if item.institution is not None:
                temp.append(item.institution)
            if item.country is not None:
                temp.append(item.country)
            if len(temp) > 0:
                for field in temp:
                    if field:
                        description_fields.append(field)
                description = ", ".join(description_fields)
            else:
                description = ""
            position = "Lab Member"
            if item.is_pi == 1:
                position = "Head of Lab"
            obj_temp = {
                'name': item.last_name + ", " + item.first_name,
                'category': 'colleague',
                'href': '/colleague/' + item.format_name,
                'description': description,
                'first_name': item.first_name,
                'last_name': item.last_name,
                'institution': item.institution,
                'position': position,
                'country': item.country,
                'state': item.state,
                'format_name': item.format_name
            }

            loco = result.get(item.colleague_id)
            if loco is not None:
                locus_1 = filter(lambda y: y is not None, p.map(lambda x: x.gene_name if x.gene_name else None, loco))
                locus_2 = filter(lambda y: y is not None, p.map(
                    lambda x: x.systematic_name if x.systematic_name else None,
                    loco))
                locus = set(locus_1 + locus_2)
            obj_temp['colleague_loci'] = sorted(
                list(locus)) if len(locus) > 0 else []
            _dict_obj[item.colleague_id] = obj_temp
        return _dict_obj

    @classmethod
    def get_phenotypes_condition(cls, condition_str="chemical"):
        """
        Get join between phenotypeannotation and phenotype condition
            :param cls: not required
        """
        obj = {}
        _phenotypes_condition = DBSession.query(
            Phenotypeannotation, PhenotypeannotationCond).filter(
                Phenotypeannotation.annotation_id ==
                PhenotypeannotationCond.annotation_id,
                PhenotypeannotationCond.condition_class == condition_str).all()
        for item in _phenotypes_condition:
            if item[0].phenotype_id not in obj:
                obj[item[0].phenotype_id] = []
            obj[item[0].phenotype_id].append(item)
        pdb.set_trace()
        return obj
    
    @classmethod
    def get_combined_phenotypes(cls, phenos, phenos_annotation, phenos_annotation_cond):
        obj = {}


    @classmethod
    def flattern_list(cls, lst):
        """
        flattern 2D-list into single dimension list
            :param lst: 
        """
        if len(lst) > 0:
            temp_arr = [item for sublist in lst for item in sublist]
            return temp_arr
        else:
            return []
    @classmethod
    def get_name(cls, item):
        tap = []
        if item.get_name:
            tap.append(item.get_name)
        if item.systematic_name:
            tap.append(item.get_name)
        return tap
