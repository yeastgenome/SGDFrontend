from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import citation_list_link, bioent_list_link, \
    download_table_link
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

@view_config(route_name='header', renderer='templates/header.jinja2')
def header_view(request):
    return {}

@view_config(route_name='footer', renderer='templates/footer.jinja2')
def footer_view(request):
    return {}

