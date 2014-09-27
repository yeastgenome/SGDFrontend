import logging
import string
import datetime
import json
import uuid
import urllib
import base64
import requests
from pyramid.config import Configurator
from pyramid.renderers import JSONP, render
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound
from src.sgd.frontend.frontend_interface import FrontendInterface
from src.sgd.frontend.yeastgenome.backendless.load_data_from_file import get_data

class YeastgenomeFrontend(FrontendInterface):
    def __init__(self, backend_url, heritage_url, log_directory):
        self.backend_url = backend_url
        self.heritage_url = heritage_url
        self.log = set_up_logging(log_directory, 'yeastgenome')
        
    def get_renderer(self, method_name):
        if method_name in {'home', 'download_table', 'download_citations'}:
            return None
        elif method_name in {'header', 'footer', 'enrichment'}:
            return 'jsonp'
        else:
            return 'src:sgd/frontend/yeastgenome/static/templates/' + method_name + '.jinja2'
    
    def response_wrapper(self, method_name, request):
        request_id = str(uuid.uuid4())
        callback = None if 'callback' not in request.GET else request.GET['callback']
        self.log.info(request_id + ' ' + method_name + ('' if 'identifier' not in request.matchdict else ' ' + request.matchdict['identifier']))
        def f(data):
            self.log.info(request_id + ' end')
            if callback is not None:
                return Response(body="%s(%s)" % (callback, data), content_type='application/json')
            else:
                return data
        return f

    def locus(self, bioent_repr):
        locus = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        tabs = get_json(self.backend_url + '/locus/' + str(locus['id']) + '/tabs')

        page = {
                    #Basic info
                    'locus': locus,
                    'locus_js': json.dumps(locus),
                    'tabs': tabs

                    }
        return page
    
    def interaction_details(self, bioent_repr):
        return self.locus(bioent_repr)

    def literature_details(self, bioent_repr):
        return self.locus(bioent_repr)
    
    def regulation_details(self, bioent_repr):
        return self.locus(bioent_repr)
    
    def phenotype_details(self, bioent_repr):
        return self.locus(bioent_repr)

    def expression_details(self, bioent_repr):
        return self.locus(bioent_repr)
    
    def go_details(self, bioent_repr):
        return self.locus(bioent_repr)

    def protein_details(self, bioent_repr):
        return self.locus(bioent_repr)

    def sequence_details(self, bioent_repr):
        return self.locus(bioent_repr)

    def curator_sequence(self, bioent_repr):
        return self.locus(bioent_repr)

    def get_obj(self, obj_type, obj_repr, obj_url=None):
        if obj_url is None:
            obj_url = self.backend_url + '/' + obj_type + '/' + obj_repr + '/overview'

        obj = get_json(obj_url)

        page = {
                    #Basic info
                    obj_type: obj,
                    obj_type + '_js': json.dumps(obj)
                    }
        return page

    def strain(self, strain_repr):
        return self.get_obj('strain', strain_repr)

    def ecnumber(self, biocon_repr):
        return self.get_obj('ecnumber', biocon_repr)

    def dataset(self, bioitem_repr):
        return self.get_obj('dataset', bioitem_repr)

    def tag(self, tag_repr):
        return self.get_obj('tag', tag_repr)

    def experiment(self, experiment_repr):
        return self.get_obj('experiment', experiment_repr)
    
    def phenotype(self, biocon_repr):
        return self.get_obj('phenotype', biocon_repr)
    
    def observable(self, biocon_repr):
        return self.get_obj('observable', biocon_repr)
    
    def phenotype_ontology(self):
        return self.get_obj('ontology', None, obj_url=self.backend_url + '/observable/ypo/overview')
    
    def go(self, biocon_repr):
        return self.get_obj('go_term', None, obj_url=self.backend_url + '/go/' + biocon_repr + '/overview')

    def go_ontology(self, biocon_repr):
        return self.get_obj('ontology', None, obj_url=self.backend_url + '/go/' + biocon_repr + '/overview')
    
    def chemical(self, chemical_repr):
        return self.get_obj('chemical', chemical_repr)

    def domain(self, domain_repr):
        return self.get_obj('domain', domain_repr)

    def reserved_name(self, reserved_name_repr):
        return self.get_obj('reserved_name', reserved_name_repr)

    def reference(self, reference_repr):
        return self.get_obj('reference', reference_repr)

    def author(self, author_repr):
        return self.get_obj('author', author_repr)

    def contig(self, contig_repr):
        return self.get_obj('contig', contig_repr)

    def references_this_week(self):
        page = {}
        return page
    
    def home(self):
        if self.heritage_url is None:
            return Response('Temporary.')
        else:
            page = urllib.urlopen(self.heritage_url).read()
            return Response(page)
        
    def redirect(self, page, params):
        if page == 'interaction':
            if len(params) > 0:
                return HTTPFound('/locus/' + params.values()[0] + '/interaction')
            else:
                page = urllib.urlopen(self.heritage_url + '/cgi-bin/interaction_search').read()
                return Response(page)
        elif page == 'literature':
            if len(params) > 0:
                return HTTPFound('/locus/' + params.values()[0] + '/literature')
        elif page == 'protein':
            if len(params) > 0:
                return HTTPFound('/locus/' + params.values()[0] + '/protein')
        elif page == 'expression':
            del params['type']
            if len(params) > 0:
                return HTTPFound('/locus/' + params.values()[0] + '/expression')
        elif page == 'locus':
            if len(params) > 0:
                return HTTPFound('/locus/' + params.values()[0] + '/overview')
        elif page == 'phenotype':
            if 'phenotype' in params:
                old_phenotype = params['phenotype'].split(':')
                if len(old_phenotype) > 1:
                    new_phenotype = (old_phenotype[1] + ' ' + old_phenotype[0]).strip().replace(' ', '_').replace('/', '-')
                    if 'property_value' in params:
                        if 'chemicals' in new_phenotype:
                            new_phenotype = new_phenotype.replace('chemicals', params['property_value'].replace(' ', '_').replace('|', '_and_'))
                        elif 'chemical_compound' in new_phenotype:
                            new_phenotype = new_phenotype.replace('chemical_compound', params['property_value'].replace(' ', '_'))
                else:
                    new_phenotype = old_phenotype[0]
                return HTTPFound('/phenotype/' + new_phenotype + '/overview')
            elif 'dbid' in params:
                return HTTPFound('/locus/' + params['dbid'] + '/phenotype')
            elif 'observable' in params:
                return HTTPFound('/observable/' + params['observable'].replace(' ', '_') + '/overview')
            elif 'property_value' in params:
                return HTTPFound('/chemical/' + params['property_value'].replace(' ', '_') + '/overview')
        elif page == 'go':
            if len(params) > 0:
                return HTTPFound('/locus/' + params.values()[0] + '/go')
        elif page == 'go_term':
            if len(params) > 0:
                if params.values()[0].startswith('GO:'):
                    return HTTPFound('/go/' + params.values()[0] + '/overview')
                else:
                    return HTTPFound('/go/GO:' + str(int(params.values()[0])).zfill(7) + '/overview')
        elif page == 'reference':
            if 'author' in params:
                return HTTPFound('/author/' + params.values()[0].replace(' ', '_') + '/overview')
            elif 'topic' in params:
                topic = params.values()[0]
                page = urllib.urlopen(self.heritage_url + '/cgi-bin/reference/reference.pl?topic=' + topic + '&rm=multi_ref_result').read()
                return Response(page)
            elif 'rm' in params and 'topic_group' in params and 'page' in params:
                page = urllib.urlopen(self.heritage_url + '/cgi-bin/reference/reference.pl?rm=' + params['rm'] + '&topic_group=' + params['topic_group'] + '&page=' + params['page']).read()
                return Response(page)
            elif 'doi' in params:
                return HTTPFound('/reference/doi:' + params.values()[0].replace(' ', '_').replace('/', '-').lower() + '/overview')
            elif len(params) > 0:
                return HTTPFound('/reference/' + params.values()[0].replace(' ', '_').replace('/', '-') + '/overview')
        else:
            return Response(status_int=500, body='Invalid URL.')
    
    def header(self):
        header_str = render('templates/header.jinja2', {})
        return {'header': header_str}

    def footer(self):
        footer_str = render('templates/footer.jinja2', {})
        return {'footer': footer_str}
    
    def download_table(self, response, header_info, data, display_name):
        headers = response.headers

        date = datetime.datetime.now().strftime("%m/%d/%Y")
        description = "!\n!Date: " + date + '\n' + "!From: Saccharomyces Genome Database (SGD) \n!URL: http://www.yeastgenome.org/ \n!Contact Email: sgd-helpdesk@lists.stanford.edu \n!Funding: NHGRI at US NIH, grant number 5-P41-HG001315 \n!"

        cutoff = 1
        if header_info[1] == 'Analyze ID':
            if header_info[2] == '':
                cutoff = 3
            else:
                cutoff = 2

        table_header = description + '\n\n' + '\t'.join(header_info[cutoff:])

        for row in data:
            try:
                [clean_cell(cell) for cell in row[cutoff:]]
            except:
                print row

        response.text = table_header + '\n' + '\n'.join(['\t'.join([clean_cell(cell) for cell in row[cutoff:]]) for row in data])

        exclude = set([x for x in string.punctuation if x != ' ' and x != '_'])
        display_name = ''.join(ch for ch in display_name if ch not in exclude).replace(' ', '_')

        headers['Content-Type'] = 'text/plain; charset=utf-8'
        headers['Content-Disposition'] = str('attachment; filename=' + display_name.replace(' ', '_').replace('(', '').replace(')', '') + '.txt')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def download_image(self, response, data, display_name):
        headers = response.headers
        response.body = base64.b64decode(data[22:])

        exclude = set([x for x in string.punctuation if x != ' ' and x != '_'])
        display_name = ''.join(ch for ch in display_name if ch not in exclude).replace(' ', '_')
        
        headers['Content-Type'] = 'image/png;'      
        headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.png')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def download_citations(self, response, reference_ids, display_name):
        reference_ids = list(set(reference_ids))
        references = get_json(self.backend_url + '/reference_list', data={'reference_ids': reference_ids})
        
        headers = response.headers

        exclude = set([x for x in string.punctuation if x != ' ' and x != '_'])
        display_name = ''.join(ch for ch in display_name if ch not in exclude).replace(' ', '_')
        
        response.text = '\n' + '\n\n'.join([ref['text'] for ref in references])
        
        headers['Content-Type'] = 'text/plain'        
        headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.nbib')
        headers['Content-Description'] = 'File Transfer'
        return response

    def download_sequence(self, response, sequence, display_name, contig_name):
        headers = response.headers

        exclude = set([x for x in string.punctuation if x != ' ' and x != '_'])
        display_name = ''.join(ch for ch in display_name if ch not in exclude).replace(' ', '_')

        response.text = '>' + display_name + '  ' + contig_name + '\n' + clean_cell(sequence.replace(' ', ''))
        headers['Content-Type'] = 'text/plain'
        if contig_name is not None and contig_name != '':
            headers['Content-Disposition'] = str('attachment; filename=' + display_name + '_' + contig_name + '_sequence.fsa')
        else:
            headers['Content-Disposition'] = str('attachment; filename=' + display_name + '_sequence.fsa')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def analyze(self, list_name, bioent_ids):
        bioent_ids = list(set([int(x) for x in bioent_ids]))
            
        bioents = get_json(self.backend_url + '/bioentity_list', data={'bioent_ids': bioent_ids})
    
        if bioents is None:
            return Response(status_int=500, body='Bioents could not be found.') 
        
        page = {    
                    #Basic Info
                    'list_name_html': list_name,
                    'list_name': clean_cell(list_name).replace(' ', '_'),
                    'bioents': json.dumps(bioents),
                }
        return page

    def locus_list(self, list_name):
        objects = get_json(self.backend_url + '/all/' + list_name)
        page = {
                    #Basic Info
                    'list_name': list_name,
                    'bioents': json.dumps(objects),

                    #Links
                    'download_table_link': '/download_table'
                }
        return page
    
    def enrichment(self, bioent_ids):
        enrichment_results = get_json(self.backend_url + '/go_enrichment', data={'bioent_ids': bioent_ids})
        return enrichment_results

    def backend(self, url_repr):
        if self.backend_url == 'backendless':
            return json.dumps(get_data(url_repr))
        else:
            return json.dumps(get_json(self.backend_url + '/' + ('/'.join(url_repr))))

    
