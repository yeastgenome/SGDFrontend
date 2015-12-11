from wsgiref.simple_server import make_server
from pyramid.config import Configurator

def main(global_config, **settings):
        config = Configurator(settings=settings)
        
        config.add_route('home', '/')
        config.add_route('upload', '/upload')
        
        config.scan()
        config.add_static_view(name='static', path='../static')

        return config.make_wsgi_app()
