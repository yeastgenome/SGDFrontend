# some logic (NOT all) has been moved to views to be more 'pyramid-y'
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound
from src.sgd.frontend import config
import datetime
import json
import requests

TEMPLATE_ROOT = 'src:sgd/frontend/yeastgenome/static/templates/'

def get_locus_obj(identifier):
    backend_locus_url = config.backend_url + '/locus/' + identifier
    locus_response = requests.get(backend_locus_url)
    if locus_response.status_code != 200:
        return None
    locus = json.loads(locus_response.text)
    tabs =  json.loads(requests.get(config.backend_url + '/locus/' + str(locus['id']) + '/tabs').text)
    return { 'locus': locus, 'locus_js': json.dumps(locus), 'tabs': tabs, 'tabs_js': json.dumps(tabs) }

def render_locus_page(request, template_name):
    locus_obj = get_locus_obj(request.matchdict['identifier'])
    if locus_obj == None:
        return HTTPNotFound()
    return render_to_response(TEMPLATE_ROOT + template_name + '.jinja2', locus_obj, request=request)

@view_config(route_name='locus')
@view_config(route_name='locus_o')
def locus(request):
    return render_locus_page(request, 'locus')

@view_config(route_name='sequence_details')
def sequence_details(request):
    locus_obj = get_locus_obj(request.matchdict['identifier'])
    if locus_obj == None:
        return HTTPNotFound()
    history = { 'history_js': json.dumps(locus_obj.get('locus').get('history')) }
    locus_obj.update(history)
    return render_to_response(TEMPLATE_ROOT + 'sequence_details.jinja2', locus_obj, request=request)

@view_config(route_name='protein_details')
def protein_details(request):
    return render_locus_page(request, 'protein_details')

@view_config(route_name='go_details')
def go_details(request):
    return render_locus_page(request, 'go_details')

@view_config(route_name='phenotype_details')
def phenotype_details(request):
    return render_locus_page(request, 'phenotype_details')

@view_config(route_name='interaction_details')
def interaction_details(request):
    return render_locus_page(request, 'interaction_details')

@view_config(route_name='regulation_details')
def regulation_details(request):
    return render_locus_page(request, 'regulation_details')

@view_config(route_name='expression_details')
def expression_details(request):
    return render_locus_page(request, 'expression_details')

@view_config(route_name='literature_details')
def literature_details(request):
    return render_locus_page(request, 'literature_details')

@view_config(route_name='curator_sequence')
def curator_sequence(request):
    return render_locus_page(request, 'curator_sequence')
