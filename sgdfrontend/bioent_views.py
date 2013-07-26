'''
Created on May 31, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import get_json
from sgdfrontend.link_maker import go_overview_table_link, go_f_filename, \
    go_p_filename, go_c_filename, go_evidence_link, phenotype_overview_table_link, \
    phenotype_evidence_link, cellular_phenotype_filename, \
    chemical_phenotype_filename, pp_rna_phenotype_filename, \
    interaction_overview_table_link, interaction_filename, interaction_evidence_link, \
    interaction_graph_link, bioent_overview_table_link, bioent_evidence_link, \
    locus_link

#@view_config(route_name='locus', renderer='templates/locus.pt')
#def locus(request):
#    bioent_name = request.matchdict['bioent']
#    
#    locus = get_json(locus_link(bioent_name))
#    if locus is None:
#        return Response(status_int=500, body='Locus could not be found.')
#    
#    format_name = locus['format_name']
#    page = {   'go_overview_table_link': go_overview_table_link(bioent_key=format_name),
#                'go_f_filename': go_f_filename(bioent_key=format_name),
#                'go_p_filename': go_p_filename(bioent_key=format_name),
#                'go_c_filename': go_c_filename(bioent_key=format_name),
#                'go_evidence_link': go_evidence_link(bioent_key=format_name),
#                   
#                'phenotype_overview_table_link': phenotype_overview_table_link(bioent_key=format_name),
#                'cellular_phenotype_filename': cellular_phenotype_filename(bioent_key=format_name),
#                'chemical_phenotype_filename': chemical_phenotype_filename(bioent_key=format_name),
#                'pp_rna_phenotype_filename': pp_rna_phenotype_filename(bioent_key=format_name),
#                'phenotype_evidence_link': phenotype_evidence_link(bioent_key=format_name),
#                   
#                'interaction_overview_table_link': interaction_overview_table_link(bioent_key=format_name),
#                'interaction_filename': interaction_filename(bioent_key=format_name),
#                'interaction_evidence_link': interaction_evidence_link(bioent_key=format_name),
#                'interaction_graph_link': interaction_graph_link(bioent_key=format_name),
#                   
#                'bioent_overview_table_link': bioent_overview_table_link(bioent_key=format_name),
#                'bioent_evidence_link': bioent_evidence_link(bioent_key=format_name),
#                
#                'layout': site_layout(),
#                'page_title': locus['display_name'],
#                'bioent': locus
#                   }
#    return page
