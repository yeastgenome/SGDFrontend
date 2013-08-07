'''
Created on Jul 11, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import bioent_link, bioent_evidence_table_link, \
    go_evidence_table_link, phenotype_evidence_table_link

@view_config(route_name='litguide_evidence', renderer='templates/litguide_evidence.jinja2')
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
                   
                'display_name': bioent['display_name'],
                'format_name': bioent['format_name'],
                'link': bioent['link']
                }
        return page
    else:
        return Response(status_int=500, body='No Bioent specified.')