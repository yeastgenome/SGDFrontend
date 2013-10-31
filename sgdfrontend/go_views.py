#'''
#Created on Mar 15, 2013
#
#@author: kpaskov
#'''
#from pyramid.response import Response
#from pyramid.view import view_config
#from sgdfrontend import evaluate_url
#from sgdfrontend.link_maker import phenotype_overview_link, \
#    phenotype_details_link, tab_link, download_table_link
##
##@view_config(route_name='go', renderer='templates/go.pt')
##def go(request):
##    biocon_name = request.matchdict['biocon']
##    biocon = get_json(go_link(biocon_name))
##    if biocon is None:
##        return Response(status_int=500, body='Go term could not be found.')
##    
##    format_name = biocon['format_name']
##    page = {
##                'go_evidence_link': go_evidence_link(biocon_key=format_name),
##                'go_overview_table_link': go_overview_table_link(biocon_key=format_name),
##                'go_ontology_graph_link': go_ontology_graph_link(biocon_key=format_name),
##                'go_filename': go_filename(biocon_key=format_name),
##                
##                'layout': site_layout(),
##                'page_title': biocon['display_name'],
##                'biocon': biocon
##            }
##    return page
##
##@view_config(route_name='go_details', renderer='templates/go_details.jinja2')
#def go_details(request):
#    bioent = evaluate_url(request)
#    
#    if bioent is None:
#        return Response(status_int=500, body='Bioent could not be found.')
#        
#    bioent_id = str(bioent['id'])
#    display_name = bioent['display_name']
#    page = {
#                'phenotype_overview_link': phenotype_overview_link(bioent_id),
#                'phenotype_details_link': phenotype_details_link(bioent_id),
#                
#                'tab_link': tab_link(bioent_id),
#    
#                'download_table_link': download_table_link(),
#
#                'man_f_filename': display_name + '_manual_function',
#                'man_p_filename': display_name + '_manual_process',
#                'map_c_filename': display_name + '_manual_compartment',
#                'htp_f_filename': display_name + '_high-throughput_function',
#                'htp_p_filename': display_name + '_high-throughput_process',
#                'htp_c_filename': display_name + '_high-throughput_compartment',
#                'comp_f_filename': display_name + '_computational_function',
#                'comp_p_filename': display_name + '_computational_process',
#                'comp_c_filename': display_name + '_computational_compartment',
#                                
#                'display_name': bioent['display_name'],
#                'link': bioent['link'],
#                'format_name': bioent['format_name']
#                }
#    return page