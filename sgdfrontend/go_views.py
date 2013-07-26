#'''
#Created on Mar 15, 2013
#
#@author: kpaskov
#'''
#from pyramid.response import Response
#from pyramid.view import view_config
#from sgdfrontend import get_json
#from sgdfrontend.link_maker import go_link, go_overview_table_link, \
#    go_ontology_graph_link, bioent_link, go_evidence_table_link, go_graph_link, \
#    biocon_link, go_evidence_link, go_filename, go_f_evidence_filename, \
#    go_p_evidence_filename, go_c_evidence_filename, go_evidence_filename
#from sgdfrontend.views import site_layout
#
#@view_config(route_name='go', renderer='templates/go.pt')
#def go(request):
#    biocon_name = request.matchdict['biocon']
#    biocon = get_json(go_link(biocon_name))
#    if biocon is None:
#        return Response(status_int=500, body='Go term could not be found.')
#    
#    format_name = biocon['format_name']
#    page = {
#                'go_evidence_link': go_evidence_link(biocon_key=format_name),
#                'go_overview_table_link': go_overview_table_link(biocon_key=format_name),
#                'go_ontology_graph_link': go_ontology_graph_link(biocon_key=format_name),
#                'go_filename': go_filename(biocon_key=format_name),
#                
#                'layout': site_layout(),
#                'page_title': biocon['display_name'],
#                'biocon': biocon
#            }
#    return page
#
#@view_config(route_name='go_evidence', renderer='templates/go_evidence.pt')
#def go_evidence(request):
#    if 'bioent' in request.GET:
#        #Need a GO overview table based on a bioent
#        bioent_name = request.GET['bioent']
#        bioent = get_json(bioent_link(bioent_name, 'locus'))
#        if bioent is None:
#            return Response(status_int=500, body='Bioent could not be found.')
#        
#        format_name = bioent['format_name']
#        page = {
#                'go_evidence_table_link': go_evidence_table_link(bioent_key=format_name),
#                'go_graph_link': go_graph_link(bioent_key=format_name),
#                
#                'go_f_evidence_filename': go_f_evidence_filename(bioent_key=format_name),
#                'go_p_evidence_filename': go_p_evidence_filename(bioent_key=format_name),
#                'go_c_evidence_filename': go_c_evidence_filename(bioent_key=format_name),
#                'go_evidence_filename': go_evidence_filename(bioent_key=format_name),
#                
#                'layout': site_layout(),
#                'page_title': 'GO Evidence for ' + bioent['display_name'],
#                'display_name': 'GO Evidence for ' + bioent['display_name'],
#                'name_with_link': 'GO Evidence for ' + bioent['name_with_link'],
#                'split': True
#                }
#        return page
#    elif 'biocon' in request.GET:
#        #Need a GO overview table based on a biocon
#        biocon_name = request.GET['biocon']
#        biocon = get_json(biocon_link(biocon_name, 'go'))
#        if biocon is None:
#            return Response(status_int=500, body='Biocon could not be found.')
#        
#        format_name = biocon['format_name']
#        page = {
#                'go_evidence_table_link': go_evidence_table_link(biocon_key=format_name),
#                'go_graph_link': go_graph_link(biocon_key=format_name),
#                
#                'go_f_evidence_filename': go_f_evidence_filename(biocon_key=format_name),
#                'go_p_evidence_filename': go_p_evidence_filename(biocon_key=format_name),
#                'go_c_evidence_filename': go_c_evidence_filename(biocon_key=format_name),
#                'go_evidence_filename': go_evidence_filename(biocon_key=format_name),
#                
#                'layout': site_layout(),
#                'page_title': 'GO Evidence for ' + biocon['display_name'],
#                'display_name': 'GO Evidence for ' + biocon['display_name'],
#                'name_with_link': 'GO Evidence for ' + biocon['name_with_link'],
#                'split': False
#                }
#        return page
#    else:
#        return Response(status_int=500, body='No Bioent or Biocon specified.')
