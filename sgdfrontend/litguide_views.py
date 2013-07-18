'''
Created on Jul 11, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import bioent_link, bioent_evidence_table_link, \
    go_evidence_table_link, phenotype_evidence_table_link
from sgdfrontend.views import site_layout

@view_config(route_name='litguide_evidence', renderer='templates/litguide_evidence.pt')
def litguide_evidence(request):
    if 'bioent' in request.GET:
        #Need a bioent evidence table based on a bioent
        bioent_name = request.GET['bioent']
        bioent = get_json(bioent_link(bioent_name, 'locus'))
        if bioent is None:
            return Response(status_int=500, body='Bioent could not be found.')
        
        format_name = bioent['format_name']
        page = {
                'bioent_evidence_table_link': bioent_evidence_table_link(bioent_key=format_name),
                'go_evidence_table_link': go_evidence_table_link(bioent_key=format_name),
                'phenotype_evidence_table_link': phenotype_evidence_table_link(bioent_key=format_name),
                   
                'layout': site_layout(),
                'page_title': 'Literature for ' + bioent['display_name'],
                'display_name': 'Literature for ' + bioent['display_name'],
                'name_with_link': 'Literature for ' + bioent['name_with_link']
                }
        return page
    else:
        return Response(status_int=500, body='No Bioent specified.')