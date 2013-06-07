'''
Created on Mar 15, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import bioent_link, biorel_link, \
    interaction_evidence_table_link, genetic_interaction_evidence_filename, \
    physical_interaction_evidence_filename
from sgdfrontend.views import site_layout


'''
-------------------------------Views---------------------------------------
'''
@view_config(route_name='interaction_evidence', renderer='templates/interaction_evidence.pt')
def interaction_evidence(request):
    if 'biorel' in request.GET:
        #Need an interaction evidence page based on a biorel
        biorel_name = request.GET['biorel']
        biorel = get_json(biorel_link(biorel_name, 'interaction'))
        if biorel is None:
            return Response(status_int=500, body='Biorel could not be found.')
        
        format_name = biorel['format_name']
        page = {
                'interaction_evidence_table_link': interaction_evidence_table_link(biorel_key=format_name),
                'genetic_interaction_evidence_filename': genetic_interaction_evidence_filename(biorel_key=format_name),
                'physical_interaction_evidence_filename': physical_interaction_evidence_filename(biorel_key=format_name),
                
                'layout': site_layout(),
                'page_title': biorel['display_name'],
                'display_name': biorel['display_name'],
                'name_with_link': biorel['name_with_link'],
                'description': biorel['description'],
                'hide_interactor':True
                }
        return page
        
    elif 'bioent' in request.GET:
        #Need an interaction evidence page based on a bioent
        bioent_name = request.GET['bioent']
        bioent = get_json(bioent_link(bioent_name, 'locus'))
        if bioent is None:
            return Response(status_int=500, body='Bioent could not be found.')
        
        format_name = bioent['format_name']
        page = {
                'interaction_evidence_table_link': interaction_evidence_table_link(bioent_key=format_name),
                'genetic_interaction_evidence_filename': genetic_interaction_evidence_filename(bioent_key=format_name),
                'physical_interaction_evidence_filename': physical_interaction_evidence_filename(bioent_key=format_name),
                
                'layout': site_layout(),
                'page_title': 'Evidence for interactions with ' + bioent['display_name'],
                'display_name': 'Evidence for interactions with ' + bioent['display_name'],
                'name_with_link': bioent['name_with_link'] + ' Interactions',
                'description': 'Evidence for all interactions associated with ' +  bioent['display_name'],
                'hide_interactor':False
                }
        return page

    else:
        return Response(status_int=500, body='No Bioent or Biorel specified.')
