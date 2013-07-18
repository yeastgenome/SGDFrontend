from pyramid.config import Configurator
import requests
import simplejson

def get_json(url, data=None):
    if data is not None:
        r = requests.post(url, data=data)
    else:
        r = requests.get(url)
        print r.url
    return r.json()

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(settings=settings)
    config.add_static_view('static', 'static', cache_max_age=3600)
    
    #Basic views
    config.add_route('home', '/')
    config.add_route('my_sgd', '/my_sgd')
    config.add_route('help', '/help')
    config.add_route('about', '/about')
    
    #Search views
    config.add_route('search', '/search')
    config.add_route('search_results', '/search_results')

    config.add_route('typeahead', '/typeahead')
   
    #Bioent views
    config.add_route('locus', '/locus/{bioent}')

    #GO views
    config.add_route('go', '/go/{biocon}')
    config.add_route('go_evidence', '/go_evidence')
    
    #Phenotype views
    config.add_route('phenotype', '/phenotype/{biocon}')
    config.add_route('phenotype_evidence', '/phenotype_evidence')
            
    #Interaction views
    config.add_route('interaction_evidence', '/interaction_evidence')
    
    #Litguide views
    config.add_route('litguide_evidence', '/litguide_evidence')
       
    #Reference views
    config.add_route('reference', '/reference/{reference}')
    config.add_route('author', '/author/{author}')
    config.add_route('chemical', '/chemical/{chemical}')
    
    #Sequence views
    config.add_route('sequence', '/sequence')
    
    #Misc views
    config.add_route('download_graph', '/download_graph/{file_type}')
    config.add_route('analyze', '/analyze')

    config.scan()
    return config.make_wsgi_app()
