'''
author: fgondwe@stanford.edu
purpose: format panther data and return key value pair with sgdids
date: 05/04/2018
'''

import json
import pdb 


def FormatPantherDataSGD():
    # get data to iterate
    with open('panther_json.json') as data_file:
        content = json.load(data_file)
    temp_data = []
    if content:
        for item in content
            #pdb.set_trace()
            print(item)

FormatPantherDataSGD()
