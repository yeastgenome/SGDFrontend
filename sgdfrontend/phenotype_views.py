#'''
#Created on Mar 15, 2013
#
#@author: kpaskov
#'''
#from pyramid.response import Response
#from pyramid.view import view_config
#from sgdfrontend import get_json
#from sgdfrontend.link_maker import phenotype_link, phenotype_evidence_link, \
#    phenotype_filename, phenotype_ontology_graph_link, phenotype_overview_table_link, \
#    bioent_link, phenotype_evidence_table_link, cellular_phenotype_evidence_filename, \
#    chemical_phenotype_evidence_filename, pp_rna_phenotype_evidence_filename, \
#    phenotype_evidence_filename, biocon_link, phenotype_graph_link
#from sgdfrontend.views import site_layout
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
#@view_config(route_name='phenotype_evidence', renderer='templates/phenotype_evidence.pt')
#def phenotype_evidence(request):
#    if 'bioent' in request.GET:
#        #Need a phenotype evidence page based on a bioent
#        bioent_name = request.GET['bioent']
#        bioent = get_json(bioent_link(bioent_name, 'locus'))
#        if bioent is None:
#            return Response(status_int=500, body='Bioent could not be found.')
#        
#        format_name = bioent['format_name']
#        page = {
#                'phenotype_evidence_table_link': phenotype_evidence_table_link(bioent_key=format_name),
#                
#                'cellular_phenotype_evidence_filename': cellular_phenotype_evidence_filename(bioent_key=format_name),
#                'chemical_phenotype_evidence_filename': chemical_phenotype_evidence_filename(bioent_key=format_name),
#                'pp_rna_phenotype_evidence_filename': pp_rna_phenotype_evidence_filename(bioent_key=format_name),
#                'phenotype_evidence_filename': phenotype_evidence_filename(bioent_key=format_name),
#                'phenotype_graph_link': phenotype_graph_link(bioent_key=format_name),
#                               
#                'layout': site_layout(),
#                'page_title': 'Phenotype Evidence for ' + bioent['display_name'],
#                'display_name': 'Phenotype Evidence for ' + bioent['display_name'],
#                'name_with_link': 'Phenotype Evidence for ' + bioent['name_with_link'],
#                'split': True
#                }
#        return page
#    elif 'biocon' in request.GET:
#        #Need a phenotype evidence page based on a biocon
#        biocon_name = request.GET['biocon']
#        biocon = get_json(biocon_link(biocon_name, 'phenotype'))
#        if biocon is None:
#            return Response(status_int=500, body='Biocon could not be found.')
#        
#        format_name = biocon['format_name']
#        page = {
#                'phenotype_evidence_table_link': phenotype_evidence_table_link(biocon_key=format_name),
#                
#                'cellular_phenotype_evidence_filename': cellular_phenotype_evidence_filename(biocon_key=format_name),
#                'chemical_phenotype_evidence_filename': chemical_phenotype_evidence_filename(biocon_key=format_name),
#                'pp_rna_phenotype_evidence_filename': pp_rna_phenotype_evidence_filename(biocon_key=format_name),
#                'phenotype_evidence_filename': phenotype_evidence_filename(biocon_key=format_name),
#                'phenotype_graph_link': phenotype_graph_link(biocon_key=format_name),
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
