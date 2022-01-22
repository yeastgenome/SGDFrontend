import logging
import string
import datetime
import json
import uuid
import urllib.request, urllib.parse, urllib.error
import base64
import requests
import os.path
import sys
import random
import re
from pyramid.config import Configurator
from pyramid.renderers import JSONP, render
from pyramid.response import Response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound
from pyramid.view import view_config
from src.sgd.frontend.yeastgenome.views.misc_views import not_found
from src.sgd.frontend.frontend_interface import FrontendInterface

class YeastgenomeFrontend(FrontendInterface):
    def __init__(self, backend_url, heritage_url, log_directory):
        self.backend_url = backend_url
        self.heritage_url = heritage_url
        self.log = set_up_logging(log_directory, 'yeastgenome')
        self.locuses = dict()
        self.now = datetime.datetime.now()
        
    def get_renderer(self, method_name):
        if method_name in ['home', 'download_table', 'download_citations']:
            return None
        elif method_name in ['header', 'footer', 'enrichment']:
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
                if data is not None:
                    return data
                else:
                    return HTTPNotFound()
        return f

    def check_date(self):
        new_time = datetime.datetime.now()
        if new_time.date() != self.now.date() and new_time.hour >= 3:
            self.locuses = dict()
            self.now = new_time
        return True

    def locus_list(self, list_name):
        return self.get_obj('locus_list', None, obj_url=self.backend_url + '/locus/' + list_name)
        
    def get_obj(self, obj_type, obj_repr, obj_url=None):
        if obj_url is None:
            obj_url = self.backend_url + '/' + obj_type + '/' + obj_repr

        try:
            obj = get_json(obj_url)
        except:
            return HTTPNotFound()

        if obj is None:
            return None

        # basic info
        return {
            obj_type: obj,
            obj_type + '_js': json.dumps(obj)
        }

    def strain(self, strain_repr):
        obj = self.get_obj('strain', strain_repr)
        # get the genbank url and add to obj
        genbank_url = None
        for url in obj['strain']['urls']:
            if url['category'] == 'genbank':
                genbank_url = url['link']
        obj['genbank_url'] = genbank_url
        return obj

    def ecnumber(self, biocon_repr):
        return self.get_obj('ecnumber', biocon_repr)

    def dataset(self, bioitem_repr):
        dataset = self.get_obj('dataset', bioitem_repr)
        return dataset

    def keyword(self, keyword_repr):
        return self.get_obj('keyword', keyword_repr)

    def experiment(self, experiment_repr):
        return self.get_obj('experiment', experiment_repr)
    
    def observable(self, biocon_repr):
        return self.get_obj('observable', biocon_repr)
    
    def phenotype_ontology(self):
        return self.get_obj('ontology', None, obj_url=self.backend_url + '/observable/ypo')
    
    def go(self, biocon_repr):
        return self.get_obj('go_term', None, obj_url=self.backend_url + '/go/' + biocon_repr)

    def go_ontology(self, biocon_repr):
        return self.get_obj('ontology', None, obj_url=self.backend_url + '/go/' + biocon_repr)

    def disease(self, biocon_repr):
        return self.get_obj('disease', None, obj_url=self.backend_url + '/disease/' + biocon_repr)

    def disease_ontology(self, biocon_repr):
        return self.get_obj('ontology', None, obj_url=self.backend_url + '/disease/' + biocon_repr)
    
    def chemical(self, chemical_repr):
        return self.get_obj('chemical', chemical_repr)

    def domain(self, domain_repr):
        return self.get_obj('domain', domain_repr)

    def reserved_name(self, reserved_name_repr):
        obj = self.get_obj('reservedname', reserved_name_repr)
        # Redirect to underlying locus page if the reservedname has a locus
        if 'reservedname_js' in obj:
            js_dict = json.loads(obj['reservedname_js'])
            if js_dict['locus']:
                return HTTPFound(js_dict['locus']['link'])
        return obj

    def author(self, author_repr):
        return self.get_obj('author', author_repr)

    def contig(self, contig_repr):
        return self.get_obj('contig', contig_repr)
                
    def redirect(self, page, params):
        if page == 'interaction':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/interaction')
            else:
                page = urllib.request.urlopen(self.heritage_url + '/cgi-bin/interaction_search').read()
                return Response(page)
        elif page == 'literature':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/literature')
        elif page == 'protein':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/protein')
        elif page == 'homology':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/homology')
        elif page == 'expression':
            del params['type']
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/expression')
        elif page == 'locus':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0])
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
                return HTTPFound('/phenotype/' + new_phenotype)
            elif 'dbid' in params:
                return HTTPFound('/locus/' + params['dbid'] + '/phenotype')
            elif 'observable' in params:
                return HTTPFound('/observable/' + params['observable'].replace(' ', '_'))
            elif 'property_value' in params:
                return HTTPFound('/chemical/' + params['property_value'].replace(' ', '_'))
        elif page == 'go':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/go')
        elif page == 'go_term':
            if len(params) > 0:
                if list(params.values())[0].startswith('GO:'):
                    return HTTPFound('/go/' + list(params.values())[0])
                else:
                    return HTTPFound('/go/GO:' + str(int(list(params.values())[0])).zfill(7))
        elif page == 'disease':
            if len(params) > 0:
                return HTTPFound('/locus/' + list(params.values())[0] + '/disease')
        elif page == 'do_term':
            if len(params) > 0:
                if list(params.values())[0].startswith('DO:'):
                    return HTTPFound('/disease/' + list(params.values())[0])
                else:
                    return HTTPFound('/disease/DO:' + str(int(list(params.values())[0])).zfill(7))
        elif page == 'reference':
            if 'author' in params:
                return HTTPFound('/author/' + list(params.values())[0].replace(' ', '_'))
            elif 'topic' in params:
                topic = list(params.values())[0]
                page = urllib.request.urlopen(self.heritage_url + '/cgi-bin/reference/reference.pl?topic=' + topic + '&rm=multi_ref_result').read()
                return Response(page)
            elif 'rm' in params and 'topic_group' in params and 'page' in params:
                page = urllib.request.urlopen(self.heritage_url + '/cgi-bin/reference/reference.pl?rm=' + params['rm'] + '&topic_group=' + params['topic_group'] + '&page=' + params['page']).read()
                return Response(page)
            elif 'doi' in params:
                return HTTPFound('/reference/doi:' + list(params.values())[0].replace(' ', '_').replace('/', '-').lower())
            elif len(params) > 0:
                return HTTPFound('/reference/' + list(params.values())[0].replace(' ', '_').replace('/', '-'))
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
        description = "!\n!Date: " + date + '\n' + "!From: Saccharomyces Genome Database (SGD) \n!URL: http://www.yeastgenome.org/ \n!Contact Email: sgd-helpdesk@lists.stanford.edu \n!Funding: NHGRI at US NIH, grant number 5-U41-HG001315 \n!"

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
                print(row)

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

    def download_sequence(self, response, sequence, filename, header):
        headers = response.headers

        response.text = '>' + header + '\n' + clean_cell('\n'.join([sequence[i:i+60] for i in range(0, len(sequence), 60)]))
        headers['Content-Type'] = 'text/plain'
        headers['Content-Disposition'] = str('attachment; filename=' + '"' + filename + '"')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def analyze(self, list_name, bioent_ids):
        bioent_ids = list(set([int(x) for x in bioent_ids if x is not None]))
            
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
    
    def enrichment(self, bioent_ids):
        enrichment_results = get_json(self.backend_url + '/go_enrichment', data={'bioent_ids': bioent_ids})
        return enrichment_results

    def backend(self, url_repr, request, args=None):
        relative_url = '/' + ('/'.join(url_repr))
        backend_url = self.backend_url
        full_url = backend_url + relative_url
        if request.method == 'POST':
            request_data = request.json_body
        else:
            request_data = None
        if args is not None and len(args) > 0:
            full_url += '?' + request.query_string
        self.log.info(full_url)
        try:
            return get_json(full_url, request_data)
        # prevent from returning 200 for failed backend requests
        except ValueError:
            return Response('null', status=404)
    
