from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Locusdbentity, LocusUrl, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
import os
import json
import re
import pdb
import sys


engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

def get_sgdids_for_panther():
    #submitted_data = DBSession.query(Locusdbentity).filter(Locusdbentity.sgdid.in_(ids_arr), Locusdbentity.not_in_s288c == False).all()
    new_data = Locusdbentity.get_s288c_genes()
    #result_diff = list(set(new_data) - set(submitted_data))
    temp = []
    for loc in new_data:
        temp.append(loc.sgdid)
    result = json.dumps(temp, ensure_ascii=False)
    with open('./scripts/bgi_json/data_dump/sgd_ids_for_panther.txt',
              'w+') as res_file:
        res_file.write(
            result.replace('"', '').replace('[', '').replace(']', ''))


def get_panther_sgdids():
    data_container = []
    data_dict = {}
    with open('./scripts/bgi_json/data_dump/panther/panther_search_results.json') as json_data_file:
        json_data = json.load(json_data_file)
        for item in json_data:

            obj = {
                "sgd_id": "",
                "panther_id": ""
            }
            temp_str = ','.join(map(str, item))
            reg_pattern = r'(SGD=S\d+)|(PTHR\d+)'
            reg_result = sorted(list(set(re.findall(reg_pattern,temp_str))))
            if(len(reg_result) > 1):
                item_str1 = ''.join(reg_result[0])
                item_str2 = ''.join(reg_result[1]).split("=")
                obj["panther_id"] = item_str1
                obj["sgd_id"] = item_str2[1]
                data_dict[item_str2[1]] = item_str1
                data_container.append(obj)
            elif(len(reg_result) == 1):
                item_str1 = ''.join(reg_result[0]).split("=")
                obj["sgd_id"] = item[1]
                obj["panther_id"] = None
                data_dict[item[1]] = None

                data_container.append(obj)
            else:
                continue

        return data_dict


def get_bgi_data():
    combined_list = combine_panther_locus_list(get_panther_sgdids(), Locusdbentity.get_s288c_genes())
    result = []
    if(len(combined_list) > 0):
        for item_key in combined_list:
            obj = {
                "crossReferenceIds":
                    [],
                "primaryId":
                    "",
                "symbol":
                    "",
                "genomeLocations": [{
                    "startPosition": 0,
                    "chromosome": "",
                    "assembly": "R64-2-1",
                    "endPosition": 0,
                    "strand": ""
                }],
                "soTermId":
                    "",
                "taxonId":
                    "NCBITaxon:559292",
                "synonyms":
                    [],
                "geneLiteratureUrl":
                    "",
                "geneSynopsis":
                    ""
            }
            item = combined_list[item_key]["locus_obj"]
            item_panther = combined_list[item_key]["panther_id"]
            locus_alias_data = DBSession.query(LocusAlias).filter(
                LocusAlias.locus_id == item.dbentity_id).all()

            if(len(locus_alias_data) > 0):
                dna_seq_annotation_obj = DBSession.query(
                    Dnasequenceannotation).filter(
                        Dnasequenceannotation.dbentity_id == item.dbentity_id,
                        Dnasequenceannotation.taxonomy_id == 274901,
                        Dnasequenceannotation.dna_type == "GENOMIC").all()

                if(len(dna_seq_annotation_obj) > 0):
                    chromosome = dna_seq_annotation_obj[0].contig.display_name.split(" ")
                    obj["genomeLocations"][0]["startPosition"] = dna_seq_annotation_obj[0].start_index
                    obj["genomeLocations"][0]["endPosition"] = dna_seq_annotation_obj[0].end_index
                    obj["genomeLocations"][0]["strand"] = dna_seq_annotation_obj[0].strand
                    obj["genomeLocations"][0]["startPosition"] = dna_seq_annotation_obj[0].start_index
                    obj["genomeLocations"][0]["chromosome"] = chromosome[1]
                    obj["soTermId"] = dna_seq_annotation_obj[0].so.soid
                mod_locus_alias_data = get_locus_alias_data(locus_alias_data, item.dbentity_id)

                for mod_item in mod_locus_alias_data:
                    mod_value = mod_locus_alias_data.get(mod_item)
                    if (type(mod_value) is list):
                        if (len(mod_locus_alias_data.get("aliases")) == 0):
                            obj["synonyms"].append(item.systematic_name)
                        else:
                            if (mod_locus_alias_data.get("aliases") is not None):
                                obj["synonyms"] = mod_locus_alias_data.get(
                                    "aliases")
                    else:
                        if (mod_value.get("secondaryIds") is not None):
                            temp_sec_item = mod_value.get("secondaryIds")
                            obj["name"] = item.name_description
                            if(len(temp_sec_item) > 1):
                                obj["secondaryIds"] = [','.join([str(x) for x in temp_sec_item])]
                            else:
                                obj["secondaryIds"] = [str(temp_sec_item[0])]
                        if (mod_value.get("crossReferenceIds") is not None):
                            temp_cross_item = mod_value.get("crossReferenceIds")
                            if(len(temp_cross_item) > 1):
                                obj["crossReferenceIds"] = [
                                    ','.join([str(x) for x in temp_cross_item])
                                ]
                            else:
                                obj["crossReferenceIds"] = [str(temp_cross_item[0])]


                if(item_panther is not None):
                    obj["crossReferenceIds"].append("PantherId:" + item_panther)
                    obj["primaryId"] = "SGD:" + item.sgdid
                    item = combined_list[item_key]["locus_obj"]
                    obj["geneSynopsis"] = item.description
                    obj["geneLiteratureUrl"] = "http://www.yeastgenome.org/locus/" + item.sgdid + "/literature"
                    obj["symbol"] = item.systematic_name
                    result.append(obj)

                else:
                    obj["primaryId"] = "SGD:" + item.sgdid
                    item = combined_list[item_key]["locus_obj"]
                    obj["geneSynopsis"] = item.description
                    obj["geneLiteratureUrl"] = "http://www.yeastgenome.org/locus/" + item.sgdid + "/literature"
                    obj["symbol"] = item.systematic_name
                  
                    result.append(obj)
            if(len(result) == 5):
                pdb.set_trace()
                f = 'felix'




    '''{"
            crossReferenceIds": ["UniProtKB:A0A023PXG3"], 
            "primaryId": "SGD:S000028797", 
            "symbol": "YIL156W-A", 
            "genomeLocations": [{"startPosition": 47292,
            "chromosome": "IX", 
            "assembly": "R64-2-1", 
            "endPosition": 47693, "strand": "+"}], 
            "soTermId": "SO:0000236", 
            "taxonId": "NCBITaxon:559292", 
            "synonyms": ["YIL156W-A"], 
            "geneLiteratureUrl": "http://www.yeastgenome.org/locus/S000028797/literature", 
            "geneSynopsis": "Dubious open reading frame; unlikely to encode a functional protein, based on available experimental and comparative sequence data; overlaps ORF COA1/YIL157C"}'''



