__author__ = 'kpaskov'

import json
import os

def get_data(url):
    file_name = os.getcwd() + '/src/sgd/frontend/yeastgenome/backendless/data/' + '.'.join([x.lower() for x in url]) + '.json'
    f = open(file_name, 'r')
    data = json.load(f)
    f.close()
    return data
