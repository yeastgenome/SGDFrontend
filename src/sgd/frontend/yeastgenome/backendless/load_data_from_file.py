__author__ = 'kpaskov'

import json
import os

def get_data(url):
    if url.startswith('/') or url.startswith('.'):
        url = url[1:]
    f = open(os.getcwd() + '/src/sgd/frontend/yeastgenome/backendless/data/' + url.replace('/', '.').lower() + '.json', 'r')
    data = json.load(f)
    f.close()
    return data
