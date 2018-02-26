'''
author: fgondwe@stanford.edu
purpose: Convert disease-text file to json
date: 02/15/2018
'''

import json 
from datetime import datetime
import dateutil.parser as parser 
from random import *

#sample data
'''{
        "DOid": "DOID:162", 
        "taxonId": "taxon:559292", 
        "objectRelation": 
        {"associationType": "causes_or_contributes_to_condition", "objectType": "gene"}, 
        "objectId": "SGD:S000001015", 
        "dateAssigned": "2017-04-12T00:00:00-07:00", 
        "dataProvider": "SGD", "with": ["HGNC:18423"], 
        "evidence": [
            {
                "evidenceCode": "IMP,ISS", 
                "publications": 
                [
                    {
                        "pubMedId": "PMID:23716719"
                    }
                ]
            }
        ]
    }'''
    '''obj = {
        "DOid":
            "",
        "taxonId":
            "",
        "objectRelation": {
            "associationType": "",
            "objectType": ""
        },
        "objectId":
            "",
        "dateAssigned":
            "",
        "dataProvider":
            "SGD",
        "with": [],
        "evidence": [{
            "evidenceCode": "",
            "publications": [{
                "pubMedId": ""
            }]
        }]
    }'''

def txtJson():
    temp_data = []
    with open('output.json') as data_file:
        content = json.load(data_file)

    for item in content:
        obj = {
            "DOid":
                "",
            "taxonId":
                "",
            "objectRelation": {
                "associationType": "",
                "objectType": ""
            },
            "objectId":
                "",
            "dateAssigned":
                "",
            "dataProvider":
                "SGD",
            "with": [],
            "evidence": [{
                "evidenceCode": "",
                "publications": {
                    "pubMedId": ""
                }
            }]
        }
        obj["DOid"] = item[6]
        obj["taxonId"] = item[0]
        obj["objectRelation"]["associationType"] = item[5]
        obj["objectRelation"]["objectType"] = item[1]
        obj["objectId"] = item[2]
        obj["dateAssigned"] = str(
            datetime.strptime(str(item[10]), "%Y%m%d").isoformat())
        obj["dataProvider"] = item[11]
        obj["with"].append(item[7])
        obj["evidence"][0]["evidenceCode"] = item[8]
        obj["evidence"][0]["publications"]["pubMedId"]["PMID"] = item[9]
        temp_data.append(obj)

    dateStr = datetime.now().isoformat()
    data_obj = {
        "data": json.dumps(temp_data),
        "metaData": {"dateProduced": dateStr, "dataProvider": "SGD"}
    }
    jstr = json.dumps(temp_data)
