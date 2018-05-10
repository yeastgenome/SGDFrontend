from src.models import DBSession, Base, Colleague, ColleagueLocus, ColleagueRelation, FilePath, Filedbentity, FileKeyword, Path, ColleagueReference, ColleagueUrl, Colleaguetriage, Dbentity, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
import os
import requests


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
        """
        Create dictionary given list of colleague objects
        """
        if len(lst) > 0:
            ids = list(set([x.colleague_id for x in lst]))
            if len(ids) > 0:
                dict_obj = {}
                for item in lst:
                    if item.colleague_id not in dict_obj:
                        dict_obj[item.colleague_id] = []
                    dict_obj[item.colleague_id].append(item)
                return dict_obj

    def get_colleague_data(self, colleague, dict_data):
        """
        Get Colleague data
        """
        _dict = {}
        _colleague = dict_data.get(colleague.colleague_id)

        if _colleague is not None:
            temp_relations = _colleague["relations"]
            temp_loci = _colleague["loci"]
            genes = []
            if _colleague:
                if len(_colleague["colleagues"]) > 0:
                    temp_coll = _colleague["colleagues"][0]
                    if temp_coll:
                        temp_coll = temp_coll.to_dict()
                        phones = None
                        full_address = None
                        if temp_coll["address1"]:
                            full_address = temp_coll["address1"]
                        if temp_coll["address2"]:
                            if full_address:
                                full_address = full_address + ', ' + temp_coll["address2"]
                            else:
                                full_address = temp_coll["address2"]
                        if temp_coll["address3"]:
                            if full_address:
                                full_address = full_address + ', ' + temp_coll["address3"]
                            else:
                                full_address = temp_coll["address3"]
                        if temp_coll["work_phone"]:
                            phones = str(temp_coll["work_phone"])
                        if temp_coll["other_phone"]:
                            if phones:
                                if temp_coll["work_phone"] is not temp_coll["other_phone"]:
                                    phones = phones + ', ' + str(temp_coll["other_phone"])
                            else:
                                phones = str(temp_coll["other_phone"])
                        sfx = temp_coll["suffix"] if temp_coll["suffix"] is not None else ''
                        fname = temp_coll["first_name"] if temp_coll["first_name"] is not None else ''
                        mname = temp_coll["middle_name"] if temp_coll["middle_name"] is not None else ''
                        lname = temp_coll["last_name"] if temp_coll["last_name"] is not None else ''
                        fullname = self.modifyName(sfx, fname, mname,lname).strip()
                        _dict["colleague_id"] = temp_coll["colleague_id"]
                        _dict["orcid"] = temp_coll["orcid"]
                        _dict["first_name"] = temp_coll["first_name"]
                        _dict["middle_name"] = temp_coll["middle_name"]
                        _dict["last_name"] = temp_coll["last_name"]
                        _dict["suffix"] = temp_coll["suffix"]
                        _dict["fullname"] = fullname
                        _dict["institution"] = temp_coll["institution"]
                        _dict["email"] = temp_coll["email"]
                        _dict["lab_page"] = temp_coll["lab_page"]
                        _dict["research_page"] = temp_coll["research_page"]
                        _dict["profession"] = temp_coll["profession"]
                        _dict["state"] = temp_coll["state"]
                        _dict["country"] = temp_coll["country"]
                        _dict["position"] = temp_coll["position"]
                        _dict["postal_code"] = temp_coll["postal_code"]
                        _dict["city"] = temp_coll["city"]
                        _dict["research_interests"] = temp_coll[
                            "research_interests"]
                        _dict["work_phone"] = temp_coll["work_phone"]
                        _dict["other_phone"] = temp_coll["other_phone"]
                        _dict["keywords"] = temp_coll["keywords"]
                        _dict["format_name"] = temp_coll["format_name"]
                        _dict["name"] = temp_coll["name"]
                        _dict["address1"] = temp_coll["address1"]
                        _dict["address2"] = temp_coll["address2"]
                        _dict["address3"] = temp_coll["address3"]
                        _dict["phones"] = phones if phones else None
                        _dict["full_address"] = full_address
                        _dict["colleague_note"] = temp_coll["colleague_note"]
                if len(temp_loci) > 0:
                    genes = [x.locus.display_name for x in temp_loci]
                    if len(genes) > 0:
                        _dict["associated_genes"] = genes
                associates = self.get_associates_helper(temp_relations)
                locus_items = self.get_all_collegue_locus_by_id(colleague.colleague_id)
                temp_locus_str = []
                if(len(locus_items) > 0):
                    temp_locus_str = [lcs.locus.display_name for lcs in locus_items]
                if associates:
                    _dict["supervisors"] = associates["supervisors"]
                    _dict["lab_members"] = associates["members"]
                if temp_locus_str:
                    _dict["associated_gene_ids"] = temp_locus_str

            return _dict

    def modifyName(self, sfx,fname, mname, lname):
        temp = ''
        if len(sfx) > 0:
            temp = temp + sfx + ' '
        if len(fname) > 0:
            temp = temp + fname + ' '
        if len(mname) > 0:
            temp = temp + mname + ' '
        if len(lname) > 0:
            temp = temp + lname

        return temp

    def get_associates_helper(self, relations_list):
        """
        Get associates data
        """
        if len(relations_list) > 0:
            temp = filter(lambda item: item.association_type == "Associate",
                          relations_list)
            members = filter(
                lambda item: item.association_type != "Head of Lab", temp)
            supervisors = filter(
                lambda item: item.association_type == "Head of Lab",
                relations_list)
            if temp:
                return {
                    "members": [
                        x.associate.to_dict_basic_data() for x in members
                    ],
                    "supervisors": [
                        x.associate.to_dict_basic_data() for x in supervisors
                    ]
                }
            return None

    def get_files_helper(self):

        result = DBSession.query(Filedbentity).all()
        obj = {}
        for item in result:
            res = item.to_dict()
            if item.dbentity_id not in obj:
                obj[item.dbentity_id] = []
            obj[item.dbentity_id].append(res)
        return obj


    def get_filepath(self):
        result = self.get_file_path_obj(self.set_file_dict(),
                                        self.set_path_dict())
        return result
        '''obj = {}
        result = DBSession.query(FilePath).all()
        if result:
            for item in result:
                res = item.file_path_to_dict()

                if item.file_id not in obj:
                    obj[item.file_id] = []
                obj[item.file_id].append(res)
        return obj'''

    def set_file_dict(self):
        file_obj = DBSession.query(
            Filedbentity, FilePath).join(FilePath).filter(
                Filedbentity.dbentity_id == FilePath.file_id, Filedbentity.readme_file_id != None, Filedbentity.is_public, Filedbentity.s3_url != None).all()
        obj = {}
        if file_obj:
            for item in file_obj:
                if item[1].file_path_id not in obj:
                    obj[item[1].file_path_id] = []
                obj[item[1].file_path_id].append(item[0])

        return obj


    def set_path_dict(self):
        path_obj = DBSession.query(Path, FilePath).join(FilePath).filter(Path.path_id == FilePath.path_id).all()
        obj = {}
        if path_obj:
            for item in path_obj:
                if item[1].file_path_id not in obj:
                    obj[item[1].file_path_id] = []
                obj[item[1].file_path_id].append(item[0])

        return obj

    def get_file_path_obj(self, file_data, path_data):
        obj_container = []
        if file_data and path_data:
            for item_key, item_value in file_data.items():
                obj = {"id": item_key, "_file": None, "_path": None}
                if item_value:
                    obj["_file"] = [x.to_dict() for x in item_value]
                else:
                    obj["_file"] = []

                if item_key in path_data:
                    obj["_path"] = [
                        x.path_to_dict() for x in path_data.get(item_key)
                    ]
                else:
                    obj["_path"] = []
                obj_container.append(obj)

        return obj_container


    def convertBytes(self, numBytes, suffix='B'):
        '''
        Convert bytes to human readable unit
        '''
        if numBytes is not None or numBytes > 0:
            units = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']
            for item in units:
                if abs(numBytes) < 1024.0:
                    return "%3.1f%s%s" % (numBytes, item, suffix)
                numBytes /= 1024.0
            return "%.1f%s%s" % (numBytes, 'Y', suffix)
        return None

    def get_id_list_by_path_id(self, path_id):
        file_path_ids = DBSession.query(FilePath.file_id).filter(FilePath.path_id == path_id).all()
        if file_path_ids is not None:
            return file_path_ids
        return None

    def get_file_dbentity_keyword(self):
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

    def get_files_by_status(self, ids_list, flag):
        if(ids_list):
            if(flag):
                result = DBSession.query(Filedbentity).filter(
                    Filedbentity.dbentity_id.in_(ids_list),
                    Filedbentity.is_public == True, Filedbentity.s3_url != None,
                    Filedbentity.readme_file_id != None,
                    Filedbentity.dbentity_status == "Active").all()
                return result
            else:
                result = DBSession.query(Filedbentity).filter(
                    Filedbentity.dbentity_id.in_(ids_list),
                    Filedbentity.is_public == True, Filedbentity.s3_url != None,
                    Filedbentity.readme_file_id != None).all()
                return result


    def get_files_by_id_list(self, file_id_list, flag):
        if file_id_list is not None:
            ids_list = [int(y) for ys in file_id_list for y in ys]
            file_res = self.get_files_by_status(ids_list, flag)
            if file_res:
                temp_files = []
                for x in file_res:
                    status = ''
                    if (x.dbentity_status == "Active" or x.dbentity_status == "Archived"):
                        if x.dbentity_status == "Active":
                            status = "Active"
                        else:
                            status = "Archived"
                    obj = {
                        'name':
                            x.display_name,
                        'href':
                            x.s3_url,
                        'category':
                            'download',
                        'description':
                            x.description,
                        'format':
                            str(x.format.display_name),
                        'status':
                            str(status),
                        'file_size':
                            str(self.convertBytes(x.file_size))
                            if x.file_size is not None else x.file_size,
                        'year':
                            str(x.year),
                        'readme_url':
                            x.readme_file[0].s3_url
                            if x.readme_file_id is not None else None
                    }
                    temp_files.append(obj)
                return temp_files
        return None

    def get_files_by_path_id(self, path_id, flag):
        file_ids = self.get_id_list_by_path_id(path_id)
        if file_ids:
            files = self.get_files_by_id_list(file_ids, flag)
            if files:
                return files

        return None
    
    def clear_list_empty_values(self, lst):
        if lst:
            data = []
            for item in lst:
                if item:
                    data.append(item)
            return data
        else: 
            return lst
