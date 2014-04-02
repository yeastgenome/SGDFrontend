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
from pyramid.httpexceptions import HTTPFound
from src.sgd.frontend.frontend_interface import FrontendInterface

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
        self.log.info(request_id + ' ' + method_name + ('' if 'identifier' not in request.matchdict else ' ' + request.matchdict['identifier']))
        def f(data):
            self.log.info(request_id + ' end')
            return data
        return f
    
    def interaction_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        if bioent is not None:
            bioent_id = str(bioent['id'])
            overview = get_json(self.backend_url + '/locus/' + bioent_id + '/interaction_overview')
            tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')

            page = {
                        #Basic info
                        'locus': bioent,

                        #Overview
                        'overview': json.dumps(overview),
                        'tabs': tabs,

                        #Links
                        'interaction_details_link': self.backend_url + '/locus/' + bioent_id + '/interaction_details?callback=?',
                        'interaction_graph_link': self.backend_url + '/locus/' + bioent_id + '/interaction_graph?callback=?',
                        'interaction_resources_link': self.backend_url + '/locus/' + bioent_id + '/interaction_resources?callback=?',
                        'download_table_link': '/download_table',
                        'analyze_table_link': '/analyze'
                    }
            return page
        return Response(status_int=500, body='Could not find locus ' + bioent_repr + '.')
    
    def literature_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        bioent_id = str(bioent['id'])
        overview = get_json(self.backend_url + '/locus/' + bioent_id + '/literature_overview')
        tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')
        
        page = {
                    #Basic info
                    'locus': bioent,
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'summary_count': overview['total_count'],
                    'tabs': tabs,
                    
                    #Links
                    'literature_details_link': self.backend_url + '/locus/' + bioent_id + '/literature_details?callback=?',
                    'literature_graph_link': self.backend_url + '/locus/' + bioent_id + '/literature_graph?callback=?',
                    'download_citations_link': '/download_citations'
                }
        return page
    
    def regulation_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        bioent_id = str(bioent['id'])
        overview = get_json(self.backend_url + '/locus/' + bioent_id + '/regulation_overview')
        tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')
        
        page = {
                    #Basic info
                    'locus': bioent,
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'regulation_details_link': self.backend_url + '/locus/' + bioent_id + '/regulation_details?callback=?',
                    'regulation_graph_link': self.backend_url + '/locus/' + bioent_id + '/regulation_graph?callback=?',
                    'regulation_target_enrichment_link': self.backend_url + '/locus/' + bioent_id + '/regulation_target_enrichment?callback=?',
                    'protein_domain_details_link': self.backend_url + '/locus/' + bioent_id + '/protein_domain_details?callback=?',
                    'binding_site_details_link': self.backend_url + '/locus/' + bioent_id + '/binding_site_details?callback=?',
                    'regulation_paragraph_link': self.backend_url + '/locus/' + bioent_id + '/regulation_paragraph?callback=?',
                    'go_enrichment_link': '/enrichment',
                    'download_table_link': '/download_table',
                    'analyze_link': '/analyze',
                    }
        return page
    
    def phenotype_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        bioent_id = str(bioent['id'])
        overview = get_json(self.backend_url + '/locus/' + bioent_id + '/phenotype_overview')
        tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')
        
        page = {
                    #Basic info
                    'locus': bioent,

                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'phenotype_details_link': self.backend_url + '/locus/' + bioent_id + '/phenotype_details?callback=?',
                    'phenotype_resources_link': self.backend_url + '/locus/' + bioent_id + '/phenotype_resources?callback=?',
                    'phenotype_graph_link': self.backend_url + '/locus/' + bioent_id + '/phenotype_graph?callback=?',
                    'download_table_link': '/download_table',
                    'ontology_link': '/ontology/phenotype/ypo/overview'
                    }
        return page
    
    def go_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        bioent_id = str(bioent['id'])
        overview = get_json(self.backend_url + '/locus/' + bioent_id + '/go_overview')
        tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')

        page = {
                    #Basic info
                    'locus': bioent,

                    #Overview
                    'overview': overview,
                    'date_last_reviewed': None if 'date_last_reviewed' not in overview else overview['date_last_reviewed'],
                    'tabs': tabs,
                    
                    #Links
                    'go_details_link': self.backend_url + '/locus/' + bioent_id + '/go_details?callback=?',
                    'go_graph_link': self.backend_url + '/locus/' + bioent_id + '/go_graph?callback=?',
                    'download_table_link': '/download_table'
                    }
        return page

    def protein_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        bioent_id = str(bioent['id'])
        overview = get_json(self.backend_url + '/locus/' + bioent_id + '/protein_overview')
        tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')

        page = {
                    #Basic info
                    'locus': bioent,

                    #Overview
                    'overview': overview,
                    'tabs': tabs,

                    #Links
                    'protein_domain_details_link': self.backend_url + '/locus/' + bioent_id + '/protein_domain_details?callback=?',
                    'protein_domain_graph_link': self.backend_url + '/locus/' + bioent_id + '/protein_domain_graph?callback=?',
                    'sequence_details_link': self.backend_url + '/locus/' + bioent_id + '/sequence_details?callback=?',
                    'protein_phosphorylation_details_link': self.backend_url + '/locus/' + bioent_id + '/protein_phosphorylation_details?callback=?',
                    'ec_number_details_link': self.backend_url + '/locus/' + bioent_id + '/ecnumber_details?callback=?',
                    'protein_experiment_details_link': self.backend_url + '/locus/' + bioent_id + '/protein_experiment_details?callback=?',
                    'protein_resources_link': self.backend_url + '/locus/' + bioent_id + '/protein_resources?callback=?',
                    'alias_link': self.backend_url + '/locus/' + bioent_id + '/alias?callback=?',
                    'download_table_link': '/download_table',
                    'download_sequence_link': '/download_sequence',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def sequence_details(self, bioent_repr):
        bioent = get_json(self.backend_url + '/locus/' + bioent_repr + '/overview')
        bioent_id = str(bioent['id'])
        overview = get_json(self.backend_url + '/locus/' + bioent_id + '/sequence_overview')
        tabs = get_json(self.backend_url + '/locus/' + bioent_id + '/tabs')

        page = {
                    #Basic info
                    'locus': bioent,

                    #Overview
                    'overview': overview,
                    'tabs': tabs,

                    #Links
                    'sequence_details_link': self.backend_url + '/locus/' + bioent_id + '/sequence_details?callback=?',
                    'neighbor_sequence_details_link': self.backend_url + '/locus/' + bioent_id + '/neighbor_sequence_details?callback=?',
                    'download_table_link': '/download_table',
                    'download_sequence_link': '/download_sequence',
                    'analyze_table_link': '/analyze'
                    }
        return page
    
    def phenotype(self, biocon_repr):
        biocon = get_json(self.backend_url + '/phenotype/' + biocon_repr + '/overview')
        biocon_id = str(biocon['id'])
        overview = get_json(self.backend_url + '/phenotype/' + biocon_id + '/phenotype_overview')

        page = {
                    #Basic info
                    'phenotype': biocon,
                    'observable': {'link': '/observable/' + biocon['observable'].replace(' ', '_').replace('/', '-') + '/overview', 'display_name':biocon['observable']},
                    'overview': json.dumps(overview),
                    
                    #Links
                    'phenotype_details_link': self.backend_url + '/phenotype/' + biocon_id + '/locus_details?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page
    
    def observable(self, biocon_repr):
        biocon = get_json(self.backend_url + '/phenotype/' + biocon_repr + '/overview')
        biocon_id = str(biocon['id'])
        overview = get_json(self.backend_url + '/phenotype/' + biocon_id + '/phenotype_overview')

        page = {
                    #Basic info
                    'observable': biocon,
                    'overview': json.dumps(overview),
                    
                    #Links
                    'phenotype_details_link': self.backend_url + '/phenotype/' + biocon_id + '/locus_details?callback=?',
                    'phenotype_details_all_link': self.backend_url + '/phenotype/' + biocon_id + '/locus_details_all?callback=?',
                    'ontology_graph_link': self.backend_url + '/phenotype/' + biocon_id + '/ontology_graph?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page
    
    def phenotype_ontology(self):
        biocon = get_json(self.backend_url + '/phenotype/ypo/overview')
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'ontology': biocon,

                    #Links
                    'ontology_graph_link': self.backend_url + '/phenotype/' + biocon_id + '/ontology_graph?callback=?',
                    'ontology_link': self.backend_url + '/phenotype/ontology?callback=?'
                    }
        return page
    
    def go(self, biocon_repr):
        biocon = get_json(self.backend_url + '/go/' + biocon_repr + '/overview')
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'go_term': biocon,
                    
                    #Links
                    'go_details_link': self.backend_url + '/go/' + biocon_id + '/locus_details?callback=?',
                    'go_details_all_link': self.backend_url + '/go/' + biocon_id + '/locus_details_all?callback=?',
                    'ontology_graph_link': self.backend_url + '/go/' + biocon_id + '/ontology_graph?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def go_ontology(self, biocon_repr):
        biocon = get_json(self.backend_url + '/go/' + biocon_repr + '/overview')
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'ontology': biocon,

                    #Links
                    'go_details_link': self.backend_url + '/go/' + biocon_id + '/locus_details?callback=?',
                    'ontology_graph_link': self.backend_url + '/go/' + biocon_id + '/ontology_graph?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page
    
    def chemical(self, chemical_repr):
        chemical = get_json(self.backend_url + '/chemical/' + chemical_repr + '/overview')
        chemical_id = str(chemical['id'])

        page = {
                    #Basic info
                    'chemical': chemical,
                    
                    #Links
                    'chemical_details_link': self.backend_url + '/chemical/' + chemical_id + '/phenotype_details?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def domain(self, domain_repr):
        domain = get_json(self.backend_url + '/domain/' + domain_repr + '/overview')
        domain_id = str(domain['id'])

        page = {
                    #Basic info
                    'domain': domain,

                    #Links
                    'domain_details_link': self.backend_url + '/domain/' + domain_id + '/locus_details?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def complex(self, complex_repr):
        complex = get_json(self.backend_url + '/complex/' + complex_repr + '/overview')
        complex_id = str(complex['id'])

        page = {
                    #Basic info
                    'complex': complex,

                    #Links
                    'complex_details_link': self.backend_url + '/complex/' + complex_id + '/locus_details?callback=?',
                    'complex_genes_link': self.backend_url + '/complex/' + complex_id + '/genes?callback=?',
                    'complex_graph_link': self.backend_url + '/complex/' + complex_id + '/graph?callback=?',
                    'go_enrichment_link': '/enrichment',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def ec_number(self, ec_repr):
        ec_number = get_json(self.backend_url + '/ecnumber/' + ec_repr + '/overview')
        ec_number_id = str(ec_number['id'])

        page = {
                    #Basic info
                    'ec_number': ec_number,

                    #Links
                    'ec_number_details_link': self.backend_url + '/ecnumber/' + ec_number_id + '/locus_details?callback=?',
                    'download_table_link': '/download_table',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def reference(self, reference_repr):
        reference = get_json(self.backend_url + '/reference/' + reference_repr + '/overview')
        reference_id = str(reference['id'])

        page = {
                    #Basic info
                    'reference': reference,
                    'counts': json.dumps(reference['counts']),

                    #Links
                    'go_details_link': self.backend_url + '/reference/' + reference_id + '/go_details?callback=?',
                    'phenotype_details_link': self.backend_url + '/reference/' + reference_id + '/phenotype_details?callback=?',
                    'interaction_details_link': self.backend_url + '/reference/' + reference_id + '/interaction_details?callback=?',
                    'regulation_details_link': self.backend_url + '/reference/' + reference_id + '/regulation_details?callback=?',
                    'binding_details_link': self.backend_url + '/reference/' + reference_id + '/binding_details?callback=?',
                    'literature_details_link': self.backend_url + '/reference/' + reference_id + '/literature_details?callback=?',
                    'download_table_link': '/download_table',
                    'download_citations_link': '/download_citations',
                    'analyze_table_link': '/analyze'
                    }
        return page

    def author(self, author_repr):
        author = get_json(self.backend_url + '/author/' + author_repr + '/overview')
        author_id = str(author['id'])

        page = {
                    #Basic info
                    'author': author,

                    #Links
                    'references_link': self.backend_url + '/author/' + author_id + '/references?callback=?',
                    'download_citations_link': '/download_citations'
                    }
        return page

    def references_this_week(self):
        page = {
                    #Basic info
                    'references_this_week_link': self.backend_url + '/new/references?callback=?',
                    'download_citations_link': '/download_citations',
                    'a_week_ago': str(datetime.date.today() - datetime.timedelta(days=7)).replace('-', '_')
                    }
        return page

    def contig(self, contig_repr):
        contig = get_json(self.backend_url + '/contig/' + contig_repr + '/overview')
        contig_id = str(contig['id'])

        page = {
                    #Basic info
                    'contig': contig,

                    #Links
                    'sequence_details_link': self.backend_url + '/contig/' + contig_id + '/sequence_details?callback=?',
                    'download_table_link': '/download_table',
                    'download_sequence_link': '/download_sequence',
                    'analyze_table_link': '/analyze'
                    }
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
        elif page == 'phenotype':
            if 'phenotype' in params:
                old_phenotype = params['phenotype'].split(':')
                if len(old_phenotype) > 1:
                    new_phenotype = (old_phenotype[1] + ' ' + old_phenotype[0]).strip().replace(' ', '_').replace('/', '-')
                    if 'property_value' in params:
                        if 'chemicals' in new_phenotype:
                            new_phenotype = new_phenotype.replace('chemicals', params['property_value'].replace(' ', '_').replace('|', '_and_'))
                        elif 'chemical' in new_phenotype:
                            new_phenotype = new_phenotype.replace('chemical', params['property_value'].replace(' ', '_'))
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
        headers['Content-Disposition'] = str('attachment; filename=' + display_name + '_' + contig_name + '_sequence.txt')
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

                    #Links
                    'go_enrichment_link': '/enrichment',
                    'download_table_link': '/download_table'
                }
        return page
    
    def enrichment(self, bioent_ids):
        enrichment_results = get_json(self.backend_url + '/go_enrichment', data={'bioent_ids': bioent_ids})
        return enrichment_results
    
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
