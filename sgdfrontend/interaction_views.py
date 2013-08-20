'''
Created on Mar 15, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import interaction_graph_link, analyze_link, \
    bioentity_overview_link, interaction_overview_link, \
    interaction_details_link, interaction_resources_link, download_citations_link


'''
-------------------------------Views---------------------------------------
'''
@view_config(route_name='interactions', renderer='templates/interaction_details.jinja2')
def interactions(request):
    #Need an interaction evidence page based on a bioent
    bioent_repr = request.matchdict['identifier']
    bioent_type = request.matchdict['type']
    bioent = get_json(bioentity_overview_link(bioent_repr, bioent_type))
    if bioent is None:
        return Response(status_int=500, body='Bioent could not be found.')
        
    bioent_id = str(bioent['id'])
    display_name = bioent['display_name']
    page = {
                'interaction_overview_link': interaction_overview_link(bioent_id, bioent_type),
                'interaction_details_link': interaction_details_link(bioent_id, bioent_type),
                'interaction_graph_link': interaction_graph_link(bioent_id, bioent_type),
                'interaction_resources_link': interaction_resources_link(bioent_id, bioent_type),
                'download_citations_link': download_citations_link(),

                'interaction_details_filename': display_name + '_interactions',
                
                'analyze_link': analyze_link(),
                
                'display_name': bioent['display_name'],
                'link': bioent['link'],
                'format_name': bioent['format_name']
                }
    return page
