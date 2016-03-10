# some logic (NOT all) has been moved to views to be more 'pyramid-y'
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound
from src.sgd.frontend import config
import json
import requests

TEMPLATE_ROOT = 'src:sgd/frontend/yeastgenome/static/templates/'

@view_config(route_name='blast_fungal') 
def blast_fungal(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_fungal.jinja2', {}, request=request)

@view_config(route_name='blast_sgd') 
def blast_sgd(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_sgd.jinja2', {}, request=request)

@view_config(route_name='interaction_search') 
def blast_sgd(request):
    return render_to_response(TEMPLATE_ROOT + 'interaction_search.jinja2', {}, request=request)

@view_config(route_name='snapshot') 
def snapshot(request):
    return render_to_response(TEMPLATE_ROOT + 'snapshot.jinja2', {}, request=request)

@view_config(route_name='style_guide') 
def style_guide(request):
    return render_to_response(TEMPLATE_ROOT + 'style_guide.jinja2', {}, request=request)

@view_config(route_name='suggestion') 
def suggestion(request):
    return render_to_response(TEMPLATE_ROOT + 'suggestion.jinja2', {}, request=request)

@view_config(route_name='variant_viewer') 
def variant_viewer(request):
    return render_to_response(TEMPLATE_ROOT + 'variant_viewer.jinja2', {}, request=request)

@view_config(route_name='search') 
def search(request):
    return render_to_response(TEMPLATE_ROOT + 'search.jinja2', {}, request=request)
    
# TEMP, render homepage here for prototype
@view_config(route_name='home') 
def home(request):
    return render_to_response(TEMPLATE_ROOT + 'temp_homepage.jinja2', {}, request=request)

# example
# @view_config(route_name='example') 
# def example(request):
#     return render_to_response(TEMPLATE_ROOT + 'example.jinja2', {}, request=request)