def combine_panther_locus_list(panther_list, locus_list):
    combined_list = {}
    if(len(panther_list) > 0 and len(locus_list) > 0):
        for item in locus_list:
            obj = {
                "panther_id": "",
                "locus_obj": ""
            }
            if(panther_list.get(item.sgdid) is not None):
                obj["panther_id"] = panther_list.get(item.sgdid)
                obj["locus_obj"] = item
                combined_list[item.dbentity_id] = obj
            else:
                obj["panther_id"] = None
                obj["locus_obj"] = item
                combined_list[item.dbentity_id] = obj
    return combined_list

def get_locus_alias_data(locus_alias_list, id):
    data_container = {}
    aliases = []
    aliases_types = ["Uniform", "Non-uniform"]
    for item in locus_alias_list:
        if(item.alias_type in aliases_types):
            aliases.append(item.display_name)

        if(item.alias_type == "SGDID Secondary"):
            obj = {
                "secondaryIds": [],
                "locus_id": id
            }
            obj["secondaryIds"].append(item.source.format_name+":" + item.display_name)

            data_container[item.alias_id] = obj
        else:
            obj = {
                "crossReferenceIds": [],
                "locus_id": id
            }
            obj["crossReferenceIds"].append(item.source.format_name + ":" + item.display_name)

            data_container[item.alias_id] = obj

    data_container["aliases"] = aliases
    return data_container

#get_sgdids_for_panther()
get_bgi_data()
# TODO:delete section below later
################################# test functions ##############################################

'''def get_systematic_names():
    obj = {"data": ""}
    _data = DBSession.query(Locusdbentity.systematic_name).filter(
        Locusdbentity.not_in_s288c == False).all()

    if(len(_data) > 0):
        temp_data = ["%s" % x for x in _data]
        temp_arr = json.dumps(temp_data, ensure_ascii=False)
        obj["data"] = temp_arr

        with open('./scripts/bgi_json/data_dump/systematic_names.txt', 'w+') as outfile:
            outfile.write(
                temp_arr.replace('"', '').replace('[', '').replace(']', ''))


def get_SGDIDs_from_file():
    primary_ids = []
    with open('./scripts/bgi_json/data_dump/dump.json') as data_file:
        data = json.load(data_file)
        for item in data["data"]:
            primary_ids.append(str(item["primaryId"]).split(':')[1])

    diff_arrays(primary_ids)
    _data = DBSession.query(Locusdbentity).filter(Locusdbentity.description != None, Locusdbentity.not_in_s288c == False).all()
    test = []
    for loc in _data:
        test_obj = {
            "sys_name": loc.systematic_name,
            "gene_name": loc.gene_name,

        }
        test.append(test_obj)
    temp1 = json.dumps(test, ensure_ascii=False)
    with open('./scripts/bgi_json/data_dump/gene_with_names.txt', 'w+') as outfile:
        outfile.write(temp1.replace('"', '').replace('[', '').replace(']', ''))
    temp = json.dumps(primary_ids, ensure_ascii=False)
    with open('./scripts/bgi_json/data_dump/primaryIds.txt', 'w+') as outfile:
        pdb.set_trace()
        outfile.write(temp.replace('"', '').replace('[', '').replace(']', ''))


def diff_arrays(ids_arr):
    #submitted_data = DBSession.query(Locusdbentity).filter(Locusdbentity.sgdid.in_(ids_arr), Locusdbentity.not_in_s288c == False).all()
    new_data = DBSession.query(Locusdbentity).filter(Locusdbentity.not_in_s288c == False, Locusdbentity.description != None).all()
    #result_diff = list(set(new_data) - set(submitted_data))
    temp = []
    for loc in new_data:
        temp.append(loc.sgdid)
    result = json.dumps(temp, ensure_ascii=False)
    with open('./scripts/bgi_json/data_dump/sgd_ids_for_panther.txt',
              'w+') as res_file:
        res_file.write(result.replace('"', '').replace('[', '').replace(']', ''))'''
