'''
Created on Jul 11, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend import evaluate_url
from sgdfrontend.link_maker import literature_details_link, go_references_link, \
    phenotype_references_link, literature_graph_link, download_citations_link, \
    interaction_references_link, regulation_references_link


@view_config(route_name='literature', renderer='templates/literature_details.jinja2')
def literature(request):
    bioent = evaluate_url(request)
    
    if bioent is None:
        return Response(status_int=500, body='Bioent could not be found.')
    
    bioent_type = bioent['bioent_type']
    bioent_id = str(bioent['id'])
    
    page = {
                'literature_details_link': literature_details_link(bioent_id, bioent_type),
                'go_references_link': go_references_link(bioent_id, bioent_type),
                'phenotype_references_link': phenotype_references_link(bioent_id, bioent_type),
                'interaction_references_link': interaction_references_link(bioent_id, bioent_type),
                'regulation_references_link': regulation_references_link(bioent_id, bioent_type),
                'literature_graph_link': literature_graph_link(bioent_id, bioent_type),
                'download_link': download_citations_link(),
                
                
                   
                'display_name': bioent['display_name'],
                'format_name': bioent['format_name'],
                'link': bioent['link']
            }
    return page