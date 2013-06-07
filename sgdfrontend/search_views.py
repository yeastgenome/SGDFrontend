'''
Created on Mar 19, 2013

@author: kpaskov
'''
from pyramid.response import Response
from pyramid.view import view_config
from sgdfrontend.link_maker import search_results_link
from sgdfrontend.views import site_layout
from sqlalchemy.exc import DBAPIError


cat_to_biotype = {'genes':'LOCUS', 'goterms':'GO', 'phenotypes':'PHENOTYPE', 'proteins':'PROTEIN', 'references':'REFERENCE', 'sequences':'SEQUENCE', 'transcripts':'TRANSCRIPT',
                  'dna_sequences':'DNA_SEQUENCE', 'protein_sequences':'PROTEIN_SEQUENCE', 'all':'all'}

@view_config(route_name='search', renderer='templates/search.pt')
def search_view(request):
    try:
        search_str = request.GET['keyword']
        page = 0
        if 'page' in request.GET:
            page = int(request.GET['page'])
        category = 'all'
        biotype = 'all'
        if 'category' in request.GET and request.GET['category'] != None:
            category = request.GET['category']
            biotype = cat_to_biotype[category]
            
        results_url = search_results_link(str(search_str), str(biotype), str(page))
        
    except DBAPIError:
        return Response("Error.", content_type='text/plain', status_int=500)
    return {'layout': site_layout(), 'page_title': 'Search Results',
            'keyword':search_str, 'category':category, 'page':page, 'results_url':results_url}
    
    
    