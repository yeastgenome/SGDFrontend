# some logic (NOT all) has been moved to views to be more 'pyramid-y'
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound, HTTPInternalServerError, HTTPMovedPermanently
from src.sgd.frontend import config
from src.sgd.frontend.yeastgenome.views.cms_helpers import BLOG_BASE_URL, BLOG_PAGE_SIZE, add_simple_date_to_post, get_wp_categories, get_archive_years, get_meetings, get_recent_blog_posts, wp_categories
import urllib.request, urllib.parse, urllib.error
import datetime
import json
import requests
import os

SEARCH_URL = config.backend_url + '/get_search_results'
TEMPLATE_ROOT = 'src:sgd/frontend/yeastgenome/static/templates/'
ENV = os.getenv('ENV', 'dev')

@view_config(route_name='healthcheck')
def healthcheck(request):
    return Response(body='sgd ok', content_type='text/plain', charset='utf-8')

@view_config(route_name='redirect_no_overview')
@view_config(route_name='redirect_no_overview_long')
def redirect_no_overview(request):
    new_url = request.path.replace('/overview', '')
    return HTTPMovedPermanently(get_https_url(new_url, request))

@view_config(context=HTTPNotFound)
def not_found(request):
    request.response.status = 404
    return render_to_response(TEMPLATE_ROOT + 'lost.jinja2', {}, request=request)

@view_config(context=HTTPInternalServerError)
#def error(self, request):
def error(request):
    request.response.status = 500
    return render_to_response(TEMPLATE_ROOT + 'error.jinja2', {}, request=request)

@view_config(route_name='blast_fungal')
def blast_fungal(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_fungal.jinja2', {}, request=request)

@view_config(route_name='blog_archive')
@view_config(route_name='blog_category')
@view_config(route_name='blog_tag')
@view_config(route_name='blog_index')
def blog_list(request):
    url_params = request.matchdict
    page = request.params.get('page')
    if page is None:
        page = 1
    else:
        page = int(page)
    next_url = request.path + '?page=' + str(page + 1)
    offset = str((page - 1) * BLOG_PAGE_SIZE)
    offset_expression = 'offset=' + offset + '&' + 'number=' + str(BLOG_PAGE_SIZE)
    if 'category' in url_params:
        url_suffix = '?category=' + url_params['category'] + '&' + offset_expression
    elif 'tag' in url_params:
        url_suffix = '?tag=' + url_params['tag'] + '&' + offset_expression
    elif 'year' in url_params:
        year = url_params['year']
        start_date = year + '-01-01'
        end_date = year + '-12-31'
        url_suffix = '?before=' + end_date + '&after=' + start_date + '&' + offset_expression
    else:
        url_suffix = '?' + offset_expression
    wp_url = BLOG_BASE_URL + url_suffix
    response = requests.get(wp_url)
    posts = json.loads(response.text)['posts']
    for post in posts:
        post = add_simple_date_to_post(post)
    return render_to_response(TEMPLATE_ROOT + 'blog_list.jinja2', { 'posts': posts, 'categories': get_wp_categories(), 'next_url': next_url, 'years': get_archive_years() }, request=request)

@view_config(route_name='blog_post')
#def blog_post(self, request):
def blog_post(request): 
    slug = request.matchdict['slug']
    wp_url = BLOG_BASE_URL + '/slug:' + slug
    response = requests.get(wp_url)
    if response.status_code == 404:
        return not_found(request)
    post = add_simple_date_to_post(json.loads(response.text))
    return render_to_response(TEMPLATE_ROOT + 'blog_post.jinja2', { 'post': post, 'categories': get_wp_categories(), 'years': get_archive_years() }, request=request)

@view_config(route_name='blast_sgd')
def blast_sgd(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_sgd.jinja2', {}, request=request)

@view_config(route_name='patmatch')
def patmatch(request):
    return render_to_response(TEMPLATE_ROOT + 'patmatch.jinja2', {}, request=request)

@view_config(route_name='restrictionmapper')
def restrictionmapper(request):
    return render_to_response(TEMPLATE_ROOT + 'restrictionMapper.jinja2', {}, request=request)


@view_config(route_name='seq_tools')
def seq_tools(request):
    return render_to_response(TEMPLATE_ROOT + 'seqTools.jinja2', {}, request=request)

@view_config(route_name='gotermfinder')
def gotermfinder(request):
    return render_to_response(TEMPLATE_ROOT + 'goTermFinder.jinja2', {}, request=request)

@view_config(route_name='goslimmapper')
def goslimmapper(request):
    return render_to_response(TEMPLATE_ROOT + 'goSlimMapper.jinja2', {}, request=request)

@view_config(route_name='strain_alignment')
def strain_alignment(request):
    return render_to_response(TEMPLATE_ROOT + 'strainAlignment.jinja2', {}, request=request)

@view_config(route_name='api_portal')
def api_portal(request):
    return render_to_response(
        TEMPLATE_ROOT + 'swagger.jinja2', {}, request=request)


@view_config(route_name='colleague_show')
def colleague_show(request):
    return render_to_response(TEMPLATE_ROOT + 'misc.jinja2', {}, request=request)


@view_config(route_name='downloads')
def downloads_tree(request):
    return render_to_response(
        TEMPLATE_ROOT + 'downloads.jinja2', {}, request=request)
'''
@view_config(route_name='new_colleague')
def new_colleague(request):
    return render_to_response(TEMPLATE_ROOT + 'new_colleague.jinja2', {}, request=request)
'''


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
    if ref_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'reference.jinja2', ref_obj, request=request)

@view_config(route_name='phenotype')
def phenotype(request):
    pheno_id = request.matchdict['identifier']
    pheno_obj = get_obj(pheno_id, 'phenotype')
    if pheno_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'phenotype.jinja2', pheno_obj, request=request)

