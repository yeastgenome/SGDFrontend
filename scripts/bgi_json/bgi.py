from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Eco, Locusdbentity, LocusUrl, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_, inspect
import os
import json
import re
import time
import sys
from random import randint
#from pycallgraph import PyCallGraph
#from pycallgraph.output import GraphvizOutput
from datetime import datetime
from threading import Thread
import concurrent.futures

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine



# populate text file with sgdis to be used to retrieve panther data
def get_sgdids_for_panther():
    new_data = Locusdbentity.get_s288c_genes()
    temp = []
    for loc in new_data:
        temp.append(loc.sgdid)
    result = json.dumps(temp, ensure_ascii=False)
    with open('./scripts/bgi_json/data_dump/sgd_ids_for_panther.txt',
              'w+') as res_file:
        res_file.write(
            result.replace('"', '').replace('[', '').replace(']', ''))


# pair pantherIds with corresponding sgdids
def get_panther_sgdids():
    data_dict = {}
    with open('./scripts/bgi_json/data_dump/panther/panther_search_results.json') as json_data_file:
        json_data = json.load(json_data_file)
        for item in json_data:
            temp_str = ','.join(map(str, item))
            reg_pattern = r'(SGD=S\d+)|(PTHR\d+)'
            reg_result = sorted(list(set(re.findall(reg_pattern, temp_str))))
            if(len(reg_result) > 1):
                item_str1 = ''.join(reg_result[0])
                item_str2 = ''.join(reg_result[1]).split("=")
                data_dict[item_str2[1]] = item_str1
            elif(len(reg_result) == 1):
                item_str1 = ''.join(reg_result[0]).split("=")
                data_dict[item[1]] = None
            else:
                continue

        return data_dict


