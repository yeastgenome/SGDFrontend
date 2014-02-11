from datetime import datetime
from sgdfrontend_utils import link_maker
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

def get_bioent(backend_url, bioent_repr):
    bioent = get_json(link_maker.bioentity_overview_link(backend_url, bioent_repr))
    if bioent is None:
        raise Exception('Bioentity not found.')
    return bioent   

def get_phenotype(backend_url, biocon_repr):
    biocon = get_json(link_maker.phenotype_link(backend_url, biocon_repr))
    if biocon is None:
        raise Exception('Bioconcept not found.')
    return biocon   

def get_chemical(backend_url, chem_repr):
    chem = get_json(link_maker.chemical_link(backend_url, chem_repr))
    if chem is None:
        raise Exception('Chemical not found.')
    return chem

def get_complex(backend_url, complex_repr):
    print link_maker.complex_link(backend_url, complex_repr)
    comp = get_json(link_maker.complex_link(backend_url, complex_repr))
    if comp is None:
        raise Exception('Complex not found.')
    return comp

def get_reference(backend_url, ref_repr):
    ref = get_json(link_maker.reference_link(backend_url, ref_repr))
    if ref is None:
        raise Exception('Reference not found.')
    return ref

def get_author(backend_url, author_repr):
    author = get_json(link_maker.author_link(backend_url, author_repr))
    if author is None:
        raise Exception('Author not found.')
    return author

def get_go(backend_url, biocon_repr):
    biocon = get_json(link_maker.go_link(backend_url, biocon_repr))
    if biocon is None:
        raise Exception('Bioconcept not found.')
    return biocon      

def set_up_logging(log_directory, label):
    logging.basicConfig(format='%(asctime)s %(name)s: %(message)s', level=logging.ERROR)
    log = logging.getLogger(label)
    
    if log_directory is not None:
        hdlr = logging.FileHandler(log_directory + '/' + label + '.' + str(datetime.now().date()) + '.txt')
        formatter = logging.Formatter('%(asctime)s %(name)s: %(message)s')
        hdlr.setFormatter(formatter)
    else:
        hdlr = logging.NullHandler()
    log.addHandler(hdlr) 
    log.setLevel(logging.INFO)
    log.propagate = False
    return log

def remove_html(html):
    start_tag_start = None
    start_tag_end = None
    end_tag_start = None
    end_tag_end = None
    state = 'beginning'
    key = None
    i = 0
    for letter in html:
        if state == 'beginning' and letter == '<':
            start_tag_start = i
            state = 'in_key'
        elif state == 'in_key' and letter == ' ':
            key = html[start_tag_start+1:i]
            state = 'in_start_tag'
        elif state == 'in_key' and letter == '>':
            key = html[start_tag_start+1:i]
            start_tag_end = i+1
            state = 'middle'
        elif state == 'in_start_tag' and letter == '>':
            start_tag_end = i+1
            state = 'middle'
        elif state == 'middle' and letter == '<' and html[i:].startswith('</' + key + '>'):
            end_tag_start = i
            end_tag_end = i + 2 + len(key) + 1
            state = 'done'
        i = i+1
    if state == 'done':
        no_html = html[0:start_tag_start] + html[start_tag_end:end_tag_start] + html[end_tag_end:]
        no_html = no_html.replace('<br>', '')
        return no_html
    else:
        return None

def clean_cell(cell):
    if cell is None:
        return ''
    else:
        cell = cell.replace('<br>', ' ')
        result = remove_html(cell)
        while result is not None:
            cell = result
            result = remove_html(cell)
        return cell