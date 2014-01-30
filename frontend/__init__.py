from pyramid.config import Configurator
from pyramid.renderers import JSONP, render
from pyramid.response import Response
from pyramid_jinja2 import renderer_factory
import json
import requests

def prep_views(chosen_frontend, config):  
    
    #Reference views
    config.add_route('reference', 
                     '/reference/{identifier}/overview', 
                     view=lambda request: chosen_frontend.response_wrapper('reference', request)(
                                getattr(chosen_frontend, 'reference')(
                                        None if 'identifier' not in request.matchdict else request.matchdict['identifier'])), 
                     renderer=chosen_frontend.get_renderer('reference'))

    config.add_route('author',
                     '/author/{identifier}/overview',
                     view=lambda request: chosen_frontend.response_wrapper('author', request)(
                                getattr(chosen_frontend, 'author')(
                                        None if 'identifier' not in request.matchdict else request.matchdict['identifier'])),
                     renderer=chosen_frontend.get_renderer('author'))
        
    config.add_route('redirect',
                     '/redirect/{page}',
                     view=lambda request: getattr(chosen_frontend, 'redirect')(
                                        page = request.matchdict['page'],
                                        params = request.GET),

                     renderer=chosen_frontend.get_renderer('home'))
    
    config.add_route('home',
                     '/',
                     view=lambda request: chosen_frontend.response_wrapper('home', request)(
                                getattr(chosen_frontend, 'home')()),
                     renderer=chosen_frontend.get_renderer('home'))
    
    config.add_route('header',
                     '/header',
                     view=lambda request: {'header': render('templates/header.jinja2', {})},
                     renderer=chosen_frontend.get_renderer('header'))
    
    config.add_route('footer',
                     '/footer',
                     view=lambda request: {'footer': render('templates/footer.jinja2', {})},
                     renderer=chosen_frontend.get_renderer('footer'))
    
    config.add_route('download_table',
                     '/download_table',
                     view=lambda request: chosen_frontend.response_wrapper('download_table', request)(
                                getattr(chosen_frontend, 'download_table')(
                                        response = request.response,
                                        header_info = None if 'headers' not in request.POST else json.loads(request.POST['headers']),
                                        data = None if 'data' not in request.POST else json.loads(request.POST['data']),
                                        display_name = None if 'display_name' not in request.POST else request.POST['display_name'])),
                     renderer=chosen_frontend.get_renderer('download_table'))
    
    config.add_route('download_image',
                     '/download_image',
                     view=lambda request: chosen_frontend.response_wrapper('download_image', request)(
                                getattr(chosen_frontend, 'download_image')(
                                        response = request.response,
                                        data = None if 'data' not in request.POST else request.POST['data'],
                                        display_name = None if 'display_name' not in request.POST else request.POST['display_name'])),
                     renderer=chosen_frontend.get_renderer('download_image'))
    
    config.add_route('download_citations',
                     '/download_citations',
                     view=lambda request: chosen_frontend.response_wrapper('download_citations', request)(
                                getattr(chosen_frontend, 'download_citations')(
                                        response = request.response,
                                        reference_ids = [] if 'reference_ids' not in request.POST else request.POST['reference_ids'].split(','),
                                        display_name = None if 'display_name' not in request.POST else request.POST['display_name'])),
                     renderer=chosen_frontend.get_renderer('download_citations'))
    
    config.add_route('analyze',
                     '/analyze',
                     view=lambda request: chosen_frontend.response_wrapper('analyze', request)(
                                getattr(chosen_frontend, 'analyze')(
                                        bioent_ids = None if 'bioent_ids' not in request.POST else json.loads(request.POST['bioent_ids']),
                                        list_name = None if 'list_name' not in request.POST else request.POST['list_name'])),
                     renderer=chosen_frontend.get_renderer('analyze'))
    
    config.add_route('enrichment',
                     '/enrichment',
                     view=lambda request: chosen_frontend.response_wrapper('enrichment', request)(
                                getattr(chosen_frontend, 'enrichment')(
                                        bioent_ids = None if 'bioent_ids' not in request.json_body else request.json_body['bioent_ids'])),
                     renderer=chosen_frontend.get_renderer('enrichment'))
    
    config.add_route('interaction_details',
                     '/locus/{identifier}/interaction',
                     view=lambda request: chosen_frontend.response_wrapper('interaction_details', request)(
                                getattr(chosen_frontend, 'interaction_details')(
                                        bioent_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].upper())),
                     renderer=chosen_frontend.get_renderer('interaction_details'))
    
    config.add_route('literature_details',
                     '/locus/{identifier}/literature',
                     view=lambda request: chosen_frontend.response_wrapper('literature_details', request)(
                                getattr(chosen_frontend, 'literature_details')(
                                        bioent_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].upper())),
                     renderer=chosen_frontend.get_renderer('literature_details'))
    
    config.add_route('regulation_details',
                     '/locus/{identifier}/regulation',
                     view=lambda request: chosen_frontend.response_wrapper('regulation_details', request)(
                                getattr(chosen_frontend, 'regulation_details')(
                                        bioent_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].upper())),
                     renderer=chosen_frontend.get_renderer('regulation_details'))
    
    config.add_route('phenotype_details',
                     '/locus/{identifier}/phenotype',
                     view=lambda request: chosen_frontend.response_wrapper('phenotype_details', request)(
                                getattr(chosen_frontend, 'phenotype_details')(
                                        bioent_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].upper())),
                     renderer=chosen_frontend.get_renderer('phenotype_details'))
    
    config.add_route('go_details',
                     '/locus/{identifier}/go',
                     view=lambda request: chosen_frontend.response_wrapper('go_details', request)(
                                getattr(chosen_frontend, 'go_details')(
                                        bioent_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].upper())),
                     renderer=chosen_frontend.get_renderer('go_details'))
    
    config.add_route('phenotype',
                     '/phenotype/{identifier}/overview',
                     view=lambda request: chosen_frontend.response_wrapper('phenotype', request)(
                                getattr(chosen_frontend, 'phenotype')(
                                        biocon_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].lower())),
                     renderer=chosen_frontend.get_renderer('phenotype'))
    
    config.add_route('observable',
                     '/observable/{identifier}/overview',
                     view=lambda request: chosen_frontend.response_wrapper('observable', request)(
                                getattr(chosen_frontend, 'observable')(
                                        biocon_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].lower())),
                     renderer=chosen_frontend.get_renderer('observable'))
    
    config.add_route('phenotype_ontology',
                     '/ontology/phenotype/ypo/overview',
                     view=lambda request: chosen_frontend.response_wrapper('phenotype_ontology', request)(
                                getattr(chosen_frontend, 'phenotype_ontology')()),
                     renderer=chosen_frontend.get_renderer('phenotype_ontology'))
    
    config.add_route('go',
                     '/go/{identifier}/overview',
                     view=lambda request: chosen_frontend.response_wrapper('go', request)(
                                getattr(chosen_frontend, 'go')(
                                        biocon_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].lower())),
                     renderer=chosen_frontend.get_renderer('go'))

    config.add_route('go_ontology',
                     '/ontology/go/{identifier}/overview',
                     view=lambda request: chosen_frontend.response_wrapper('go_ontology', request)(
                                getattr(chosen_frontend, 'go_ontology')(
                                        biocon_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].lower())),
                     renderer=chosen_frontend.get_renderer('go_ontology'))
    
    config.add_route('chemical',
                     '/chemical/{identifier}/overview',
                     view=lambda request: chosen_frontend.response_wrapper('chemical', request)(
                                getattr(chosen_frontend, 'chemical')(
                                        chemical_repr = None if 'identifier' not in request.matchdict else request.matchdict['identifier'].lower())),
                     renderer=chosen_frontend.get_renderer('chemical'))

    config.add_route('interaction_snapshot',
                     '/snapshot/interaction',
                     view=lambda request: chosen_frontend.response_wrapper('interaction_snapshot', request)(
                                getattr(chosen_frontend, 'interaction_snapshot')()),
                     renderer=chosen_frontend.get_renderer('interaction_snapshot'))

    config.add_route('regulation_snapshot',
                     '/snapshot/regulation',
                     view=lambda request: chosen_frontend.response_wrapper('regulation_snapshot', request)(
                                getattr(chosen_frontend, 'regulation_snapshot')()),
                     renderer=chosen_frontend.get_renderer('regulation_snapshot'))

    config.add_route('literature_snapshot',
                     '/snapshot/literature',
                     view=lambda request: chosen_frontend.response_wrapper('literature_snapshot', request)(
                                getattr(chosen_frontend, 'literature_snapshot')()),
                     renderer=chosen_frontend.get_renderer('literature_snapshot'))

    config.add_route('go_snapshot',
                     '/snapshot/go',
                     view=lambda request: chosen_frontend.response_wrapper('go_snapshot', request)(
                                getattr(chosen_frontend, 'go_snapshot')()),
                     renderer=chosen_frontend.get_renderer('go_snapshot'))

    config.add_route('phenotype_snapshot',
                     '/snapshot/phenotype',
                     view=lambda request: chosen_frontend.response_wrapper('phenotype_snapshot', request)(
                                getattr(chosen_frontend, 'phenotype_snapshot')()),
                     renderer=chosen_frontend.get_renderer('phenotype_snapshot'))
    
def prepare_frontend(frontend_type, **configs):
    if frontend_type == 'sgdfrontend':
        from sgdfrontend import prepare_sgdfrontend
        import config
        chosen_frontend, configuration = prepare_sgdfrontend(config.backend_url, config.heritage_url, config.log_directory, **configs)
        
        prep_views(chosen_frontend, configuration)
        return configuration

def sgdfrontend(global_config, **configs):
    """ This function returns a Pyramid WSGI application.
    """
    config = prepare_frontend('sgdfrontend', **configs)
    return config.make_wsgi_app()