# pupulate json file with basic gene infromation(bgi)
def get_bgi_data(soFlag=False):
    combined_list = combine_panther_locus_list(get_panther_sgdids(), Locusdbentity.get_s288c_genes())
    print(("computing " + str(len(combined_list)) + " genes"))
    result = []
    if(len(combined_list) > 0):

        with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
            for item_key in combined_list:
                obj = {
                    "crossReferences":
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
                    "geneSynopsis":
                        ""
                }
                item = combined_list[item_key]["locus_obj"]
                temp_itm = ["gene"]
                temp_itm.append("gene/references")
                temp_itm.append("homepage")
                if(item.has_expression):
                    temp_itm.append("gene/expression")
                    temp_itm.append("gene/spell")
                if(item.has_interaction):
                    temp_itm.append("gene/interactions")
                if(item.has_disease):
                    temp_itm.append("gene/disease")

                obj["crossReferences"].append({"id": "SGD:"+item.sgdid, "pages": temp_itm})
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
                        strnd = ""
                        if dna_seq_annotation_obj[0].strand == "0":
                            strnd = "."
                        else:
                            strnd = dna_seq_annotation_obj[0].strand
                        chromosome = dna_seq_annotation_obj[0].contig.display_name.split(" ")
                        obj["genomeLocations"][0]["startPosition"] = dna_seq_annotation_obj[0].start_index
                        obj["genomeLocations"][0]["endPosition"] = dna_seq_annotation_obj[0].end_index
                        obj["genomeLocations"][0]["strand"] = strnd
                        obj["genomeLocations"][0]["startPosition"] = dna_seq_annotation_obj[0].start_index
                        obj["genomeLocations"][0]["chromosome"] = "chr"+chromosome[1]
                        if dna_seq_annotation_obj[0].so.so_id == 263757:
                            obj["soTermId"] = "SO:0001217"
                        else:
                            obj["soTermId"] =  dna_seq_annotation_obj[0].so.soid
                    mod_locus_alias_data = get_locus_alias_data(locus_alias_data, item.dbentity_id, item)

                    for mod_item in mod_locus_alias_data:
                        mod_value = mod_locus_alias_data.get(mod_item)
                        if (type(mod_value) is list):
                            if (mod_locus_alias_data.get("aliases") is not None):
                                obj["synonyms"] = mod_locus_alias_data.get(
                                    "aliases")

                        else:
                            if (mod_value.get("secondaryIds") is not None):
                                temp_sec_item = mod_value.get("secondaryIds")
                                if(len(temp_sec_item) > 0):
                                    if(item.name_description is not None):
                                        obj["name"] = item.name_description
                                    if(len(temp_sec_item) > 1):
                                        obj["secondaryIds"] = [str(x) for x in temp_sec_item]
                                    else:
                                        if(len(temp_sec_item) == 1):
                                            obj["secondaryIds"] = [str(temp_sec_item[0])]
                            if (mod_value.get("crossReferences") is not None):
                                temp_cross_item = mod_value.get("crossReferences")
                                if(len(temp_cross_item) > 1):
                                    for x_ref in temp_cross_item:
                                        obj["crossReferences"].append({"id": str(x_ref)})
                                else:
                                    if(len(temp_cross_item) == 1):
                                        obj["crossReferences"].append({"id": str(temp_cross_item[0])})
                                        #obj["crossReferences"] = [str(temp_cross_item[0])]
                    if(item_panther is not None):
                        obj["crossReferences"].append({"id": "PANTHER:" + item_panther})
                        #obj["crossReferences"].append("PANTHER:" + item_panther)
                        obj["primaryId"] = "SGD:" + item.sgdid
                        item = combined_list[item_key]["locus_obj"]
                        obj["geneSynopsis"] = item.description
                        obj["symbol"] = item.gene_name if item.gene_name is not None else item.systematic_name
                        obj["synonyms"].append(item.systematic_name)
                        result.append(obj)

                    else:
                        obj["primaryId"] = "SGD:" + item.sgdid
                        item = combined_list[item_key]["locus_obj"]
                        obj["geneSynopsis"] = item.description
                        obj["symbol"] = item.gene_name if item.gene_name is not None else item.systematic_name
                        obj["synonyms"].append(item.systematic_name)
                        result.append(obj)
            if(len(result) > 0):
                output_obj = {
                    "data": result,
                    "metaData": {
                        "dataProvider": {
                            "crossReference": {
                                "id":"SGD",
                                "pages": ["homepage"]
                            },
                            "type": "curated"
                        },
                        "dateProduced": datetime.utcnow().strftime("%Y-%m-%dT%H:%m:%S-00:00"),
                        "release": "SGD 1.0.0.7 " + datetime.utcnow().strftime("%Y-%m-%d")
                    }
                }
                fileStr = './scripts/bgi_json/data_dump/SGD_1.0.0.7_basicGeneInformation.' + str(randint(0, 1000)) + '.json'
                with open(fileStr, 'w+') as res_file:
                    res_file.write(json.dumps(output_obj))

# create single gene list containing genes with pantherids and genes without pantherids
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


# helper method to get locus_alias data
def get_locus_alias_data(locus_alias_list, id, item_obj):
    data_container = {}
    aliases = []
    aliases_types = ["Uniform", "Non-uniform"]
    aliases_types_other = ["SGDID Secondary", "UniProtKB ID", "Gene ID"]
    obj = {
        "secondaryIds": [],
         "crossReferences": []
        }
    flag = False
    for item in locus_alias_list:
        if(item_obj):
            obj["crossReferences"].append
        if(item.alias_type in aliases_types):
            aliases.append(item.display_name)
        if(item.alias_type == "SGDID Secondary"):
            obj["secondaryIds"].append(item.source.display_name+":" + item.display_name)
            flag = True
        if (item.alias_type == "UniProtKB ID"):
            obj["crossReferences"].append("UniProtKB:" + item.display_name)
            flag = True
        if (item.alias_type == "Gene ID" and item.source.display_name == 'NCBI'):
            obj["crossReferences"].append("NCBI_Gene:" + item.display_name)
            flag = True

    if(flag):
        data_container[id] = obj
    data_container["aliases"] = aliases
    return data_container


