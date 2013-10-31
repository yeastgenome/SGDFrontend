'''
Created on Mar 15, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import evaluate_url
from sgdfrontend.link_maker import phenotype_overview_link, \
    phenotype_details_link, phenotype_resources_link, tab_link, download_table_link
#
#@view_config(route_name='phenotype', renderer='templates/phenotype.pt')
#def phenotype(request):
#    biocon_name = request.matchdict['biocon']
#    biocon = get_json(phenotype_link(biocon_name))
#    if biocon is None:
#        return Response(status_int=500, body='Phenotype could not be found.')
#    
#    format_name = biocon['format_name']
#    page = {
#                'phenotype_evidence_link': phenotype_evidence_link(biocon_key=format_name),
#                'phenotype_overview_table_link': phenotype_overview_table_link(biocon_key=format_name),
#                'phenotype_filename': phenotype_filename(biocon_key=format_name),
#                'phenotype_ontology_graph_link': phenotype_ontology_graph_link(biocon_key=format_name),
#            
#                'layout': site_layout(),
#                'page_title': biocon['display_name'],
#                'biocon': biocon
#            }
#    return page
#

@view_config(route_name='phenotype_details', renderer='templates/phenotype_details.jinja2')
def phenotype_details(request):
    bioent = evaluate_url(request)
    
    if bioent is None:
        return Response(status_int=500, body='Bioent could not be found.')
        
    bioent_id = str(bioent['id'])
    display_name = bioent['display_name']
    page = {
                'phenotype_overview_link': phenotype_overview_link(bioent_id),
                'phenotype_details_link': phenotype_details_link(bioent_id),
                'phenotype_resources_link': phenotype_resources_link(bioent_id),
                'tab_link': tab_link(bioent_id),
    
                'download_table_link': download_table_link(),

                'phenotype_details_filename': display_name + '_phenotypes',
                                
                'display_name': bioent['display_name'],
                'link': bioent['link'],
                'format_name': bioent['format_name']
                }
    return page