def yeastgenome_frontend(backend_url, heritage_url, log_directory, **configs):
    chosen_frontend = YeastgenomeFrontend(backend_url, heritage_url, log_directory)
    
    settings = dict(configs)

    settings.setdefault('jinja2.i18n.domain', 'myproject')
    configurator = Configurator(settings=settings)
    configurator.add_translation_dirs('locale/')
    configurator.include('pyramid_jinja2')


    # set global template var asset_root to read from cloudfront or local, depending on .ini value, default to False
    production_assets = configs.get('production_assets', False)
    if production_assets == 'True':
        file_path = os.path.dirname(os.path.realpath(__file__)) + '/../../../../production_asset_url.json'
        asset_root = json.load(open(file_path, 'r'))['url']
    else:
        asset_root = '/static'

    # put query string in global template variable
    def add_template_global(event):
        event['asset_root'] = asset_root
    configurator.add_subscriber(add_template_global, 'pyramid.events.BeforeRender')
    # cache everything for 1 month on browser
    configurator.add_static_view('static', 'src:sgd/frontend/yeastgenome/static', cache_max_age=2629740)
    configurator.add_static_view('img-domain', 'src:sgd/frontend/yeastgenome/img-domain', cache_max_age=2629740)
    configurator.add_renderer('jsonp', JSONP(param_name='callback'))

    return chosen_frontend, configurator

def get_json(url, data=None):
    if data is not None:
        headers = {'Content-type': 'application/json; charset="UTF-8"'}
        r = requests.post(url, data=json.dumps(data), headers=headers)
    else:
        r = requests.get(url)

    if r.status_code == 404:
        raise ValueError('404')
    elif r.status_code == 500:
        raise ValueError('500')
    try:
        return r.json()
    except:
        return None

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
        elif state == 'in_start_tag' and letter == '>' and html[i-1] != '-':
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
        if isinstance(cell, (int, float)):
            cell = str(cell)
        cell = cell.replace('<br>', ' ')
        result = remove_html(cell)
        while result is not None:
            cell = result
            result = remove_html(cell)
        return cell

def send_message(request):

    import smtplib
    from urllib.request import Request, urlopen
    from urllib.error import URLError
    
    from email.mime.text import MIMEText

    p = dict(request.params)

    ### verify the user's response with google
    
    googleResponse = p.get('googleResponse')

    from src.sgd.frontend import config

    secret_key = config.secret_key
    
    url = "https://www.google.com/recaptcha/api/siteverify?secret=" + secret_key + "&response=" + googleResponse

    req = Request(url)

    res = urlopen(req)

    successJson = res.read()

    success = str(successJson)
    
    if 'false' in success: 
        return

    server = "localhost"
    sender = config.sender 
    
    s = smtplib.SMTP(server)
    
    name = p.get('name')
    email = p.get('email')
    subject = p.get('subject')
    message = p.get('message')
    sendUserCopy = p.get('sendUserCopy')
    
    text = "Name = " + name + "\nEmail = " + email + "\nSubject = " + subject + "\nMessage = " + message

    msg = MIMEText(text)
    
    s = smtplib.SMTP(server)
    
    recipients = [sender]

    if sendUserCopy == 'true' and email:
        recipients.append(email)

    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = ", ".join(recipients)
    s.sendmail(sender, recipients, msg.as_string())

    return Response(body=json.dumps(p), content_type='application/json')

