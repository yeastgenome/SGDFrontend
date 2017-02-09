# some logic (NOT all) has been moved to views to be more 'pyramid-y'
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound, HTTPInternalServerError
from src.sgd.frontend import config
from src.sgd.frontend.yeastgenome.views.cms_helpers import get_meetings_html, wp_categories
from dateutil import parser
import urllib
import datetime
import json
import requests

BLOG_BASE_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/sgdblogtest.wordpress.com/posts'
SEARCH_URL = config.backend_url + '/get_search_results'
TEMPLATE_ROOT = 'src:sgd/frontend/yeastgenome/static/templates/'

@view_config(route_name='redirect_no_overview')
@view_config(route_name='redirect_no_overview_long')
def redirect_no_overview(request):
    new_url = request.path.replace('/overview', '')
    return HTTPFound(new_url)

@view_config(context=HTTPNotFound)
def not_found(self, request):
    request.response.status = 404
    return render_to_response(TEMPLATE_ROOT + 'lost.jinja2', {}, request=request)

@view_config(context=HTTPInternalServerError)
def error(self, request):
    request.response.status = 500
    return render_to_response(TEMPLATE_ROOT + 'error.jinja2', {}, request=request)

@view_config(route_name='blast_fungal')
def blast_fungal(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_fungal.jinja2', {}, request=request)

@view_config(route_name='blog_category')
@view_config(route_name='blog_index')
def blog_list(self, request):
    try:
        url_suffix = '?category=' + request.matchdict['category']
    except Exception, e:
        url_suffix = ''
    wp_url = BLOG_BASE_URL + url_suffix
    response = requests.get(wp_url)
    posts = json.loads(response.text)['posts']
    for post in posts:
        post = add_simple_date_to_post(post)
    return render_to_response(TEMPLATE_ROOT + 'blog_list.jinja2', { 'posts': posts, 'categories': wp_categories }, request=request)

@view_config(route_name='blog_post')
def blog_post(self, request):
    slug = request.matchdict['slug']
    wp_url = BLOG_BASE_URL + '/slug:' + slug
    response = requests.get(wp_url)
    if response.status_code == 404:
        return not_found(self, request)
    post = add_simple_date_to_post(json.loads(response.text))
    return render_to_response(TEMPLATE_ROOT + 'blog_post.jinja2', { 'post': post, 'categories': wp_categories }, request=request)    

@view_config(route_name='blast_sgd')
def blast_sgd(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_sgd.jinja2', {}, request=request)

@view_config(route_name='interaction_search')
def interaction_search(request):
    return render_to_response(TEMPLATE_ROOT + 'interaction_search.jinja2', {}, request=request)

@view_config(route_name='download_list') 
def download_list(request):
    date = datetime.datetime.now().strftime("%m/%d/%Y")
    query = request.params.get('query')
    url = request.params.get('url')
    description = '!Search results for "' + query + '"\n!Date: ' + date + '\n' + "!From: Saccharomyces Genome Database (SGD) \n!URL: http://yeastgenome.org" + url +  "\n!Contact Email: sgd-helpdesk@lists.stanford.edu \n!Funding: NHGRI at US NIH, grant number 5-U41-HG001315 \n!"
    response_text = description + '\n\n'
    loci_list = json.loads(request.params.get('bioent_ids'))
    for locus_name in loci_list:
        response_text += (locus_name + '\n')
    return Response(body=response_text, content_type='text/plain', charset='utf-8', content_disposition='attachment; filename=search_results.txt')

@view_config(route_name='references_this_week') 
def references_this_week(request):
    page = {}
    return render_to_response(TEMPLATE_ROOT + 'references_this_week.jinja2', page, request=request)

@view_config(route_name='reference') 
def reference(request):
    ref_id = request.matchdict['identifier']
    ref_obj = get_obj(ref_id, 'reference')
    return render_to_response(TEMPLATE_ROOT + 'reference.jinja2', ref_obj, request=request)

@view_config(route_name='phenotype') 
def phenotype(request):
    ref_id = request.matchdict['identifier']
    ref_obj = get_obj(ref_id, 'phenotype')
    return render_to_response(TEMPLATE_ROOT + 'phenotype.jinja2', ref_obj, request=request)


# If is_quick, try to redirect to gene page.  If not, or no suitable response, then just show results in script tag and let client js do the rest.
@view_config(route_name='search') 
def search(request):
    # get limit, default to 25
    limit = '25' if request.params.get('page_size') is None else request.params.get('page_size')
    # get search results
    search_url = SEARCH_URL + '?' + request.query_string + '&limit=' + limit
    json_results = requests.get(search_url).text
    # if param is_quick = true, try to do some redirecting
    if request.params.get('is_quick') == 'true':
        query = request.params.get('q', '').lower()
        parsed_results = json.loads(json_results)['results']
        # if query ends in "p", try to search for protein page by executing a second search without the "p"
        if query.endswith('p'):
            temp_query = query[:-1]
            temp_query_url = SEARCH_URL + '?q=' + temp_query
            temp_json_results = requests.get(temp_query_url).text
            temp_parsed_results = json.loads(temp_json_results)['results']
            redirect_url = get_redirect_url_from_results(temp_parsed_results)
            if redirect_url:
                protein_url = redirect_url.replace('overview', 'protein')
                return HTTPFound(protein_url)
        # no protein search or no protein page redirect applicable
        redirect_url  = get_redirect_url_from_results(parsed_results)
        if redirect_url:
           return HTTPFound(redirect_url) 
    # if wrapped, or page > 0, just make bootstrapped results None to avoid pagination logic in python and fetch on client
    page = 0 if request.params.get('page') is None else int(request.params.get('page'))
    if request.params.get('wrapResults') == 'true' or page > 0:
        json_results = 'false'    
    # otherwise, render results page and put results in script tag
    return render_to_response(TEMPLATE_ROOT + 'search.jinja2', { 'bootstrapped_search_results_json': json_results }, request=request)

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
    
@view_config(route_name='home') 
def home(request):
    meetings_html = get_meetings_html()
    # fetch recent blog posts
    wp_url = BLOG_BASE_URL + '?number=5'
    try:
        response = requests.get(wp_url)
        blog_posts = json.loads(response.text)['posts']
        for post in blog_posts:
            post = add_simple_date_to_post(post)
    except Exception, e:
        blog_posts = []
    return render_to_response(TEMPLATE_ROOT + 'homepage.jinja2', { 'meetings_html': meetings_html, 'blog_posts': blog_posts }, request=request)

# # example
# @view_config(route_name='example') 
# def example(request):
#     return render_to_response(TEMPLATE_ROOT + 'example.jinja2', {}, request=request)

def get_obj(identifier, obj_type):
    backend_url = config.backend_url + '/' + obj_type + '/' + identifier
    backend_response = requests.get(backend_url)
    if backend_response.status_code != 200:
        return None
    obj = json.loads(backend_response.text)
    return {
        obj_type: obj,
        obj_type + '_js': json.dumps(obj)
    }


# helper method that goes through responses, and returns a redirect URL if is_quick is true for just 1, otherwise returns false
def get_redirect_url_from_results(results):
    quick_results = [x for x in results if x.get('is_quick')]
    if len(quick_results) == 1:
        return quick_results[0]['href']
    return False

def add_simple_date_to_post(raw):
    simple_date = parser.parse(raw['date']).strftime("%B %d, %Y")
    raw['simple_date'] = simple_date
    return raw
