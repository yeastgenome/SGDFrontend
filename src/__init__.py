from src.sgd.frontend import prepare_frontend
from pyramid.response import Response
from pyramid.events import NewRequest

__author__ = 'kpaskov'

def add_cors_headers_response_callback(event):
    def cors_headers(request, response):
        response.headers.update({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT,OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '1728000',
        })
    event.request.add_response_callback(cors_headers)
    
def yeastgenome(global_config, **configs):
    """ This function returns a Pyramid WSGI application.
    """
    config.add_subscriber(add_cors_headers_response_callback, NewRequest)

    config = prepare_frontend('yeastgenome', **configs)
    return config.make_wsgi_app()
