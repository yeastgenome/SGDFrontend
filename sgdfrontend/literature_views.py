'''
Created on Jul 11, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import evaluate_url
from sgdfrontend.link_maker import literature_details_link, download_citations_link, \
    tab_link, literature_overview_link


@view_config(route_name='literature', renderer='templates/literature_details.jinja2')
def literature(request):
    bioent = evaluate_url(request)
    
    if bioent is None:
        return Response(status_int=500, body='Bioent could not be found.')
    
    bioent_id = str(bioent['id'])
    
    page = {
                'literature_details_link': literature_details_link(bioent_id),
                'download_link': download_citations_link(),
                'tab_link': tab_link(bioent_id),
                'literature_overview_link': literature_overview_link(bioent_id),
                'literature_overview_filename': bioent['display_name'] + '_literature_overview.png',
                   
                'display_name': bioent['display_name'],
                'format_name': bioent['format_name'],
                'link': bioent['link']
            }
    return page