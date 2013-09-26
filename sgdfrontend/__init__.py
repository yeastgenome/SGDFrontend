from pyramid.config import Configurator
from pyramid_jinja2 import renderer_factory
from sgdfrontend.link_maker import bioentity_overview_link
from sgdfrontend.models import get_root
import json
import requests

def get_json(url, data=None):
    print url
    if data is not None:
        headers = {'Content-type': 'application/json; charset=utf-8"', 'processData': False}
        r = requests.post(url, data=json.dumps(data), headers=headers)
    else:
        r = requests.get(url)
    try:
        return r.json()
    except:
        return None

def evaluate_url(request):
    bioent_repr = request.matchdict['identifier'].upper()
    bioent_type = request.matchdict['type'].lower()
    bioent = get_json(bioentity_overview_link(bioent_repr, bioent_type))
    return bioent

def main(global_config, **settings):
    """ This function returns a WSGI application.
    
    It is usually called by the PasteDeploy framework during 
    ``paster serve``.
    """
    settings = dict(settings)
    settings.setdefault('jinja2.i18n.domain', 'myproject')

    config = Configurator(root_factory=get_root, settings=settings)
    config.add_translation_dirs('locale/')
    config.include('pyramid_jinja2')

    config.add_static_view('static', 'sgdfrontend:static')
    config.add_static_view('templates', 'sgdfrontend:templates')
    
    #Interaction views
    config.add_route('interactions', '/{type}/{identifier}/interactions')
    
    #Literature views
    config.add_route('literature', '/{type}/{identifier}/literature')
    
    #Regulation views
    config.add_route('regulations', '/{type}/{identifier}/regulation')

    #Misc views
    config.add_route('download_citations', '/download_citations')
    config.add_route('download_table', '/download_table')
    config.add_route('analyze', '/analyze')

    config.scan()

    return config.make_wsgi_app()
