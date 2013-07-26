'''
Created on Mar 15, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import bioent_link, interaction_evidence_table_link, \
    genetic_interaction_evidence_filename, physical_interaction_evidence_filename, \
    interaction_graph_link, interaction_evidence_resource_link, interaction_filename, \
    interaction_overview_table_link, genetic_interactor_listname, \
    physical_interactor_listname, all_interactor_listname, both_interactor_listname


'''
-------------------------------Views---------------------------------------
'''
@view_config(route_name='interaction_evidence', renderer='templates/interaction_evidence.jinja2')
def interaction_evidence(request):
    if 'bioent' in request.GET:
        #Need an interaction evidence page based on a bioent
        bioent_name = request.GET['bioent']
        bioent = get_json(bioent_link(bioent_name, 'locus'))
        if bioent is None:
            return Response(status_int=500, body='Bioent could not be found.')
        
        format_name = bioent['format_name']
        page = {
                'interaction_evidence_table_link': interaction_evidence_table_link(bioent_key=format_name),
                'interaction_overview_table_link': interaction_overview_table_link(bioent_key=format_name),
                'interaction_graph_link': interaction_graph_link(bioent_key=format_name),
                'resource_link': interaction_evidence_resource_link(bioent_key=format_name),

                'genetic_interaction_evidence_filename': genetic_interaction_evidence_filename(bioent_key=format_name),
                'physical_interaction_evidence_filename': physical_interaction_evidence_filename(bioent_key=format_name),
                'interactor_filename': interaction_filename(bioent_key=format_name),
                
                'genetic_listname': genetic_interactor_listname(bioent_key=format_name),
                'physical_listname': physical_interactor_listname(bioent_key=format_name),
                'all_listname': all_interactor_listname(bioent_key=format_name),
                'both_listname': both_interactor_listname(bioent_key=format_name),
                
                'display_name': bioent['display_name'],
                'link': bioent['link'] + ' Interactions',
                'format_name': bioent['format_name']
                }
        return page

    else:
        return Response(status_int=500, body='No Bioent or Biorel specified.')
