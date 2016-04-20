from wsgiref.simple_server import make_server
from pyramid.config import Configurator
from sqlalchemy import create_engine
import os

from .models import DBSession, Base

def main(global_config, **settings):
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

    config = Configurator(settings=settings)

    config.add_route('home', '/')
    config.add_route('upload', '/upload')
    
    config.add_route('colleague', '/colleagues/{format_name}')
    config.add_route('colleagues', '/colleagues')
    config.add_route('keywords', '/keywords')
    config.add_route('formats', '/formats')

    config.add_route('sign_in', '/signin')
    config.add_route('sign_out', '/signout')

    config.scan()
    config.add_static_view(name='static', path='../static')

    config.configure_celery(global_config['__file__'])

    return config.make_wsgi_app()
