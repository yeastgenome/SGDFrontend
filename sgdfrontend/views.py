from pyramid.renderers import get_renderer
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import list_link, go_enrichment_link, enrichment_header_filename
 
#def home_view(request):
#    return {'page_title': 'SGD2.0'}

#
#@view_config(route_name='my_sgd', renderer='templates/my_sgd.pt')
#def my_sgd_view(request):
#    return {'layout': site_layout(), 'page_title': 'My SGD'}
#
#@view_config(route_name='help', renderer='templates/help.pt')
#def help_view(request):
#    return {'layout': site_layout(), 'page_title': 'Help'}
#
#@view_config(route_name='about', renderer='templates/about.pt')
#def about_view(request):
#    return {'layout': site_layout(), 'page_title': 'About'}
#
#@view_config(route_name='chemical', renderer='templates/chemical.pt')
#def chemical(request):
#    chemical_name = request.matchdict['chemical']
#    chemical = get_json(chemical_link(chemical_name))
#    if chemical is None:
#        return Response(status_int=500, body='Chemical could not be found.')
#    
#    format_name = chemical['format_name']
#    page = {
#                'phenotype_overview_table_link': phenotype_overview_table_link(chemical_key=format_name),
#                'phenotype_filename': phenotype_filename(chemical_key=format_name),
#            
#                'layout': site_layout(),
#                'page_title': chemical['display_name'],
#                'chemical': chemical
#            }
#    return page
#
#@view_config(route_name='reference', renderer='templates/reference.pt')
#def reference_view(request):
#    ref_name = request.matchdict['reference']
#    reference = get_json(reference_link(ref_name))
#    if reference is None:
#            return Response(status_int=500, body='Reference could not be found.') 
#        
#    format_name = reference['format_name']
#    page = {
#                'go_overview_table_link': go_overview_table_link(reference_key=format_name),
#                'interaction_overview_table_link': interaction_overview_table_link(reference_key=format_name),
#                'phenotype_overview_table_link': phenotype_overview_table_link(reference_key=format_name),
#                'bioent_overview_table_link': bioent_overview_table_link(reference_key=format_name),
#                'reference_graph_link': reference_graph_link(reference_key=format_name),
#            
#                'go_filename': go_filename(reference_key=format_name),
#                'interaction_filename': interaction_filename(reference_key=format_name),
#                'cellular_phenotype_filename': cellular_phenotype_filename(reference_key=format_name),
#                'chemical_phenotype_filename': chemical_phenotype_filename(reference_key=format_name),
#                'pp_rna_phenotype_filename': pp_rna_phenotype_filename(reference_key=format_name),
#                'bioent_filename': bioent_filename(reference_key=format_name),
#
#                'layout': site_layout(),
#                'page_title': reference['display_name'],
#                'ref': reference
#            }
#    return page
#
#@view_config(route_name='author', renderer='templates/author.pt')
#def author_view(request):
#    author_name = request.matchdict['author']
#    author = get_json(author_link(author_name))
#    if author is None:
#            return Response(status_int=500, body='Author could not be found.') 
#        
#    format_name = author['format_name']
#    page = {    
#                'assoc_reference_link': assoc_reference_link(author_key=format_name),
#                
#                'layout': site_layout(),
#                'page_title': author['display_name'],
#                'author': author
#            }
#    return page

@view_config(route_name='download_graph')
def download_graph_view(request):
    file_type = request.matchdict['file_type']
    headers = request.response.headers
    if file_type == 'png':
        headers['Content-Type'] = 'image/png'
    elif file_type == 'pdf':
        headers['Content-Type'] = 'application/pdf'
    elif file_type == 'svg':
        headers['Content-Type'] = 'image/svg+xml'
    elif file_type == 'xml':
        headers['Content-Type'] = 'text/xml'
    elif file_type == 'txt':
        headers['Content-Type'] = 'text/plain'
    
    request.response.body = request.body
        
    headers['Content-Disposition'] = str('attachment; filename=network.' + file_type)
    headers['Content-Description'] = 'File Transfer'
    return request.response


@view_config(route_name='analyze', renderer='templates/analyze.jinja2')
def analyze_view(request):
    locus_format_names = request.GET['locus']
    display_name = request.GET['display_name']
    bioents = get_json(list_link(), data={'locus': locus_format_names})
    if bioents is None:
        return Response(status_int=500, body='Bioents could not be found.') 
    page = {    'bioents': bioents,
                'bioent_ids': [bioent['id'] for bioent in bioents], 
                'gene_list_filename': 'gene_list',
                'go_enrichment_link': go_enrichment_link(),
                'enrichment_header_filename': enrichment_header_filename(),
                #'send_to_yeastmine_link': send_to_yeastmine_link(),
                #'send_to_go_slim_link': send_to_go_slim_link(),
                #'send_to_goterm_finder': send_to_goterm_finder(),
                'display_name': display_name,
            }
    return page


