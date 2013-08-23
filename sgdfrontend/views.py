from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import citation_list_link, bioent_list_link, \
    download_table_link
import datetime
import json
 
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

def clean_cell(cell):
    if cell is None:
        return ''
    elif cell.startswith('<a href='):
        cell = cell[cell.index('>')+1:]
        cell = cell[:cell.index('<')]
        return cell
    else:
        return cell

@view_config(route_name='download_table')
def download_table(request):
    header_info = json.loads(request.POST['headers'])
    data = json.loads(request.POST['data'])
    display_name = request.POST['display_name']
        
    headers = request.response.headers
    
    date = datetime.datetime.now().strftime("%m/%d/%Y")
    description = "!\n!Date: " + date + '\n' + "!From: Saccharomyces Genome Database (SGD) \n!URL: http://www.yeastgenome.org/ \n!Contact Email: sgd-helpdesk@lists.stanford.edu \n!Funding: NHGRI at US NIH, grant number 5-P41-HG001315 \n!"
    
    table_header = description + '\n\n' + '\t'.join(header_info)
    
    request.response.text = table_header + '\n' + '\n'.join(['\t'.join([clean_cell(cell) for cell in row]) for row in data])
    
    headers['Content-Type'] = 'text/plain'        
    headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.txt')
    headers['Content-Description'] = 'File Transfer'
    return request.response

@view_config(route_name='download_citations')
def download_citations(request):
    reference_ids = list(set(request.POST['reference_ids'].split(',')))
    display_name = request.POST['display_name']
    print reference_ids
    references = get_json(citation_list_link(), data={'reference_ids': reference_ids})
    
    headers = request.response.headers
    
    request.response.text = '\n' + '\n\n'.join(references)
    
    headers['Content-Type'] = 'text/plain'        
    headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.nbib')
    headers['Content-Description'] = 'File Transfer'
    return request.response

@view_config(route_name='analyze', renderer='templates/analyze.jinja2')
def analyze_view(request):
    list_type = request.POST['list_type']
    bioent_display_name = request.POST['bioent_display_name']
    bioent_format_name = request.POST['bioent_format_name']
    bioent_link = request.POST['bioent_link']
    bioent_ids = list(set(request.POST['bioent_ids'].split(',')))
    
    bioents = get_json(bioent_list_link(), data={'bioent_ids': bioent_ids})
    if bioents is None:
        return Response(status_int=500, body='Bioents could not be found.') 
    page = {    'bioent_display_name': bioent_display_name,
                'bioent_format_name': bioent_format_name,
                'bioent_link': bioent_link,
                'bioents': bioents,
                'bioent_ids': " ".join([bioent['format_name'] for bioent in bioents]), 
                'gene_list_filename': 'gene_list',
                'list_type': list_type,
                'download_table_link': download_table_link(),
            }
    return page


