import logging
import string
import datetime
import json
import uuid
import urllib
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
from src.sgd.frontend.frontend_interface import FrontendInterface
from src.sgd.frontend.yeastgenome.backendless.load_data_from_file import get_data

# setup elastic search
from src.sgd.frontend import config
from elasticsearch import Elasticsearch
es = Elasticsearch(config.elasticsearch_address)

class YeastgenomeFrontend(FrontendInterface):
    def __init__(self, backend_url, heritage_url, log_directory):
        self.backend_url = backend_url
        self.heritage_url = heritage_url
        self.log = set_up_logging(log_directory, 'yeastgenome')
        self.locuses = dict()
        self.now = datetime.datetime.now()
        
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
                if data is not None:
                    return data
                else:
                    return Response(status='404', content_type='text/html', body=open(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "system/404.html")), "r").read())
        return f

    def check_date(self):
        new_time = datetime.datetime.now()
        if new_time.date() != self.now.date() and new_time.hour >= 3:
            self.locuses = dict()
            self.now = new_time
        return True

    def locus(self, bioent_repr):
        if self.check_date() and bioent_repr.lower() in self.locuses:
            return_value = self.locuses[bioent_repr.lower()]
        else:
            locus = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
            if locus is None:
                return_value = None
            else:
                tabs = get_json(self.backend_url + '/locus/' + str(locus['id']) + '/tabs')
                return_value = {'locus': locus, 'locus_js': json.dumps(locus), 'tabs': tabs, 'tabs_js': json.dumps(tabs)}
            if locus is not None:
                self.locuses[bioent_repr.lower()] = return_value

        return return_value

    def locus_list(self, list_name):
        return self.get_obj('locus_list', None, obj_url=self.backend_url + '/locus/' + list_name)

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
        obj = self.locus(bioent_repr)
        history = { 'history_js': json.dumps(obj.get('locus').get('history')) }
        obj.update(history)
        return obj

    def curator_sequence(self, bioent_repr):
        return self.locus(bioent_repr)

    def get_obj(self, obj_type, obj_repr, obj_url=None):
        if obj_url is None:
            obj_url = self.backend_url + '/' + obj_type + '/' + obj_repr + '/overview'

        obj = get_json(obj_url)

        if obj is None:
            return None

        return {
                    #Basic info
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

    def download_sequence(self, response, sequence, filename, header):
        headers = response.headers

        response.text = '>' + header + '\n' + clean_cell('\n'.join([sequence[i:i+60] for i in range(0, len(sequence), 60)]))
        headers['Content-Type'] = 'text/plain'
        headers['Content-Disposition'] = str('attachment; filename=' + filename)
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
    
    def enrichment(self, bioent_ids):
        enrichment_results = get_json(self.backend_url + '/go_enrichment', data={'bioent_ids': bioent_ids})
        return enrichment_results


    # elasticsearch endpoint
    def search(self, params):
        # try elastic search, if 1 response, redirect there
        raw_query = params['query']
        query = raw_query.lower()
        obj = {
            'query': {
                'filtered': {
                    'filter': {
                        'bool': {
                            'must': [
                                {
                                    'term': {
                                        'term.raw': query
                                    }
                                },
                                {
                                    'terms': {
                                        'type': ['gene_name', 'paper', 'go']
                                    }
                                }
                                
                            ]
                        }
                    }
                }
            }
        }
        res = es.search(index='sgdlite', body=obj)
        if (res['hits']['total'] == 1):
            url = res['hits']['hits'][0]['_source']['link_url']
            return HTTPFound(url)
        # otherwise try existing
        else:
            return HTTPFound("/cgi-bin/search/luceneQS.fpl?query=" + urllib.quote(raw_query))

    # elasticsearch autocomplete results
    def autocomplete_results(self, params):
        query = params['term']
        search_body = {
            'query': {
                'bool': {
                    'must': {
                        'match': {
                            'term': {
                                'query': query,
                                'analyzer': 'standard'
                            }
                        }
                    },
                    'must_not': { 'match': { 'type': 'paper' }},
                    'should': [
                        {
                            'match': {
                                'type': {
                                    'query': 'gene_name',
                                    'boost': 4
                                }
                            }
                        },
                        { 'match': { 'type': 'GO' }},
                        { 'match': { 'type': 'phenotyoe' }},
                        { 'match': { 'type': 'strain' }},
                        { 'match': { 'type': 'paper' }},
                        { 'match': { 'type': 'description' }},
                    ]
                }
            }
        }
        res = es.search(index='sgdlite', body=search_body)
        simplified_results = []
        for hit in res['hits']['hits']:
            # add matching words from description, not whole description
            if hit['_source']['type'] == 'description':
                for word in hit['_source']['term'].split(" "):
                    if word.lower().find(query.lower()) > -1:
                        simplified_results.append(re.sub('[;,.]', '', word))
                        break
            else:
                simplified_results.append(hit['_source']['term'])

        # filter duplicates
        unique = []
        for hit in simplified_results:
            if hit not in unique:
                unique.append(hit)

        return Response(body=json.dumps(unique), content_type='application/json')

    # es search for sequence objects
    def search_sequence_objects(self, params):
        query = params['query'] if 'query' in params.keys() else ''
        offset = int(params['offset']) if 'offset' in params.keys() else 0
        limit = int(params['limit']) if 'limit' in params.keys() else 1000

        query_type = 'wildcard' if '*' in query else 'match_phrase'
        if query == '':
            search_body = {
                'query': { 'match_all': {} }
            }
        else:
            search_body = {
                'query': {
                    query_type: {
                        '_all': query
                    }
                }
            }
        # search_body['sort'] = 'format_name.raw'

        res = es.search(index='sequence_objects5', body=search_body, size=limit, from_=offset)
        simple_hits = []
        for hit in res['hits']['hits']:
            obj = {
                'sgdid': hit['_source']['sgdid'],
                'name': hit['_source']['name'],
                'format_name': hit['_source']['format_name'],
                'dna_scores': hit['_source']['dna_scores'],
                'snp_seqs': hit['_source']['snp_seqs']
            }
            simple_hits.append(obj)
        formatted_response = {
            'loci': simple_hits,
            'total': res['hits']['total'],
            'offset': offset
        }

        return Response(body=json.dumps(formatted_response), content_type='application/json')

    # get individual feature
    def get_sequence_object(self, locus_repr):
        id = locus_repr.upper()
        res = es.get(index='sequence_objects3', id=id)['_source']
        return Response(body=json.dumps(res), content_type='application/json')

    def backend(self, url_repr, args=None):
        if self.backend_url == 'backendless':
            return json.dumps(get_data(url_repr))
        else:
            full_url = self.backend_url + '/' + ('/'.join(url_repr))
            if args is not None and len(args) > 0:
                full_url += '?' + ('&'.join([key + '=' + value for key, value in args.items() if key != 'callback']))
            print full_url
            return json.dumps(get_json(full_url))

    
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
    if url.startswith('backendless'):
        return get_data(url[12:].split('/'))
    else:
        if data is not None:
            headers = {'Content-type': 'application/json; charset=utf-8"', 'processData': False}
            r = requests.post(url, data=json.dumps(data), headers=headers)
        else:
            r = requests.get(url)

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
        if isinstance(cell, int):
            cell = str(cell)
        cell = cell.replace('<br>', ' ')
        result = remove_html(cell)
        while result is not None:
            cell = result
            result = remove_html(cell)
        return cell

def send_message(request):

    import smtplib
    from urllib2 import Request, urlopen, URLError
    
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