def get_phenotype_data():
    _data = DBSession.query(Phenotypeannotation).all()
    result = []
    print(("computing " + str(len(_data)) + " phenotypes"))
    with concurrent.futures.ProcessPoolExecutor(max_workers=128) as executor:
        for item in _data:
            obj = {
                "objectId": "",
                "phenotypeTermIdentifiers": [],
                "phenotypeStatement": "",
                "dateAssigned": ""
            }
            if item.phenotype.qualifier:
                pString = item.phenotype.qualifier.display_name
                obj["phenotypeTermIdentifiers"].append({
                "termId": str(item.phenotype.qualifier.apoid),
                "termOrder": 1
                })
                if item.phenotype.observable:
                    pString = pString + " " +item.phenotype.observable.display_name
                    obj["phenotypeTermIdentifiers"].append({
                    "termId": str(item.phenotype.observable.apoid),
                    "termOrder": 2
                    })

            else:
                if item.phenotype.observable:
                    pString = item.phenotype.observable.display_name
                    obj["phenotypeTermIdentifiers"].append({
                    "termId": str(item.phenotype.observable.apoid),
                    "termOrder": 1
                    })
            obj["objectId"] = "SGD:" + str(item.dbentity.sgdid)
            obj["phenotypeStatement"] = pString
            obj["evidence"] = {
                "modPublicationId": "SGD:" + str(item.reference.sgdid),
                "pubMedId": "PMID:" + str(item.reference.pmid)
            }
            obj["dateAssigned"] = item.date_created.strftime(
                "%Y-%m-%dT%H:%m:%S-00:00")
            result.append(obj)

        if len(result) > 0:
            output_obj = {
                "data": result,
                "metaData": {
                    "dataProvider": {
                        "crossReference": {
                            "id":"SGD",
                            "pages": ["homepage"]
                        },
                        "type": "curated"
                    },
                    "dateProduced": datetime.utcnow().strftime("%Y-%m-%dT%H:%m:%S-00:00"),
                    "release": "SGD 1.0.0.7 " + datetime.utcnow().strftime("%Y-%m-%d")
                }
            }
            fileStr = './scripts/bgi_json/data_dump/SGD_1.0.0.7_phenotype.' + str(randint(0, 1000)) + '.json'
            with open(fileStr, 'w+') as res_file:
                res_file.write(json.dumps(output_obj))


