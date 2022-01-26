import json
# from pyramid.renderers import render, Response
from pyramid.renderers import render
from src.sgd.frontend import config
from pyramid.view import notfound_view_config
from src.sgd.frontend.yeastgenome import send_message
from src.sgd.redirect import do_redirect
from src.sgd.tools.blast import do_blast
from src.sgd.tools.patmatch import do_patmatch
from src.sgd.tools.seqtools import do_seq_analysis
from src.sgd.tools.gotools import do_gosearch
from src.sgd.tools.alignment import get_s3_data
from src.sgd.tools.restrictionmapper import do_restmap
from src.sgd.tools.primer3 import do_primer3

def prep_views(chosen_frontend, config):
    # some logic (NOT all) has been moved to views to be more 'pyramid-y'
    config.scan('src.sgd.frontend.yeastgenome.views.misc_views')
    config.scan('src.sgd.frontend.yeastgenome.views.locus_views')
    # misc pages from misc_views
    config.add_route('healthcheck', '/healthcheck')
    config.add_route('redirect_no_overview', '/{ignore}/overview')
    config.add_route('redirect_no_overview_long', '/{ignore_a}/{ignore_b}/overview')
    config.add_route('home', '/')
    config.add_route('blast_fungal', '/blast-fungal')
    config.add_route('blast_sgd', '/blast-sgd')
    config.add_route('patmatch', '/nph-patmatch')
    config.add_route('restrictionmapper', '/restrictionMapper')
    config.add_route('seq_tools', '/seqTools')
    config.add_route('gotermfinder', '/goTermFinder')
    config.add_route('goslimmapper', '/goSlimMapper')
    config.add_route('strain_alignment', '/strainAlignment')
    config.add_route('complex', '/complex/{identifier}')
    config.add_route('complex_literature_details', '/complex/{identifier}/literature')
    config.add_route('complex_go_details', '/complex/{identifier}/go')    
    config.add_route('allele', '/allele/{identifier}')
    config.add_route('allele_literature_details', '/allele/{identifier}/literature')
    config.add_route('blog_post', '/blog/{slug}')
    config.add_route('blog_index', '/blog')
    config.add_route('blog_archive', '/blog/archive/{year}')
    config.add_route('blog_category', '/blog/category/{category}')
    config.add_route('blog_tag', '/blog/tag/{tag}')
    config.add_route('colleague_show', '/colleague/{identifier}')
    config.add_route('downloads', '/downloads')

    config.add_route('api_portal', '/api')
    config.add_route('api_doc', '/api/doc')
    
    config.add_route('interaction_search', '/interaction-search')
    config.add_route('download_list', '/download-list')
    config.add_route('snapshot', '/genomesnapshot')
    config.add_route('style_guide', '/style-guide')
    config.add_route('suggestion', '/suggestion')
    config.add_route('variant_viewer', '/variant-viewer')
    config.add_route('search', '/search')
    config.add_route('primer3', '/primer3')
    # config.add_route('example', '/example')
    # locus pages from locus_views
    config.add_route('locus', '/locus/{identifier}')
    config.add_route('sequence_details', '/locus/{identifier}/sequence')
    config.add_route('protein_details', '/locus/{identifier}/protein')
    config.add_route('go_details', '/locus/{identifier}/go')
    config.add_route('disease_details', '/locus/{identifier}/disease')
    config.add_route('phenotype_details', '/locus/{identifier}/phenotype')
    config.add_route('interaction_details', '/locus/{identifier}/interaction')
    config.add_route('regulation_details', '/locus/{identifier}/regulation')
    config.add_route('expression_details', '/locus/{identifier}/expression')
    config.add_route('literature_details', '/locus/{identifier}/literature')
    config.add_route('homology_details', '/locus/{identifier}/homology')
    config.add_route('curator_sequence', '/curator/locus/{identifier}/sequence')
    # references
    config.add_route('references_this_week', '/reference/recent')
    config.add_route('reference', '/reference/{identifier}')
    config.add_route('phenotype', '/phenotype/{identifier}')

    # public CI
    config.add_route('new_gene_name_reservation', 'reserved_name/new')
    config.add_route('new_colleague', 'colleague_update')
    config.add_route('submit_data', '/submitData')

    config.add_route('author', '/author/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('author', request)(getattr(chosen_frontend, 'author')(request.matchdict['identifier'])),
                    renderer=chosen_frontend.get_renderer('author'),
                    route_name='author')

    config.add_route('strain', '/strain/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('strain', request)(getattr(chosen_frontend, 'strain')(request.matchdict['identifier'])),
                    renderer=chosen_frontend.get_renderer('strain'),
                    route_name='strain')

    config.add_route('redirect', '/redirect/{page}')
    config.add_view(lambda request: getattr(chosen_frontend, 'redirect')(page=request.matchdict['page'], params=request.GET),
                    renderer=chosen_frontend.get_renderer('redirect'),
                    route_name='redirect')
        
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
    
    # observable root of the ontology, must be redirected to the ypo page
    config.add_route('phenotype_ontology_apo', '/observable/APO:0000017')
    config.add_view(lambda request: chosen_frontend.response_wrapper('phenotype_ontology', request)(getattr(chosen_frontend, 'phenotype_ontology')()),
                    renderer=chosen_frontend.get_renderer('phenotype_ontology'),
                    route_name='phenotype_ontology_apo')
    
    config.add_route('observable', '/observable/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('observable', request)(getattr(chosen_frontend, 'observable')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('observable'),
                    route_name='observable')

    config.add_route('phenotype_ontology', '/ontology/phenotype/ypo')
    config.add_view(lambda request: chosen_frontend.response_wrapper('phenotype_ontology', request)(getattr(chosen_frontend, 'phenotype_ontology')()),
                    renderer=chosen_frontend.get_renderer('phenotype_ontology'),
                    route_name='phenotype_ontology')

    config.add_route('ecnumber', '/ecnumber/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('ecnumber', request)(getattr(chosen_frontend, 'ecnumber')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('ecnumber'),
                    route_name='ecnumber')
    
    config.add_route('go', '/go/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('go', request)(getattr(chosen_frontend, 'go')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('go'),
                    route_name='go')
    
    config.add_route('go_ontology', '/ontology/go/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('go_ontology', request)(getattr(chosen_frontend, 'go_ontology')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('go_ontology'),
                    route_name='go_ontology')

    config.add_route('disease', '/disease/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('disease', request)(getattr(chosen_frontend, 'disease')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('disease'),
                    route_name='disease')

    config.add_route('disease_ontology', '/ontology/disease/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('disease_ontology', request)(getattr(chosen_frontend, 'disease_ontology')(biocon_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('disease_ontology'),
                    route_name='disease_ontology')

    config.add_route('chemical', '/chemical/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('chemical', request)(getattr(chosen_frontend, 'chemical')(chemical_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('chemical'),
                    route_name='chemical')

    config.add_route('domain', '/domain/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('domain', request)(getattr(chosen_frontend, 'domain')(domain_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('domain'),
                    route_name='domain')

    config.add_route('reserved_name', '/reservedname/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('reserved_name', request)(getattr(chosen_frontend, 'reserved_name')(reserved_name_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('reserved_name'),
                    route_name='reserved_name')

    config.add_route('dataset', '/dataset/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('dataset', request)(getattr(chosen_frontend, 'dataset')(bioitem_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('dataset'),
                    route_name='dataset')

    config.add_route('contig', '/contig/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('contig', request)(getattr(chosen_frontend, 'contig')(contig_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('contig'),
                    route_name='contig')

    config.add_route('keyword', '/keyword/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('keyword', request)(getattr(chosen_frontend, 'keyword')(keyword_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('keyword'),
                    route_name='keyword')

    config.add_route('locus_list', '/locus/{list_name}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('locus_list', request)(getattr(chosen_frontend, 'locus_list')(list_name=request.matchdict['list_name'])),
                    renderer=chosen_frontend.get_renderer('locus_list'),
                    route_name='locus_list')

    config.add_route('experiment', '/experiment/{identifier}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('experiment', request)(getattr(chosen_frontend, 'experiment')(experiment_repr=request.matchdict['identifier'].lower())),
                    renderer=chosen_frontend.get_renderer('experiment'),
                    route_name='experiment')

    config.add_route('backend', '/backend/*url')
    config.add_view(lambda request: chosen_frontend.response_wrapper('backend', request)(getattr(chosen_frontend, 'backend')(url_repr=request.matchdict['url'], args=request.GET, request=request)),
                    renderer='json',
                    route_name='backend')

    config.add_route('send_email', '/send_data')
    config.add_view(send_message, route_name='send_email')   

    config.add_route('search_sequence_objects', '/search_sequence_objects')
    config.add_view(lambda request: chosen_frontend.response_wrapper('search_sequence_objects', request)(getattr(chosen_frontend, 'search_sequence_objects')(params=request.GET)),
                    renderer=chosen_frontend.get_renderer('search_sequence_objects'),
                    route_name='search_sequence_objects')

    config.add_route('get_sequence_object', '/get_sequence_object/{id}')
    config.add_view(lambda request: chosen_frontend.response_wrapper('get_sequence_object', request)(getattr(chosen_frontend, 'get_sequence_object')(locus_repr=request.matchdict['id'].lower())),
                    renderer=chosen_frontend.get_renderer('get_sequence_object'),
                    route_name='get_sequence_object')
        
    config.add_route('do_blast', '/run_blast')
    config.add_view(do_blast, route_name='do_blast')
    
    config.add_route('do_patmatch', '/run_patmatch')
    config.add_view(do_patmatch, route_name='do_patmatch')

    config.add_route('do_restmap', '/run_restmapper')
    config.add_view(do_restmap, route_name='do_restmap')

    config.add_route('do_seq_analysis', '/run_seqtools')
    config.add_view(do_seq_analysis, route_name='do_seq_analysis')

    config.add_route('do_gosearch', '/run_gotools')
    config.add_view(do_gosearch, route_name='do_gosearch')

    config.add_route('do_primer3', '/run_primer3')
    config.add_view(do_primer3, route_name='do_primer3')
    
    config.add_route('get_s3_data', '/get_alignment')
    config.add_view(get_s3_data, route_name='get_s3_data')

    config.add_route('do_redirect', '/redirect_backend')
    config.add_view(do_redirect, route_name='do_redirect')

def prepare_frontend(frontend_type, **configs):
    if frontend_type == 'yeastgenome':
        from src.sgd.frontend.yeastgenome import yeastgenome_frontend

        chosen_frontend, configuration = yeastgenome_frontend(config.backend_url, config.heritage_url, config.log_directory, **configs)
        
        prep_views(chosen_frontend, configuration)
        return configuration


    
