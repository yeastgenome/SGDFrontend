import json
from pyramid.renderers import render, Response
from src.sgd.frontend import config
from pyramid.view import notfound_view_config
from src.sgd.frontend.yeastgenome import send_message
from src.sgd.tools.blast import do_blast

def prep_views(chosen_frontend, config):
    # some logic (NOT all) has been moved to views to be more 'pyramid-y'
    config.scan('src.sgd.frontend.views')
    config.add_route('blast_fungal', '/blast-fungal')
    config.add_route('blast_sgd', '/blast-sgd')
    config.add_route('interaction_search', '/interaction-search')
    config.add_route('snapshot', '/genomesnapshot')
    config.add_route('style_guide', '/style-guide')
    config.add_route('suggestion', '/suggestion')
    config.add_route('variant_viewer', '/variant-viewer')
    # config.add_route('example', '/example')

    #Reference views
    config.add_route('references_this_week', '/reference/recent')
    config.add_view(lambda request: chosen_frontend.response_wrapper('references_this_week', request)(getattr(chosen_frontend, 'references_this_week')()),
                    renderer=chosen_frontend.get_renderer('references_this_week'),
                    route_name='references_this_week')

    config.add_route('reference', '/reference/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('reference', request)(getattr(chosen_frontend, 'reference')(request.matchdict['identifier'])),
                    renderer=chosen_frontend.get_renderer('reference'),
                    route_name='reference')

    config.add_route('author', '/author/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('author', request)(getattr(chosen_frontend, 'author')(request.matchdict['identifier'])),
                    renderer=chosen_frontend.get_renderer('author'),
                    route_name='author')

    config.add_route('strain', '/strain/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('strain', request)(getattr(chosen_frontend, 'strain')(request.matchdict['identifier'])),
                    renderer=chosen_frontend.get_renderer('strain'),
                    route_name='strain')

    config.add_route('redirect', '/redirect/{page}')
    config.add_view(lambda request: getattr(chosen_frontend, 'redirect')(page=request.matchdict['page'], params=request.GET),
                    renderer=chosen_frontend.get_renderer('redirect'),
                    route_name='redirect')
        
    config.add_route('home', '/')
    config.add_view(lambda request: chosen_frontend.response_wrapper('home', request)(getattr(chosen_frontend, 'home')()),
                    renderer=chosen_frontend.get_renderer('home'),
                    route_name='home')
    
    config.add_route('header', '/header')
    config.add_view(lambda request: {'header': render('static/templates/header.jinja2', {})},
                    renderer=chosen_frontend.get_renderer('header'),
                    route_name='header')

    config.add_route('footer', '/footer')
    config.add_view(lambda request: {'footer': render('static/templates/footer.jinja2', {})},
                    renderer=chosen_frontend.get_renderer('footer'),
                    route_name='footer')
    
    config.add_route('download_table', '/download_table')
    config.add_view(lambda request: chosen_frontend.response_wrapper('download_table', request)(
                                getattr(chosen_frontend, 'download_table')(
                                        response=request.response,
                                        header_info=None if 'headers' not in request.POST else json.loads(request.POST['headers']),
                                        data=None if 'data' not in request.POST else json.loads(request.POST['data']),
                                        display_name=None if 'display_name' not in request.POST else request.POST['display_name'])),
                    renderer=chosen_frontend.get_renderer('download_table'),
                    route_name='download_table')
    
    config.add_route('download_image', '/download_image')
    config.add_view(lambda request: chosen_frontend.response_wrapper('download_image', request)(
                                getattr(chosen_frontend, 'download_image')(
                                        response = request.response,
                                        data = None if 'data' not in request.POST else request.POST['data'],
                                        display_name = None if 'display_name' not in request.POST else request.POST['display_name'])),
                    renderer=chosen_frontend.get_renderer('download_image'),
                    route_name='download_image')
    
    config.add_route('download_citations', '/download_citations')
    config.add_view(lambda request: chosen_frontend.response_wrapper('download_citations', request)(
                                getattr(chosen_frontend, 'download_citations')(
                                        response = request.response,
                                        reference_ids = [] if 'reference_ids' not in request.POST else request.POST['reference_ids'].split(','),
                                        display_name = None if 'display_name' not in request.POST else request.POST['display_name'])),
                    renderer=chosen_frontend.get_renderer('download_citations'),
                    route_name='download_citations')
    
    config.add_route('download_sequence', '/download_sequence')
    config.add_view(lambda request: chosen_frontend.response_wrapper('download_sequence', request)(
                                getattr(chosen_frontend, 'download_sequence')(
                                        response = request.response,
                                        sequence = None if 'sequence' not in request.POST else request.POST['sequence'],
                                        header = None if 'header' not in request.POST else request.POST['header'],
                                        filename = None if 'filename' not in request.POST else request.POST['filename'])),
                    renderer=chosen_frontend.get_renderer('download_sequence'),
                    route_name='download_sequence')

    config.add_route('analyze', '/analyze')
    config.add_view(lambda request: chosen_frontend.response_wrapper('analyze', request)(
                                getattr(chosen_frontend, 'analyze')(
                                        bioent_ids = None if 'bioent_ids' not in request.POST else json.loads(request.POST['bioent_ids']),
                                        list_name = None if 'list_name' not in request.POST else request.POST['list_name'])),
                    renderer=chosen_frontend.get_renderer('analyze'),
                    route_name='analyze')
    
    config.add_route('enrichment', '/enrichment')
    config.add_view(lambda request: chosen_frontend.response_wrapper('enrichment', request)(
                                getattr(chosen_frontend, 'enrichment')(
                                        bioent_ids = None if 'bioent_ids' not in request.json_body else request.json_body['bioent_ids'])),
                    renderer=chosen_frontend.get_renderer('enrichment'),
                    route_name='enrichment')
    
    config.add_route('interaction_details', '/locus/{identifier}/interaction')
    config.add_view(lambda request: chosen_frontend.response_wrapper('interaction_details', request)(getattr(chosen_frontend, 'interaction_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('interaction_details'),
                    route_name='interaction_details')
    
    config.add_route('literature_details', '/locus/{identifier}/literature')
    config.add_view(lambda request: chosen_frontend.response_wrapper('literature_details', request)(getattr(chosen_frontend, 'literature_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('literature_details'),
                    route_name='literature_details')
    
    config.add_route('regulation_details', '/locus/{identifier}/regulation')
    config.add_view(lambda request: chosen_frontend.response_wrapper('regulation_details', request)(getattr(chosen_frontend, 'regulation_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('regulation_details'),
                    route_name='regulation_details')
    
    config.add_route('phenotype_details', '/locus/{identifier}/phenotype')
    config.add_view(lambda request: chosen_frontend.response_wrapper('phenotype_details', request)(getattr(chosen_frontend, 'phenotype_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('phenotype_details'),
                    route_name='phenotype_details')

    config.add_route('expression_details', '/locus/{identifier}/expression')
    config.add_view(lambda request: chosen_frontend.response_wrapper('expression_details', request)(getattr(chosen_frontend, 'expression_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('expression_details'),
                    route_name='expression_details')
    
    config.add_route('go_details', '/locus/{identifier}/go')
    config.add_view(lambda request: chosen_frontend.response_wrapper('go_details', request)(getattr(chosen_frontend, 'go_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('go_details'),
                    route_name='go_details')
    
    config.add_route('protein_details', '/locus/{identifier}/protein')
    config.add_view(lambda request: chosen_frontend.response_wrapper('protein_details', request)(getattr(chosen_frontend, 'protein_details')(bioent_repr=request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('protein_details'),
                    route_name='protein_details')

    config.add_route('sequence_details', '/locus/{identifier}/sequence')
    config.add_view(lambda request: chosen_frontend.response_wrapper('sequence_details', request)(getattr(chosen_frontend, 'sequence_details')(bioent_repr= request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('sequence_details'),
                    route_name='sequence_details')

    config.add_route('curator_sequence', '/curator/locus/{identifier}/sequence')
    config.add_view(lambda request: chosen_frontend.response_wrapper('curator_sequence', request)(getattr(chosen_frontend, 'curator_sequence')(bioent_repr= request.matchdict['identifier'].upper())),
                    renderer=chosen_frontend.get_renderer('curator_sequence'),
                    route_name='curator_sequence')

    config.add_route('phenotype', '/phenotype/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('phenotype', request)(getattr(chosen_frontend, 'phenotype')(biocon_repr= request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('phenotype'),
                    route_name='phenotype')
    
    config.add_route('observable', '/observable/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('observable', request)(getattr(chosen_frontend, 'observable')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('observable'),
                    route_name='observable')
    
    config.add_route('phenotype_ontology', '/ontology/phenotype/ypo/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('phenotype_ontology', request)(getattr(chosen_frontend, 'phenotype_ontology')()),
                    renderer=chosen_frontend.get_renderer('phenotype_ontology'),
                    route_name='phenotype_ontology')

    config.add_route('ecnumber', '/ecnumber/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('ecnumber', request)(getattr(chosen_frontend, 'ecnumber')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('ecnumber'),
                    route_name='ecnumber')
    
    config.add_route('go', '/go/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('go', request)(getattr(chosen_frontend, 'go')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('go'),
                    route_name='go')
    
    config.add_route('go_ontology', '/ontology/go/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('go_ontology', request)(getattr(chosen_frontend, 'go_ontology')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('go_ontology'),
                    route_name='go_ontology')

    config.add_route('chemical', '/chemical/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('chemical', request)(getattr(chosen_frontend, 'chemical')(chemical_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('chemical'),
                    route_name='chemical')

    config.add_route('domain', '/domain/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('domain', request)(getattr(chosen_frontend, 'domain')(domain_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('domain'),
                    route_name='domain')

    config.add_route('reserved_name', '/reserved_name/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('reserved_name', request)(getattr(chosen_frontend, 'reserved_name')(reserved_name_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('reserved_name'),
                    route_name='reserved_name')

    config.add_route('dataset', '/dataset/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('dataset', request)(getattr(chosen_frontend, 'dataset')(bioitem_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('dataset'),
                    route_name='dataset')

    config.add_route('contig', '/contig/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('contig', request)(getattr(chosen_frontend, 'contig')(contig_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('contig'),
                    route_name='contig')

    config.add_route('tag', '/tag/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('tag', request)(getattr(chosen_frontend, 'tag')(tag_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('tag'),
                    route_name='tag')

    config.add_route('locus_list', '/locus/{list_name}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('locus_list', request)(getattr(chosen_frontend, 'locus_list')(list_name=request.matchdict['list_name'])),
                    renderer=chosen_frontend.get_renderer('locus_list'),
                    route_name='locus_list')

    config.add_route('experiment', '/experiment/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('experiment', request)(getattr(chosen_frontend, 'experiment')(experiment_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('experiment'),
                    route_name='experiment')

    config.add_route('search', '/search')
    config.add_view(lambda request: chosen_frontend.response_wrapper('search', request)(getattr(chosen_frontend, 'search')(params=request.GET)),
                    renderer=chosen_frontend.get_renderer('search'),
                    route_name='search')

    config.add_route('autocomplete_results', '/autocomplete_results')
    config.add_view(lambda request: chosen_frontend.response_wrapper('autocomplete_results', request)(getattr(chosen_frontend, 'autocomplete_results')(params=request.GET)),
                    renderer=chosen_frontend.get_renderer('autocomplete_results'),
                    route_name='autocomplete_results')

    config.add_route('search_sequence_objects', '/search_sequence_objects')
    config.add_view(lambda request: chosen_frontend.response_wrapper('search_sequence_objects', request)(getattr(chosen_frontend, 'search_sequence_objects')(params=request.GET)),
                    renderer=chosen_frontend.get_renderer('search_sequence_objects'),
                    route_name='search_sequence_objects')

    config.add_route('get_sequence_object', '/get_sequence_object/{id}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('get_sequence_object', request)(getattr(chosen_frontend, 'get_sequence_object')(locus_repr=request.matchdict['id'].lower())),
                    renderer=chosen_frontend.get_renderer('get_sequence_object'),
                    route_name='get_sequence_object')

    config.add_route('locus', '/locus/{identifier}/overview')
    config.add_view(lambda request: chosen_frontend.response_wrapper('locus', request)(getattr(chosen_frontend, 'locus')(bioent_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('locus'),
                    route_name='locus')

    config.add_route('backend', '/backend/*url')
    config.add_view(lambda request: chosen_frontend.response_wrapper('backend', request)(getattr(chosen_frontend, 'backend')(url_repr=request.matchdict['url'], args=request.GET)),
                    renderer='string',
                    route_name='backend')

    config.add_route('send_email', '/send_data')
    config.add_view(send_message, route_name='send_email')   
    
    config.add_route('do_blast', '/run_blast')
    config.add_view(do_blast, route_name='do_blast')

    
def prepare_frontend(frontend_type, **configs):
    if frontend_type == 'yeastgenome':
        from src.sgd.frontend.yeastgenome import yeastgenome_frontend

        chosen_frontend, configuration = yeastgenome_frontend(config.backend_url, config.heritage_url, config.log_directory, **configs)
        
        prep_views(chosen_frontend, configuration)
        return configuration


    
