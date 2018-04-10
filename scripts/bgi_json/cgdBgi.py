import os
import json
import re
import time
import logging
import csv

from random import randint
from datetime import datetime

'''
    Process a CSV file of downloads, create filedbentity entries, file_path entries, and
    finds the file on the remote download server via SSH, then uploads to s3 and updates s3_path.

    example
        $ source dev_variables.sh && INPUT_FILE_NAME=/data/agr-cgd/C_albicans_SC5314_A22_current_chromosomal_feature.txt python scripts/bgi_json/cgdBgi.py
'''

INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')

logging.basicConfig(level=logging.INFO)


def get_bgi_cgd_data():
    result = []
    o = open(INPUT_FILE_NAME,'rU')
    reader = csv.reader(o)
    reader = csv.reader(o, delimiter='\t')
    for i, val in enumerate(reader):
        if i > 0:
            if val[0] == '':
                logging.info('Found a blank value, DONE!')
                return
            feature_name = val[0].strip()
            gene_name = val[1].strip()
            aliases = val[2].strip().split('|')
            feature_type = val[3].strip()
            chromosome = val[4].strip()
            start_coordinate = int(val[5].strip())
            stop_coordinate = int(val[6].strip())
            strand = val[7].strip().replace('W', '+').replace('C', '-')
            primary_cgdid = val[8].strip()
            secondary_cgdid = val[9].strip()
            desc = val[10].strip()
            date_created = val[11].strip()
            seq_ver_dated = val[12].strip()
            #ortholog = val[13].strip()

            obj = {
                "crossReferences":
                    [],
                "primaryId":
                    primary_cgdid,
                "secondaryIds":
                    [feature_name],
                "symbol":
                    gene_name,
                "genomeLocations": [{
                    "startPosition": start_coordinate,
                    "chromosome": chromosome,
                    "assembly": "A22-s07-m01-r52",
                    "endPosition": stop_coordinate,
                    "strand": strand
                }],
                "soTermId":
                    "SO:0000236",
                "taxonId":
                    "NCBITaxon:237561",
                "synonyms":
                    aliases,
                "geneSynopsis":
                    desc
            }
            result.append(obj)
        i = 0

    if (len(result) > 0):
        output_obj = {
            "data": result,
            "metaData": {
                "dataProvider":
                    "CGD",
                "dateProduced":
                    datetime.utcnow().strftime("%Y-%m-%dT%H:%m:%S-00:00"),
                "release":
                    "CGD 1.0.0.0 " + datetime.utcnow().strftime("%Y-%m-%d")
            }
        }
        fileStr = '/data/agr-cgd/CGD.1.0.0.0_basicGeneInformation_' + str(randint(0, 1000)) + '.json'
        with open(fileStr, 'w+') as res_file:
            res_file.write(json.dumps(output_obj))


if __name__ == '__main__':
    start_time = time.time()
    print "--------------start loading genes--------------"
    get_bgi_cgd_data()
    with open('/data/agr-cgd/log_time.txt', 'w+') as res_file:
        time_taken = "time taken: " + ("--- %s seconds ---" % (time.time() - start_time))
        res_file.write(time_taken)
    print "--------------done loading genes--------------"