# some logic (NOT all) has been moved to views to be more 'pyramid-y'
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound
from src.sgd.frontend import config
import urllib
import datetime
import json
import requests

SEARCH_URL = config.backend_url + '/get_search_results'
TEMPLATE_ROOT = 'src:sgd/frontend/yeastgenome/static/templates/'

@view_config(route_name='blast_fungal')
def blast_fungal(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_fungal.jinja2', {}, request=request)

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

# helper method that goes through responses, and returns a redirect URL if is_quick is true for just 1, otherwise returns false
def get_redirect_url_from_results(results):
    quick_results = [x for x in results if x.get('is_quick')]
    if len(quick_results) == 1:
        return quick_results[0]['href']
    return False

# If is_quick, try to redirect to gene page.  If not, or no suitable response, then just show results in script tag and let client js do the rest.
@view_config(route_name='search') 
def search(request):
    # get limit, default to 25
    limit = '25' if request.params.get('page_size') is None else request.params.get('page_size')
    # get search results
    search_url = SEARCH_URL + '?' + request.query_string + '&limit=' + limit
    print search_url
    json_results = requests.get(search_url).text
    # if param is_quick = true, try to do some redirecting
    if request.params.get('is_quick') == 'true':
        query = request.params.get('q').lower()
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
    # TEMP redirect to production
    return HTTPFound('http://yeastgenome.org/suggestion')

    return render_to_response(TEMPLATE_ROOT + 'suggestion.jinja2', {}, request=request)

@view_config(route_name='variant_viewer')
def variant_viewer(request):
    return render_to_response(TEMPLATE_ROOT + 'variant_viewer.jinja2', {}, request=request)
    
# hardcode meetings and blog posts to allow this app to render (instead of heritage)
# if config.heritage_url defined, use that
@view_config(route_name='home') 
def home(request):
    # if config.heritage_url:
    #     page = urllib.urlopen(config.heritage_url).read()
    #     return Response(page)
    
    meetings = [
        {
            'name': 'ICY 2016: 14th International Congress on Yeasts',
            'url': 'http://icy2016.com/',
            'date': 'September 11, 2016',
            'location': 'Awaji Yumebutai International Conference Center, Hyogo, Japa',
            'deadline_description': ''
        },
        {
            'name': '12th International Meeting on Yeast Apoptosis (IMYA12)',
            'url': 'http://fems-microbiology.org/opportunities/12th-international-meeting-yeast-apoptosis-imya12/',
            'date': 'May 14, 2017 ',
            'location': 'Bari, Italy',
            'deadline_description': ''
        },
        {
            'name': '13th Yeast Lipid Conference',
            'url': 'http://yeastlipidconference.inra.fr/',
            'date': 'May 17, 2017',
            'location': 'Paris, France'
        }
    ]
    blog_posts = [
        {
            'title': "Friends with Benefits ",
            'url': 'http://www.yeastgenome.org/friends-with-benefits',
            'date': '08/10/2016',
            'excerpt': "A 2013 poll identified the top 20 modern necessities British people couldn't live without. Some we can all relate to like smartphones, daily showers, and the internet, while others are more British-specific like a cup of tea or a full English breakfast. Of course none of these are true necessities like food, water or air. We wouldn't be as happy, nor as competitive, without some of these modern necessities, but we'd obviously still be alive. (But..."
        },
        {
            'title': "New SGD Help Video: Exploring Expression Datasets with SPELL",
            'url': 'http://www.yeastgenome.org/new-sgd-help-video-exploring-expression-datasets-with-spell',
            'date': '08/09/2016',
            'excerpt': "Trying to find relevant expression datasets or genes with similar expression profiles for your favorite genes? Look no further than SPELL the Serial Pattern of Expression Levels Locator. Given a set of genes, SGDs instance of SPELL locates informative expression datasets from over 270 published studies and pairs the genes in your query with additional coexpressed genes."
        },
        {
            'title': 'Sign Up Now for the Next SGD Webinar: August 3, 2016',
            'url': 'http://www.yeastgenome.org/sign-up-now-for-the-next-sgd-webinar-august-3-2016',
            'date': '07/28/2016',
            'excerpt': "SGD's Variant Viewer is an easy-to-learn web application that allows visualization of differences in both gene and protein sequences. With Variant Viewer, you can compare the nucleotide and amino acid sequences of your favorite genes in twelve widely-used S. cerevisiae strains. Our upcoming webinar on August 3rd, 9:30 AM PDT will provide a quick 10 minute tutorial on how to use Variant Viewer. We will demonstrate how to compare nucleotide and amino acid sequences of..."
        },
        {
            'title': "Alliance of Genome Resources - Survey",
            'url': 'http://www.yeastgenome.org/alliance-of-genome-resources-survey',
            'date': '07/21/2016',
            'excerpt': "Please help the Alliance by completing the short survey at Six of the founding members of the Alliance of Genome Resources Saccharomyces Genome Database, WormBase, FlyBase, ZFIN, MGI, and the Gene Ontology Consortium attended the GSAs The Allied Genetics Conference in Orlando from July 13 to 17. It was a great opportunity for staff of each of these individual resources to talk about their new collaboration to integrate their content and software into a single resource..."
        }
    ]
    return render_to_response(TEMPLATE_ROOT + 'temp_homepage.jinja2', { 'meetings': meetings, 'blog_posts': blog_posts }, request=request)

# example
# @view_config(route_name='example') 
# def example(request):
#     return render_to_response(TEMPLATE_ROOT + 'example.jinja2', {}, request=request)