def get_expression_data():
    CC = 'cellular component'
    desired_eco_ids = DBSession.query(Eco.eco_id).filter(Eco.format_name.in_(['ECO:0000314','ECO:0007005', 'ECO:0000353'])).all()
    DEFAULT_MMO = 'MMO:0000642'
    pmid_to_mmo = {
        14562095: 'MMO:0000662',
        26928762: 'MMO:0000662',
        16823961: 'MMO:0000534',
        24769239: 'MMO:0000534',
        22842922: 'MMO:0000662',
        14576278: 'MMO:0000534',
        11914276: 'MMO:0000662',
        22932476: 'MMO:0000662',
        24390141: 'MMO:0000662',
        16622836: 'MMO:0000664',
        26777405: 'MMO:0000662',
        12150911: 'MMO:0000662',
        14690591: 'MMO:0000662',
        10684247: 'MMO:0000534',
        16702403: 'MMO:0000662',
        16407407: 'MMO:0000534',
        19053807: 'MMO:0000662',
        23212245: 'MMO:0000534',
        12068309: 'MMO:0000662',
        9448009: 'MMO:0000662',
        11983894: 'MMO:0000534',
        19040720: 'MMO:0000534',
        15282802: 'MMO:0000662',
        24868093: 'MMO:0000662',
        10449419: 'MMO:0000534',
        12392552: 'MMO:0000534',
        8915539: 'MMO:0000647',
        10377396: 'MMO:0000534'
    }
    genes = Locusdbentity.get_s288c_genes()
    result = []
    print(("computing " + str(len(genes)) + " expression data points"))
    dbentity_id_to_mmo = {}
    for gene in genes:
        go_annotations = DBSession.query(Goannotation, Go).outerjoin(Go).filter(and_(\
            Goannotation.dbentity_id==gene.dbentity_id,\
            Goannotation.annotation_type != 'computational',\
            Goannotation.eco_id.in_(desired_eco_ids),\
            Go.go_namespace == CC,\
            Go.display_name!= CC\
        )).all()
        for x in go_annotations:
            annotation = x[0]
            ref_id = annotation.reference_id
            go = x[1]
            ref = DBSession.query(Referencedbentity.pmid, Referencedbentity.sgdid).filter(Referencedbentity.dbentity_id == ref_id).one_or_none()
            pmid = ref[0]
            sgdid = ref[1]
            mmo = None
            if ref_id in list(dbentity_id_to_mmo.keys()):
                mmo = dbentity_id_to_mmo[ref_id]
            else:
                if pmid not in list(pmid_to_mmo.keys()):
                    mmo = DEFAULT_MMO
                else:
                    mmo = pmid_to_mmo[pmid]
                dbentity_id_to_mmo[ref_id] = mmo
            obj = {
                "geneId": "SGD:" + str(gene.sgdid),
                "evidence": {
                    "modPublicationId":"SGD:" + sgdid,
                    "pubMedId": "PMID:" + str(pmid)
                },
                "whenExpressed": { "stageName": "N/A" },
                "whereExpressed": {
                    "cellularComponentTermId": go.format_name
                },
                "assay": mmo,
                "dateAssigned": annotation.date_created.strftime("%Y-%m-%dT%H:%m:%S-00:00")
            }
            result.append(obj)
    if len(result) > 0:
        output_obj = {
            "data": result,
            "metaData": {
                "dataProvider": {
                    "crossReference": {
                        "id": "SGD",
                        "pages": [ "homepage" ]
                    },
                    "type": "curated" 
                },
                "dateProduced": datetime.utcnow().strftime("%Y-%m-%dT%H:%m:%S-00:00"),
                "release": "SGD 1.0.0.7 " + datetime.utcnow().strftime("%Y-%m-%d")
            }
        }
        fileStr = './scripts/bgi_json/data_dump/SGD_1.0.0.7_expression.' + str(randint(0, 1000)) + '.json'
        with open(fileStr, 'w+') as res_file:
            res_file.write(json.dumps(output_obj))


# entry point
if __name__ == '__main__':
    print("--------------start computing data--------------")
    start_time = time.time()
    get_bgi_data()
    time_taken = "time taken: " + ("--- %s seconds ---" % (time.time() - start_time))
    print("------------------ bgi time taken: " + time_taken + " --------------------")
    with open('./scripts/bgi_json/data_dump/log_time_bgi.txt', 'w+') as res_file:
        time_taken = "time taken: " + ("--- %s seconds ---" %
                                       (time.time() - start_time))
        res_file.write(time_taken)
    second_start_time = time.time()
    get_phenotype_data()
    second_time_taken = "time taken: " + ("--- %s seconds ---" %
                                   (time.time() - second_start_time))
    print("------------------ phenotype time taken: " + second_time_taken + " --------------------")
    with open('./scripts/bgi_json/data_dump/log_time_pheno.txt', 'w+') as res_file_2:
        second_time_taken = "time taken: " + ("--- %s seconds ---" %
                                              (time.time() - second_start_time))
        res_file_2.write(second_time_taken)


    third_start_time = time.time()
    get_expression_data()
    third_time_taken = "time taken: " + ("--- %s seconds ---" %
                                   (time.time() - third_start_time))
    print("------------------ phenotype time taken: " + third_time_taken + " --------------------")
    with open('./scripts/bgi_json/data_dump/log_time_expresson.txt', 'w+') as res_file_3:
        third_time_taken = "time taken: " + ("--- %s seconds ---" %
                                              (time.time() - third_start_time))
        res_file_3.write(third_time_taken)
