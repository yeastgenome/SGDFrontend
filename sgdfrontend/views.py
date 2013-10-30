from pyramid.httpexceptions import HTTPFound
from pyramid.renderers import render
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import citation_list_link, bioent_list_link, \
    download_table_link, go_enrichment_link, enrichment_link
import datetime
import json
 
def clean_cell(cell):
    if cell is None:
        return ''
    elif cell.startswith('<a href='):
        cell = cell[cell.index('>')+1:]
        cell = cell[:cell.index('<')]
        return cell
    else:
        return cell
    
@view_config(route_name='redirect')
def redirect(request):
    page = request.matchdict['page']
    if len(request.GET) == 1:
        bioent_repr = request.GET.values()[0]
        return HTTPFound('/locus/' + bioent_repr + '/' + page)
    else:
        return Response(status_int=500, body='Invalid URL.')
    
@view_config(route_name='home')
def home(request):
    return Response(status_int=200, body='In progress.')

header_str = None
footer_str = None

@view_config(route_name='header', renderer='jsonp')
def header(request):
    header_str = render('templates/header.jinja2', {})
    return {'header': header_str}

@view_config(route_name='footer', renderer='jsonp')
def footer(request):
    footer_str = render('templates/footer.jinja2', {})
    return {'footer': footer_str}

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
    references = get_json(citation_list_link(), data={'reference_ids': reference_ids})
    
    headers = request.response.headers
    
    request.response.text = '\n' + '\n\n'.join([ref['text'] for ref in references])
    
    headers['Content-Type'] = 'text/plain'        
    headers['Content-Disposition'] = str('attachment; filename=' + display_name + '.nbib')
    headers['Content-Description'] = 'File Transfer'
    return request.response

@view_config(route_name='analyze', renderer='templates/analyze.jinja2')
def analyze_view(request):
    list_name = request.POST['list_name']
    bioent_display_name = request.POST['bioent_display_name']
    bioent_format_name = request.POST['bioent_format_name']
    bioent_link = request.POST['bioent_link']
    bioent_ids = list(set([int(x) for x in json.loads(request.POST['bioent_ids'])]))
        
    bioents = get_json(bioent_list_link(), data={'bioent_ids': bioent_ids})

    if bioents is None:
        return Response(status_int=500, body='Bioents could not be found.') 
    
    page = {    'bioent_display_name': bioent_display_name,
                'bioent_format_name': bioent_format_name,
                'bioent_link': bioent_link,
                'go_enrichment_link': enrichment_link(),
                'bioents': json.dumps(bioents),
                'bioent_format_names': " ".join([bioent['format_name'] for bioent in bioents]), 
                'gene_list_filename': 'gene_list',
                'list_type': list_name,
                'download_table_link': download_table_link(),
            }
    return page


@view_config(route_name='enrichment', renderer='json')
def enrichment(request):
    bioent_ids = request.json_body['bioent_ids']
    enrichment_results = get_json(go_enrichment_link(), data={'bioent_ids': bioent_ids})
    return enrichment_results