@view_config(route_name='complex')
def complex(request):
    complexAC = request.matchdict['identifier']
    complex_obj = get_obj(complexAC, 'complex')
    if complex_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'complex.jinja2', complex_obj, request=request)

@view_config(route_name='complex_literature_details')
def complex_literature_details(request):
    complexAC = request.matchdict['identifier']
    complex_obj = get_obj(complexAC, 'complex')
    if complex_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'complex_literature.jinja2', complex_obj, request=request)

@view_config(route_name='complex_go_details')
def complex_go_details(request):
    complexAC = request.matchdict['identifier']
    complex_obj = get_obj(complexAC, 'complex')
    if complex_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'complex_go.jinja2', complex_obj, request=request)

@view_config(route_name='allele')
def allele(request):
    alleleName = request.matchdict['identifier']
    allele_obj = get_obj(alleleName, 'allele')
    if allele_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'allele.jinja2', allele_obj, request=request)

@view_config(route_name='allele_literature_details')
def allele_literature_details(request):
    alleleName = request.matchdict['identifier']
    allele_obj = get_obj(alleleName, 'allele')
    if allele_obj is None:
        return not_found(request)
    return render_to_response(TEMPLATE_ROOT + 'allele_literature.jinja2', allele_obj, request=request)

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
                protein_url = redirect_url = redirect_url + '/protein'
                return HTTPFound(get_https_url(protein_url, request))
        # no protein search or no protein page redirect applicable
        redirect_url  = get_redirect_url_from_results(parsed_results)
        if redirect_url:
            return HTTPFound(get_https_url(redirect_url, request))
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

@view_config(route_name='new_gene_name_reservation')
def new_gene_name_reservation(request):
    ci_base = config.curate_server

    return render_to_response(
        TEMPLATE_ROOT + 'iframe.jinja2', {
            'ci_url': 'new_reservation',
            'ci_base': ci_base,
            'title': 'New Gene Name Reservation'
        },
        request=request)


@view_config(route_name='new_colleague')
def new_colleague(request):
    ci_base = config.curate_server

    return render_to_response(
        TEMPLATE_ROOT + 'iframe.jinja2', {
            'ci_url': 'new_colleague',
            'ci_base': ci_base,
            't': 'Colleague'
            }, request=request)


@view_config(route_name='submit_data')
def submit_data(request):
    ci_base = config.curate_server

    return render_to_response(
        TEMPLATE_ROOT + 'iframe_small.jinja2', {
            'ci_url': 'submit_data',
            'ci_base': ci_base,
            'title': 'Submit Data to SGD'
            }, request=request)

@view_config(route_name='primer3')
def primer3(request):
    return render_to_response(TEMPLATE_ROOT + 'primer3.jinja2', {}, request=request)

@view_config(route_name='home')
def home(request):
    blog_posts = get_recent_blog_posts()
    meetings = get_meetings()
    return render_to_response(TEMPLATE_ROOT + 'homepage.jinja2', { 'meetings': meetings, 'blog_posts': blog_posts }, request=request)

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

# helper method that gogoes through responses, and returns a redirect URL if is_quick is true for just 1, otherwise returns false
def get_redirect_url_from_results(results):
    quick_results = [x for x in results if x.get('is_quick')]
    if len(quick_results) == 1:
        return quick_results[0]['href']
    return False

# needed to force https redirects on reverse proxy LB
def get_https_url(url, request):
    host = ''
    if ENV == 'dev':
        host = request.host_url.replace(':8080', '')
    else:
        host = request.host_url.replace('http', 'https').replace(':8080', '')
    return host + url


@view_config(route_name='api_doc')
def api_doc(request):

    return render_to_response(TEMPLATE_ROOT + 'sgd_redoc.jinja2', {}, request=request)
