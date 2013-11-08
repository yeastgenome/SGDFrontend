from datetime import datetime
from sgdfrontend.config import log_directory
import json
import logging
import requests

def get_json(url, data=None):
    if data is not None:
        headers = {'Content-type': 'application/json; charset=utf-8"', 'processData': False}
        r = requests.post(url, data=json.dumps(data), headers=headers)
    else:
        r = requests.get(url)
    return r.json()

def get_bioent(bioent_repr):
    from sgdfrontend_utils import bioentity_overview_link
    bioent = get_json(bioentity_overview_link(bioent_repr))
    if bioent is None:
        raise Exception('Bioentity not found.')
    return bioent        

def set_up_logging(label):
    logging.basicConfig(format='%(asctime)s %(name)s: %(message)s', level=logging.INFO)
    log = logging.getLogger(label)
    
    if log_directory is not None:
        hdlr = logging.FileHandler(log_directory + '/' + label + '.' + str(datetime.now().date()) + '.txt')
        formatter = logging.Formatter('%(asctime)s %(name)s: %(message)s')
        hdlr.setFormatter(formatter)
    else:
        hdlr = logging.NullHandler()
    log.addHandler(hdlr) 
    log.setLevel(logging.INFO)
    return log

def clean_cell(cell):
    if cell is None:
        return ''
    elif cell.startswith('<a href='):
        cell = cell[cell.index('>')+1:]
        cell = cell[:cell.index('<')]
        return cell
    else:
        return cell