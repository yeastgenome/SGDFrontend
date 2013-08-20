from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import citation_list_link, bioent_list_link
 
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

@view_config(route_name='download_graph_png')
def download_graph_png(request):
    display_name = request.matchdict['display_name']
    print display_name
    headers = request.response.headers
    headers['Content-Type'] = "image/png"
    
    request.response.body = request.body
        
    headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.png')
    headers['Content-Description'] = 'File Transfer'
    
    return request.response

@view_config(route_name='download_citations')
def download_citations(request):
    reference_ids = request.GET['reference_ids']
    display_name = request.GET['display_name']
    references = get_json(citation_list_link(), data={'reference_ids': reference_ids})
    
    headers = request.response.headers
    
    request.response.text = '\n' + '\n\n'.join([pubmed_format(reference) for reference in references])
    
    headers['Content-Type'] = 'text/plain'        
    headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.nbib')
    headers['Content-Description'] = 'File Transfer'
    return request.response

def pubmed_format(reference_json):
    entries = []
    if 'pubmed_id' in reference_json:
        if reference_json['pubmed_id'] is not None:
            entries.append('PMID- ' + str(reference_json['pubmed_id'])) 
        if reference_json['status'] is not None:
            entries.append('STAT- ' + reference_json['status'])
        if reference_json['issn'] is not None:
            entries.append('IS  - ' + str(reference_json['issn'])) 
        if reference_json['date_published'] is not None:
            entries.append('DP  - ' + str(reference_json['date_published'])) 
        if reference_json['title'] is not None:
            entries.append('TI  - ' + reference_json['title'])
        if reference_json['abstract'] is not None:
            entries.append('AB  - ' + reference_json['abstract'])
        
        
        for author in reference_json['authors']:
            entries.append('AU  - ' + author)
        for reftype in reference_json['reftypes']:
            entries.append('PT  - ' + reftype)
        if reference_json['journal_name_abbrev'] is not None:
            entries.append('TA  - ' + str(reference_json['journal_name_abbrev'])) 
        if reference_json['journal_name'] is not None:
            entries.append('JT  - ' + str(reference_json['journal_name'])) 
        if reference_json['source'] is not None:
            entries.append('SO  - ' + str(reference_json['source'])) 
        
        if reference_json['date_revised'] is not None:        
            entries.append('LR  - ' + str(reference_json['date_revised'])) 
        if reference_json['issue'] is not None: 
            entries.append('IP  - ' + str(reference_json['issue'])) 
        if reference_json['page'] is not None:
            entries.append('PG  - ' + str(reference_json['page'])) 
        if reference_json['volume'] is not None:
            entries.append('VI  - ' + str(reference_json['volume'])) 
        if reference_json['publisher_location'] is not None:
            entries.append('PL  - ' + str(reference_json['publisher_location'])) 
        if reference_json['book_title'] is not None:
            entries.append('BTI - ' + str(reference_json['book_title']))
        if reference_json['volume_title'] is not None:    
            entries.append('VTI - ' + str(reference_json['volume_title'])) 
        if reference_json['isbn'] is not None:
            entries.append('ISBN- ' + str(reference_json['isbn'])) 
    
    return '\n'.join(entries)


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
                'bioent_ids': [bioent['id'] for bioent in bioents], 
                'gene_list_filename': 'gene_list',
                #'send_to_yeastmine_link': send_to_yeastmine_link(),
                #'send_to_go_slim_link': send_to_go_slim_link(),
                #'send_to_goterm_finder': send_to_goterm_finder(),
                'list_type': list_type,
            }
    return page


