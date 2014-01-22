from pyramid.config import Configurator
from pyramid.renderers import JSONP
from sgdfrontend_utils import set_up_logging, get_bioent, get_json, clean_cell, get_go, get_phenotype, get_chemical, get_reference
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
                    'locus': bioent,
                    
                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'interaction_details_link': link_maker.interaction_details_link(self.backend_url, bioent_id),
                    'interaction_graph_link': link_maker.interaction_graph_link(self.backend_url, bioent_id),
                    'interaction_resources_link': link_maker.interaction_resources_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'download_image_link': link_maker.download_image_link(),
                    'analyze_table_link': link_maker.analyze_link(),

                    }
        return page
    
    def literature_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        overview = get_json(link_maker.literature_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'locus': bioent,
                    
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
                    'locus': bioent,
                    
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

                    }
        return page
    
    def phenotype_details(self, bioent_repr):
        bioent = get_bioent(self.backend_url, bioent_repr)
        bioent_id = str(bioent['id'])
        overview = get_json(link_maker.phenotype_overview_link(self.backend_url, bioent_id))
        tabs = get_json(link_maker.tab_link(self.backend_url, bioent_id))
        
        page = {
                    #Basic info
                    'locus': bioent,

                    #Overview
                    'overview': json.dumps(overview),
                    'tabs': tabs,
                    
                    #Links
                    'phenotype_details_link': link_maker.phenotype_details_link(self.backend_url, bioent_id),
                    'phenotype_resources_link': link_maker.phenotype_resources_link(self.backend_url, bioent_id),
                    'phenotype_graph_link': link_maker.phenotype_graph_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'ontology_link': link_maker.phenotype_ontology_link(),

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
                    'locus': bioent,

                    #Overview
                    'overview': json.dumps(overview),
                    'date_last_reviewed': None if 'date_last_reviewed' not in overview else overview['date_last_reviewed'],
                    'tabs': tabs,
                    
                    #Links
                    'go_details_link': link_maker.go_details_link(self.backend_url, bioent_id),
                    'go_graph_link': link_maker.go_graph_link(self.backend_url, bioent_id),
                    'download_table_link': link_maker.download_table_link(),
                    'ontology_link': link_maker.phenotype_ontology_link(),

                    }
        return page
    
    def phenotype(self, biocon_repr):
        biocon = get_phenotype(self.backend_url, biocon_repr)
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'phenotype': biocon,
                    'observable': {'link':link_maker.observable_link(biocon['observable']), 'display_name':biocon['observable']},
                    'overview': json.dumps(biocon['summary']),
                    
                    #Links
                    'phenotype_details_link': link_maker.phenotype_details_biocon_link(self.backend_url, biocon_id),
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_table_link': link_maker.analyze_link(),
                    'ontology_graph_link': link_maker.phenotype_ontology_graph_link(self.backend_url, biocon_id),

                    }
        return page
    
    def observable(self, biocon_repr):
        biocon = get_phenotype(self.backend_url, biocon_repr)
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'observable': biocon,
                    'overview': json.dumps(biocon['summary']),
                    
                    #Links
                    'phenotype_details_link': link_maker.phenotype_details_biocon_link(self.backend_url, biocon_id),
                    'phenotype_details_all_link': link_maker.phenotype_details_biocon_link(self.backend_url, biocon_id, with_children=True),
                    'ontology_graph_link': link_maker.phenotype_ontology_graph_link(self.backend_url, biocon_id),
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_table_link': link_maker.analyze_link(),

                    }
        return page
    
    def phenotype_ontology(self):
        biocon = get_phenotype(self.backend_url, 'ypo')
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'ontology': biocon,

                    #Links
                    'ontology_graph_link': link_maker.phenotype_ontology_graph_link(self.backend_url, biocon_id),
                    'ontology_link': link_maker.ypo_ontology_link(self.backend_url),
                    }
        return page
    
    def go(self, biocon_repr):
        biocon = get_go(self.backend_url, biocon_repr)
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'go_term': biocon,
                    
                    #Links
                    'go_details_link': link_maker.go_details_biocon_link(self.backend_url, biocon_id),
                    'go_details_all_link': link_maker.go_details_biocon_link(self.backend_url, biocon_id, with_children=True),
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_table_link': link_maker.analyze_link(),
                    'ontology_graph_link': link_maker.go_ontology_graph_link(self.backend_url, biocon_id),

                    }
        return page

    def go_ontology(self, biocon_repr):
        biocon = get_go(self.backend_url, biocon_repr)
        biocon_id = str(biocon['id'])

        page = {
                    #Basic info
                    'ontology': biocon,

                    #Links
                    'ontology_graph_link': link_maker.go_ontology_graph_link(self.backend_url, biocon_id),
                    }
        return page
    
    def chemical(self, chemical_repr):
        chemical = get_chemical(self.backend_url, chemical_repr)
        chemical_id = str(chemical['id'])

        page = {
                    #Basic info
                    'chemical': chemical,
                    
                    #Links
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_table_link': link_maker.analyze_link(),
                    'chemical_details_link': link_maker.chemical_details_chem_link(self.backend_url, chemical_id),

                    }
        return page

    def reference(self, reference_repr):
        reference = get_reference(self.backend_url, reference_repr)
        reference_id = str(reference['id'])
        overview = get_json(link_maker.literature_details_ref_link(self.backend_url, reference_id))
        page = {
                    #Basic info
                    'reference': reference,
                    'overview': overview,
                    'counts': json.dumps(reference['counts']),

                    #Links
                    'download_table_link': link_maker.download_table_link(),
                    'analyze_table_link': link_maker.analyze_link(),
                    'go_details_link': link_maker.go_details_ref_link(self.backend_url, reference_id),
                    'phenotype_details_link': link_maker.phenotype_details_ref_link(self.backend_url, reference_id),
                    'interaction_details_link': link_maker.interaction_details_ref_link(self.backend_url, reference_id),
                    'regulation_details_link': link_maker.regulation_details_ref_link(self.backend_url, reference_id),
                    'binding_details_link': link_maker.binding_details_ref_link(self.backend_url, reference_id),
                    }
        return page

    def interaction_snapshot(self):
        overview = get_json(link_maker.interaction_snapshot_link(self.backend_url))

        page = {
                    #Overview
                    'overview': json.dumps(overview),
                }
        return page

    def regulation_snapshot(self):
        overview = get_json(link_maker.regulation_snapshot_link(self.backend_url))

        page = {
                    #Overview
                    'overview': json.dumps(overview),
                }
        return page

    def literature_snapshot(self):
        overview = get_json(link_maker.literature_snapshot_link(self.backend_url))

        page = {
                    #Overview
                    'overview': json.dumps(overview),
                }
        return page

    def phenotype_snapshot(self):
        overview = get_json(link_maker.phenotype_snapshot_link(self.backend_url))

        page = {
                    #Overview
                    'overview': json.dumps(overview),
                }
        return page

    def go_snapshot(self):
        overview = get_json(link_maker.go_snapshot_link(self.backend_url))

        page = {
                    #Overview
                    'overview': json.dumps(overview),
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

        cutoff = 1;
        if header_info[1] == 'Analyze ID':
            cutoff = 2;

        table_header = description + '\n\n' + '\t'.join(header_info[cutoff:])
        
        response.text = table_header + '\n' + '\n'.join(['\t'.join([clean_cell(str(cell)) for cell in row[cutoff:]]) for row in data])
        
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
    
    def analyze(self, list_name, bioent_ids):
        bioent_ids = list(set([int(x) for x in bioent_ids]))
            
        bioents = get_json(link_maker.bioent_list_link(self.backend_url), data={'bioent_ids': bioent_ids})
    
        if bioents is None:
            return Response(status_int=500, body='Bioents could not be found.') 
        
        page = {    
                    #Basic Info
                    'list_name_html': list_name,
                    'list_name': clean_cell(list_name).replace(' ', '_'),
                    
                    #Links
                    'go_enrichment_link': link_maker.enrichment_link(),
                    'download_table_link': link_maker.download_table_link(),
                    
                    'bioents': json.dumps(bioents),
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
