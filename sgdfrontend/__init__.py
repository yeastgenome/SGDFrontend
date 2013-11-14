from pyramid.config import Configurator
from pyramid.renderers import JSONP
from sgdfrontend_utils import set_up_logging, get_bioent, get_json, clean_cell, get_go, get_phenotype, get_chemical
from sgdfrontend_utils import link_maker
from pyramid.response import Response
from frontend.frontend_interface import FrontendInterface
from pyramid.httpexceptions import HTTPFound
import datetime
import json
import requests
import uuid
import urllib
import base64

class SGDFrontend(FrontendInterface):
    def __init__(self, backend_url, heritage_url, log_directory):
        self.backend_url = backend_url
        self.heritage_url = heritage_url
        self.log = set_up_logging(log_directory, 'sgdfrontend')
        
    def get_renderer(self, method_name):
        if method_name in set(['home', 'download_table', 'download_citations']):
            return None
        elif method_name in set(['header', 'footer', 'enrichment']):
            return 'jsonp'
        else:
            return 'templates/' + method_name + '.jinja2'
    
    def response_wrapper(self, method_name, request):
        request_id = str(uuid.uuid4())
        self.log.info(request_id + ' ' + method_name + ('' if 'identifier' not in request.matchdict else ' ' + request.matchdict['identifier']))
        def f(data):
            self.log.info(request_id + ' end')
            return data
        return f
    
    def interaction_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        display_name = bioent['display_name']
        overview = get_json(link_maker.interaction_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'display_name': bioent['display_name'],
                    'link': bioent['link'],
                    'format_name': bioent['format_name'],
                    
                    #Navbar stuff
                    'navbar_title': 'Interactions',
                    'navbar_summary_title': 'Interactors Summary',
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'interaction_details_link': link_maker.interaction_details_link(self.backend_url, bioent_id),
                    'interaction_graph_link': link_maker.interaction_graph_link(self.backend_url, bioent_id),
                    'interaction_resources_link': link_maker.interaction_resources_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'download_image_link': link_maker.download_image_link(),
                    'analyze_link': link_maker.analyze_link(),
    
                    #Filenames
                    'interaction_details_filename': display_name + '_interactions',
                    'interaction_overview_filename': display_name + '_interactors',
                    }
        return page
    
    def literature_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        overview = get_json(link_maker.literature_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'display_name': bioent['display_name'],
                    'format_name': bioent['format_name'],
                    'link': bioent['link'],
                    
                    #Navbar stuff
                    'navbar_title': 'Literature',
                    'navbar_summary_title': 'Literature Summary',
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'summary_count': overview['total_count'],
                    'tabs': tabs,
                    
                    #Links
                    'literature_details_link': link_maker.literature_details_link(self.backend_url, bioent_id),
                    'download_link': link_maker.download_citations_link(),
                    'literature_graph_link': link_maker.literature_graph_link(self.backend_url, bioent_id),
                    
                }
        return page
    
    def regulation_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        display_name = bioent['display_name']
        overview = get_json(link_maker.regulation_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'display_name': bioent['display_name'],
                    'link': bioent['link'],
                    'format_name': bioent['format_name'],
                    
                    #Navbar stuff
                    'navbar_title': 'Regulation',
                    'navbar_summary_title': 'Regulation Summary',
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'regulation_details_link': link_maker.regulation_details_link(self.backend_url, bioent_id),
                    'regulation_graph_link': link_maker.regulation_graph_link(self.backend_url, bioent_id),
                    'regulation_target_enrichment_link': link_maker.regulation_target_enrichment_link(self.backend_url, bioent_id),
                    'protein_domain_details_link': link_maker.protein_domain_details_link(self.backend_url, bioent_id),
                    'binding_site_details_link': link_maker.binding_site_details_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'download_image_link': link_maker.download_image_link(),
                    'analyze_link': link_maker.analyze_link(),
                    'go_enrichment_link': link_maker.enrichment_link(),
                    
                    #Filenames
                    'targets_filename': display_name + '_targets',
                    'regulators_filename': display_name + '_regulators',
                    'domains_filename': display_name + '_domains',
                    'enrichment_filename': display_name + '_targets_go_process_enrichment',
                    'regulation_overview_filename': display_name + '_transcriptional_targets_and_regulators',
                    }
        return page
    
    def phenotype_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        display_name = bioent['display_name']
        overview = get_json(link_maker.phenotype_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'display_name': bioent['display_name'],
                    'link': bioent['link'],
                    'format_name': bioent['format_name'],
                    
                    #Navbar stuff
                    'navbar_title': 'Phenotypes',
                    'navbar_summary_title': 'Phenotype Summary',
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'summary_count': overview['count'],
                    'tabs': tabs,
                    
                    #Links
                    'phenotype_details_link': link_maker.phenotype_details_link(self.backend_url, bioent_id),
                    'phenotype_resources_link': link_maker.phenotype_resources_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'ontology_link': link_maker.phenotype_ontology_link(),
                    
                    #Filenames
                    'phenotype_details_filename': display_name + '_phenotypes',
                    }
        return page
    
    def go_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        display_name = bioent['display_name']
        overview = get_json(link_maker.go_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'display_name': bioent['display_name'],
                    'link': bioent['link'],
                    'format_name': bioent['format_name'],
                    
                    #Navbar stuff
                    'navbar_title': 'GO Terms',
                    'navbar_summary_title': 'Go Summary',
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'go_details_link': link_maker.go_details_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'ontology_link': link_maker.phenotype_ontology_link(),
                    
                    #Filenames
                    'go_details_filename': display_name + '_go',
                    }
        return page
    
    def phenotype(self, biocon_repr):
        biocon = get_phenotype(self.backend_url, biocon_repr)
        biocon_id = str(biocon['id'])
        display_name = biocon['display_name']
                
        page = {
                    #Basic info
                    'display_name': biocon['display_name'],
                    'link': biocon['link'],
                    'format_name': biocon['format_name'],
                    'count': biocon['count'],
                    'description': biocon['description'],
                    
                    #Navbar stuff
                    'navbar_title': '',
                    'navbar_summary_title': 'Summary',
                    
                    #Links
                    'phenotype_details_link': link_maker.phenotype_details_biocon_link(self.backend_url, biocon_id),
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_link': link_maker.analyze_link(),
                    'ontology_graph_link': link_maker.phenotype_ontology_graph_link(self.backend_url, biocon_id),
                    
                    #Filenames
                    'phenotype_details_filename': display_name + '_genes',
                    }
        return page
    
    def go(self, biocon_repr):
        biocon = get_go(self.backend_url, biocon_repr)
        biocon_id = str(biocon['id'])
        display_name = biocon['display_name']
                
        page = {
                    #Basic info
                    'display_name': biocon['display_name'],
                    'link': biocon['link'],
                    'format_name': biocon['format_name'],
                    'count': biocon['count'],
                    'description': biocon['description'],
                    
                    #Navbar stuff
                    'navbar_title': '',
                    'navbar_summary_title': 'Summary',
                    
                    #Links
                    'go_details_link': link_maker.go_details_biocon_link(self.backend_url, biocon_id),
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_link': link_maker.analyze_link(),
                    'ontology_graph_link': link_maker.go_ontology_graph_link(self.backend_url, biocon_id),
                    
                    #Filenames
                    'go_details_filename': display_name + '_genes',
                    }
        return page
    
    def chemical(self, chemical_repr):
        chemical = get_chemical(self.backend_url, chemical_repr)
        chemical_id = str(chemical['id'])
        display_name = chemical['display_name']
                
        page = {
                    #Basic info
                    'display_name': chemical['display_name'],
                    'link': chemical['link'],
                    'format_name': chemical['format_name'],
                    
                    #Navbar stuff
                    'navbar_title': '',
                    'navbar_summary_title': 'Summary',
                    
                    #Links
                    'chemical_details_link': link_maker.chemical_details_chem_link(self.backend_url, chemical_id),
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_link': link_maker.analyze_link(),
                    'ontology_graph_link': link_maker.chemical_ontology_graph_link(self.backend_url, chemical_id),
                    
                    #Filenames
                    'chemical_details_filename': display_name + '_genes',
                    }
        return page
    
    def home(self):
        if self.heritage_url is None:
            return Response('Temporary.')
        else:
            page = urllib.urlopen(self.heritage_url).read()
            return Response(page)
        
    def redirect(self, page, bioent_repr):
        if bioent_repr is not None:
            return HTTPFound('/locus/' + bioent_repr + '/' + page)
        elif page == 'interaction':
            page = urllib.urlopen(self.heritage_url + '/cgi-bin/interaction_search').read()
            return Response(page)
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
        
        table_header = description + '\n\n' + '\t'.join(header_info)
        
        response.text = table_header + '\n' + '\n'.join(['\t'.join([clean_cell(cell) for cell in row]) for row in data])
        
        headers['Content-Type'] = 'text/plain'      
        headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.txt')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def download_image(self, response, data, display_name):
        headers = response.headers
        response.body = base64.b64decode(data[22:])
        
        headers['Content-Type'] = 'image/png;'      
        headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.png')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def download_citations(self, response, reference_ids, display_name):
        reference_ids = list(set(reference_ids))
        references = get_json(link_maker.citation_list_link(self.backend_url), data={'reference_ids': reference_ids})
        
        headers = response.headers
        
        response.text = '\n' + '\n\n'.join([ref['text'] for ref in references])
        
        headers['Content-Type'] = 'text/plain'        
        headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.nbib')
        headers['Content-Description'] = 'File Transfer'
        return response
    
    def analyze(self, list_name, bioent_display_name, bioent_format_name, bioent_link, bioent_ids):
        bioent_ids = list(set([int(x) for x in bioent_ids]))
            
        bioents = get_json(link_maker.bioent_list_link(self.backend_url), data={'bioent_ids': bioent_ids})
    
        if bioents is None:
            return Response(status_int=500, body='Bioents could not be found.') 
        
        page = {    
                    #Basic Info
                    'display_name': bioent_display_name,
                    'format_name': bioent_format_name,
                    'link': bioent_link,
                    
                    #Navbar stuff
                    'navbar_pre': 'Analyze ',
                    'navbar_title': list_name,
                    'navbar_summary_title': 'Tools',
                    
                    #Links
                    'go_enrichment_link': link_maker.enrichment_link(),
                    'download_table_link': link_maker.download_table_link(),
                    
                    'bioents': json.dumps(bioents),
                    'bioent_format_names': " ".join([bioent['format_name'] for bioent in bioents]), 
                    'gene_list_filename': 'gene_list',
                    'list_type': list_name,
                }
        return page
    
    def enrichment(self, bioent_ids):
        enrichment_results = get_json(link_maker.go_enrichment_link(self.backend_url), data={'bioent_ids': bioent_ids})
        return enrichment_results
    
def prepare_sgdfrontend(backend_url, heritage_url, log_directory, **configs):  
    chosen_frontend = SGDFrontend(backend_url, heritage_url, log_directory)
    
    settings = dict(configs)
    settings.setdefault('jinja2.i18n.domain', 'myproject')
    config = Configurator(settings=settings)
    config.add_translation_dirs('locale/')
    config.include('pyramid_jinja2')
    
    config.add_static_view('static', 'sgdfrontend:static')
    config.add_static_view('img-domain', 'sgdfrontend:img-domain')
    config.add_renderer('jsonp', JSONP(param_name='callback'))

    return chosen_frontend, config
