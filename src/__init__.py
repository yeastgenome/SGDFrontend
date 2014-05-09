from src.sgd.frontend import prepare_frontend

__author__ = 'kpaskov'

def yeastgenome(global_config, **configs):
    """ This function returns a Pyramid WSGI application.
    """
    config = prepare_frontend('yeastgenome', **configs)
    return config.make_wsgi_app()