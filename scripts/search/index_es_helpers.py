from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Locusnote, Filedbentity, FileKeyword, LocusnoteReference, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
from elasticsearch import Elasticsearch
from mapping import mapping
import os
import requests
import json
from multiprocess import Pool
import pdb

engine = create_engine(os.environ["NEX2_URI"], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = os.environ.get("ES_INDEX_NAME", "searchable_items_aws")
DOC_TYPE = "searchable_item"
ES_URI = os.environ["WRITE_ES_URI"]
es = Elasticsearch(ES_URI, retry_on_timeout=True)


def filter_object_list(items, flag=False):
    data = []
    if flag:
        for item in items:
            if item:
                if item not in data:
                    if item != "null":
                        data.append(item)
    else:
        for item in items:
            if item:
                if item not in data:
                    data.append(item)
    return data


def get_phenotype_annotations_chemicals(properties):
    data = []
    if len(properties) > 0:
        for item in properties:
            if item["class_type"] == "CHEMICAL":
                if item["bioitem"]:
                    data.append(item["bioitem"]["display_name"])
        return data
    else:
        return data


def flattern_arr(lst):
    '''
        flattern 2D-list into single dimension list
            :param lst: 
        '''
    if len(lst) > 0:
        temp_arr = [item for sublist in lst for item in sublist]
        return temp_arr
    else:
        return []


class IndexESHelper:
    '''
    Elastic search index script helper methods
    '''

    def __init__(self):
        pass

    @classmethod
    def get_ref_abstracts(cls):
        '''
        Get join between Referencedbentity and Referencedocument
            :param cls: 
        '''
        obj = {}
        _abstracts = DBSession.query(Referencedbentity, Referencedocument).join(
            Referencedocument, Referencedbentity.dbentity_id ==
            Referencedocument.reference_id).filter(
                Referencedocument.document_type == "Abstract").all()
        for item in _abstracts:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].text)
        return obj

    @classmethod
    def get_ref_aliases(cls):
        '''
        Get join between Referencedbentity and ReferenceAlias
            :param cls: not required
        '''
        obj = {}
        _aliases = DBSession.query(Referencedbentity, ReferenceAlias).join(
            ReferenceAlias, Referencedbentity.dbentity_id ==
            ReferenceAlias.reference_id).filter(
                ReferenceAlias.alias_type == "Secondary SGDID").all()
        for item in _aliases:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].display_name)
        return obj

    @classmethod
    def get_ref_authors(cls):
        '''
        Get join between Referencedbentity and Referenceauthor
            :param cls: not required
        '''
        obj = {}
        _authors = DBSession.query(Referencedbentity, Referenceauthor).join(
            Referenceauthor, Referencedbentity.dbentity_id ==
            Referenceauthor.reference_id).all()
        for item in _authors:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].display_name)
        return obj

    @classmethod
    def get_locus_dbentity_summary(cls):
        '''
        Get join between locusdbentity and locussummary
            :param cls: not required
        '''
        obj = {}
        _locus_summary = DBSession.query(Locusdbentity, Locussummary).join(
            Locussummary,
            Locusdbentity.dbentity_id == Locussummary.locus_id).all()

        for item in _locus_summary:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1].text)
        return obj

    @classmethod
    def get_locus_dbentity_alias(cls, filter_container=[]):
        '''
        Get join between locusdbentity and locusalias
            :param cls: not required
            :param filter_container: optional 
        '''
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
        '''
        Get join between phenotype and phenotypeannotation
        '''
        obj = {}
        _phenotypes = []
        if len(filter_container) > 0:
            _phenotypes = DBSession.query(Phenotype, Phenotypeannotation).join(
                Phenotypeannotation, Phenotype.phenotype_id ==
                Phenotypeannotation.phenotype_id).filter().all()
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
        '''
        Get a join between locusdbentity and phenotypeannotation
            :param cls: not required
        '''
        obj = {}
        _locus_phenotype = DBSession.query(
            Locusdbentity, Phenotypeannotation).join(
                Phenotypeannotation, Locusdbentity.dbentity_id ==
                Phenotypeannotation.dbentity_id).all()
        for item in _locus_phenotype:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1])
        return obj

    @classmethod
    def get_locus_go_annotation(cls):
        '''
        Get a join between locusdbentity and goannotation
            :param cls: not required
        '''
        obj = {}
        _locus_go_annotation = DBSession.query(
            Locusdbentity, Goannotation).join(
                Goannotation,
                Locusdbentity.dbentity_id == Goannotation.dbentity_id).filter(
                    Goannotation.go_qualifier != "NOT").all()
        for item in _locus_go_annotation:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[1])
        return obj

    @classmethod
    def get_colleague_locus(cls):
        '''
        Get join between colleague and colleaguelocus
            :param:cls: not required
        '''
        obj = {}
        _colleague_locus = DBSession.query(
            Colleague, ColleagueLocus).join(ColleagueLocus).filter(
                Colleague.colleague_id == ColleagueLocus.colleague_id).all()
        for item in _colleague_locus:
            if item[0].colleague_id not in obj:
                obj[item[0].colleague_id] = []
            obj[item[0].colleague_id].append(item[1])

        return obj

    @classmethod
    def get_colleague_locusdbentity(cls):
        '''
        Get join between colleague and locusdbentity
            :param:cls: not required
        '''
        obj = {}

        _colleague_locus = DBSession.query(
            Locusdbentity, ColleagueLocus).join(ColleagueLocus).filter(
                Locusdbentity.dbentity_id == ColleagueLocus.locus_id).all()
        for item in _colleague_locus:
            if item[0].dbentity_id not in obj:
                obj[item[0].dbentity_id] = []
            obj[item[0].dbentity_id].append(item[0])

        return obj

    @classmethod
    def get_go_goannotation(cls):
        '''
        Get join between Go and GoAnnotation
            param: cls: not required
        '''
        obj = {}
        _go_goannotation = DBSession.query(Go, Goannotation).join(
            Goannotation, Go.go_id == Goannotation.go_id).all()

    @classmethod
    def get_locus_names(cls, id_lst, dict_obj):
        '''
        Get items from given list by id
            param: cls: not required
            param: id: id to match key in dictionary
            param: dict_obj: dictionary object 
        '''
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
    def combine_locusdbentity_colleague(cls, colleagues, locus_obj,
                                        colleague_obj):
        '''
        Combine locus_obj and colleague_obj
            :param cls: not required
            :param locus_obj: dictionary
            :param colleague_obj: dictionary
        '''
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
                "name": item.last_name + ", " + item.first_name,
                "category": "colleague",
                "href": "/colleague/" + item.format_name,
                "description": description,
                "first_name": item.first_name,
                "last_name": item.last_name,
                "institution": item.institution,
                "position": position,
                "country": item.country,
                "state": item.state,
                "format_name": item.format_name
            }

            loco = result.get(item.colleague_id)
            if loco is not None:
                locus_1 = filter(
                    lambda y: y is not None,
                    p.map(lambda x: x.gene_name if x.gene_name else None, loco))
                locus_2 = filter(
                    lambda y: y is not None,
                    p.map(
                        lambda x: x.systematic_name if x.systematic_name else None,
                        loco))
                locus = set(locus_1 + locus_2)
            obj_temp["colleague_loci"] = sorted(
                list(locus)) if len(locus) > 0 else []
            _dict_obj[item.colleague_id] = obj_temp
        return _dict_obj

    @classmethod
    def get_phenotypes_condition(cls, condition_str=None):
        '''
        Get join between phenotypeannotation and phenotype condition
            :param cls: not required
        '''
        obj = {}
        if condition_str is not None:
            _phenotypes_condition = DBSession.query(
                Phenotypeannotation, PhenotypeannotationCond).filter(
                    Phenotypeannotation.annotation_id ==
                    PhenotypeannotationCond.annotation_id,
                    PhenotypeannotationCond.condition_class ==
                    condition_str).all()
            for item in _phenotypes_condition:
                if item[0].phenotype_id not in obj:
                    obj[item[0].phenotype_id] = []
                obj[item[0].phenotype_id].append(item)
        else:
            _phenotypes_condition = DBSession.query(
                Phenotypeannotation, PhenotypeannotationCond).filter(
                    Phenotypeannotation.annotation_id ==
                    PhenotypeannotationCond.annotation_id).all()
            for item in _phenotypes_condition:
                if item[0].phenotype_id not in obj:
                    obj[item[0].phenotype_id] = []
                obj[item[0].phenotype_id].append(item)

        return obj

    @classmethod
    def get_pheno_annotations(cls, phenos_data):
        _data = []
        for item in phenos_data:
            annotations = item.annotations_to_dict()
            _references = filter_object_list(
                    [itm["reference"]["display_name"] for itm in annotations]) if annotations else []
            _strains = filter_object_list(
                    [itm["strain"]["display_name"] for itm in annotations]) if annotations else []
            _properties = [itm["properties"] for itm in annotations]
            _chemical = get_phenotype_annotations_chemicals(
                    flattern_arr(_properties))
            _mutant_type = filter_object_list(
                    [itm["mutant_type"] for itm in annotations]
                    , True) if annotations else []

            _phenotype_loci = filter_object_list(
                    [itm["locus"]["display_name"] for itm in annotations]) if annotations else []
            _phenotypes = filter_object_list(
                    [itm["phenotype"]["display_name"] for itm in annotations]) if annotations else []
            for annotation in annotations:

                obj = {
                    "strain": _strains,
                    "references": _references,
                    "phenotype_loci": _phenotype_loci,
                    "name": item.display_name,
                    "href": item.obj_url,
                    "chemical": _chemical,
                    "description": item.description,
                    "category": "phenotype",
                    "keys": [],
                    "mutant_type": _mutant_type,
                    "format_name": item.format_name
                }
                _data.append(obj)

        return _data


    @classmethod
    def get_combined_phenotypes(cls, phenos, phenos_annotation,
                                phenos_annotation_cond):
        '''
        get composed dictionary from the params
            :param cls: not required
            :param phenos: from phenotypes table
            :param phenos_annotation: join between phenotype and phenotypeanootation tables
            :param phenos_annotation_cond: join between phenotypeannotation and phenotypeannotation_cond tables
        '''
        if phenos_annotation is not None:

            for item_key, item_v in phenos_annotation.items():
                if phenos_annotation_cond is not None:
                    temp_cond = phenos_annotation_cond.get(item_key)
                    if temp_cond is not None:
                        phenos_annotation[item_key].append(
                            [x[1] for x in temp_cond])
                    else:
                        phenos_annotation[item_key].append([])

        _dict_obj = dict.fromkeys([p.phenotype_id for p in phenos])

        for item in phenos:
            references = set([])
            loci = set([])
            chemicals = set([])
            mutant = set([])
            _annotations = phenos_annotation.get(item.phenotype_id)

            if _annotations is not None:
                _annotations_mod = filter(
                    lambda lst_item: type(lst_item) is not list, _annotations)
                _annot_conds = filter(lambda lst_item: type(lst_item) is list,
                                      _annotations)

                for item_mod in _annotations_mod:
                    references.add(item_mod.reference.display_name)
                    loci.add(item_mod.dbentity.display_name)
                    mutant.add(item_mod.mutant.display_name)
                if len(_annot_conds) > 0:
                    conds_mod = [item_chemical for sublist in _annot_conds for item_chemical in sublist]
                    if len(conds_mod) > 0:
                        temp_cm = [
                            chemical.condition_name for chemical in conds_mod
                        ]
                        if len(temp_cm) > 0:
                            for cm in temp_cm:
                                chemicals.add(cm)
            qualifier = None
            if item.qualifier:
                qualifier = item.qualifier.display_name
            obj = {
                "name": item.display_name,
                "href": item.obj_url,
                "description": item.description,
                "observable": item.observable.display_name,
                "qualifier": qualifier,
                "references": list(references),
                "phenotype_loci": list(loci),
                "number_annotations": len(list(loci)),
                "chemical": list(chemicals),
                "mutant_type": list(mutant),
                "category": "phenotype",
                "keys": [],
                "format_name": item.format_name
            }
            _dict_obj[item.phenotype_id] = obj

        return _dict_obj

    @classmethod
    def flattern_list(cls, lst):
        '''
        flattern 2D-list into single dimension list
            :param lst: 
        '''
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

    @classmethod
    def get_chebi_annotations(cls, chebi_data):
        '''
        Get a join between chebi and phenotypeannotationcondition
        '''
        obj = {}
        _dict_chebi = {}
        chebi_names = list(set([x.display_name for x in chebi_data]))

        for chebi_item in chebi_data:
            if chebi_item.display_name not in _dict_chebi:
                _dict_chebi[chebi_item.display_name] = []
            _dict_chebi[chebi_item.display_name].append(chebi_item)

        if len(chebi_names) > 0:
            _conditions = DBSession.query(
                Phenotypeannotation, PhenotypeannotationCond).join(
                    PhenotypeannotationCond, Phenotypeannotation.annotation_id
                    == PhenotypeannotationCond.annotation_id).filter(
                        PhenotypeannotationCond.condition_name.in_(
                            chebi_names)).all()
            for item_cond in _conditions:
                temp = _dict_chebi.get(item_cond[1].condition_name)
                if temp is not None:
                    for item in temp:
                        if len(temp) > 0:
                            obj[item.chebi_id] = item
        return obj

    @classmethod
    def get_dbentity_locus_note(cls):
        obj = {}
        temp_obj = {}
        _result1 = DBSession.query(Dbentity, Locusnote).join(Locusnote).filter(Dbentity.dbentity_id == Locusnote.locus_id).all()
        ids = list(set([x[1].note_id for x in _result1]))
        _result2 = DBSession.query(
            Locusnote, LocusnoteReference).join(LocusnoteReference).filter(LocusnoteReference.note_id.in_(ids)).all()
        for item1 in _result1:
            if item1[1].locus_id not in temp_obj:
                temp_obj[item1[1].locus_id] = []
            temp_obj[item1[1].locus_id].append(item1[0])
        for item2 in _result2:
            temp = temp_obj.get(item2[0].locus_id)
            if temp is not None:
                if item2[1].reference_id not in obj:
                    obj[item2[1].reference_id] = []
                obj[item2[1].reference_id].append(temp)
        return obj

    @classmethod
    def get_file_dbentity_keyword(cls):
        obj = {}
        _data = DBSession.query(
            Filedbentity, FileKeyword).join(FileKeyword).filter(
                Filedbentity.dbentity_id == FileKeyword.file_id).all()
        for item in _data:
            if (item):
                if item[0].dbentity_id not in obj:
                    obj[item[0].dbentity_id] = []
                obj[item[0].dbentity_id].append(item[1].keyword.display_name)

        return obj

    @classmethod
    def convertBytes(cls, numBytes, suffix="B"):
        '''
        Convert bytes to human readable unit
        '''
        if numBytes is not None or numBytes > 0:
            units = ["", "K", "M", "G", "T", "P", "E", "Z"]
            for item in units:
                if abs(numBytes) < 1024.0:
                    return "%3.1f%s%s" % (numBytes, item, suffix)
                numBytes /= 1024.0
            return "%.1f%s%s" % (numBytes, "Y", suffix)
        return None

    @classmethod
    def get_not_mapped_genes(cls):
        obj = {}
        with open("./scripts/search/not_mapped.json", "r") as json_data:
            _data = json.load(json_data)
            for item in _data:
                if len(item["FEATURE_NAME"]) > 0:
                    if item["FEATURE_NAME"] not in obj:
                        obj[item["FEATURE_NAME"]] = []
                    obj[item["FEATURE_NAME"]].append(item)
        if len(obj) > 0:
            return obj
        else:
            return None


    @classmethod
    def get_readme_file(cls, id):
        _data = DBSession.query(Filedbentity).filter_by(Filedbentity.dbentity_id == id).all()
