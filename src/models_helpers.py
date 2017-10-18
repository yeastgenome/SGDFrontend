from src.models import DBSession, Base, Colleague, ColleagueLocus, ColleagueRelation, ColleagueReference, ColleagueUrl, Colleaguetriage, Dbentity, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
import os
import requests
import pdb


class ModelsHelper(object):

    def get_all_colleague_data(self):
        """
        Get all colleague  data
        """
        all_colleagues = DBSession.query(Colleague).all()
        return all_colleagues

    def get_all_colleague_data_by_id(self, id):
        """
        Get all colleague associated data filter by colleague_id
        """
        colleague = DBSession.query(Colleague).filte(Colleague.colleague_id == id).first()
        return colleague

    def get_all_collegue_locus(self):
        """
        Get all colleague_locus data
        """
        colleague_loci = DBSession.query(ColleagueLocus).all()
        return colleague_loci

    def get_all_collegue_locus_by_id(self, id):
        """
        Get all colleague_locus data filter by colleague_id
        """
        colleague_locus = DBSession.query(ColleagueLocus).filter(ColleagueLocus.colleague_id == id).all()
        return colleague_locus

    def get_all_colleague_relation(self):
        """
        Get all colleague_relation data
        """
        colleague_relations = DBSession.query(ColleagueRelation).all()
        return colleague_relations

    def get_all_colleague_relation_by_id(self, id):
        """
        Get all colleague_relation data filter by colleague_id
        """
        colleague_relation = DBSession.query(ColleagueRelation).filter(ColleagueRelation.colleague_id == id).all()
        return colleague_relation

    def get_colleague_associated_data(self):
        """
        Get all colleague associated data(joins)
        """
        colleagues = self.get_all_colleague_data()
        loci = self.get_all_collegue_locus()
        relations = self.get_all_colleague_relation()
        result = self.association_helper(colleagues, loci, relations)
        return result

         


    def association_helper(self, colleagues, loci, relations):
        """
        Create colleague object from given lists
        """
        if len(colleagues) > 0:
            relation_obj = self.list_to_dict_colleague(relations)
            loci_obj = self.list_to_dict_colleague(loci)
            colleague_obj = {}
            for item in colleagues:
                if item.colleague_id not in colleague_obj:
                    colleague_obj[item.colleague_id] = {"loci": [], "relations": [], "colleagues": []}
                colleague_obj[item.colleague_id]['colleagues'].append(item)
                temp_loci = loci_obj.get(item.colleague_id)
                temp_relation = relation_obj.get(item.colleague_id)
                if temp_loci is not None:
                    colleague_obj[item.colleague_id]["loci"] = temp_loci
                if temp_relation is not None:
                    colleague_obj[item.colleague_id]["relations"] = temp_relation

            return colleague_obj


    def list_to_dict_colleague(self, lst):
        if len(lst) > 0:
            ids = list(set([x.colleague_id for x in lst]))
            if len(ids) > 0:
                dict_obj = {}
                for item in lst:
                    if item.colleague_id not in dict_obj:
                        dict_obj[item.colleague_id] = []
                    dict_obj[item.colleague_id].append(item)
                return dict_obj