def yeastgenome_frontend(backend_url, heritage_url, log_directory, **configs):
    chosen_frontend = YeastgenomeFrontend(backend_url, heritage_url, log_directory)
    
    settings = dict(configs)
    settings.setdefault('jinja2.i18n.domain', 'myproject')
    config = Configurator(settings=settings)
    config.add_translation_dirs('locale/')
    config.include('pyramid_jinja2')
    
    config.add_static_view('static', 'src:sgd/frontend/yeastgenome/static')
    config.add_static_view('img-domain', 'src:sgd/frontend/yeastgenome/img-domain')
    config.add_renderer('jsonp', JSONP(param_name='callback'))

    return chosen_frontend, config

def get_json(url, data=None):
    if url.startswith('backendless'):
        return get_data(url[12:].split('/'))
    else:
        if data is not None:
            headers = {'Content-type': 'application/json; charset=utf-8"', 'processData': False}
            r = requests.post(url, data=json.dumps(data), headers=headers)
        else:
            r = requests.get(url)
    return r.json()

def set_up_logging(log_directory, label):
    logging.basicConfig(format='%(asctime)s %(name)s: %(message)s', level=logging.ERROR)
    log = logging.getLogger(label)

    if log_directory is not None:
        hdlr = logging.FileHandler(log_directory + '/' + label + '.' + str(datetime.datetime.now().date()) + '.txt')
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
        if isinstance(cell, int):
            cell = str(cell)
        cell = cell.replace('<br>', ' ')
        result = remove_html(cell)
        while result is not None:
            cell = result
            result = remove_html(cell)
        return cell
