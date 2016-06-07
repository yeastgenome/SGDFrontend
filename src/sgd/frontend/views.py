# some logic (NOT all) has been moved to views to be more 'pyramid-y'
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound
from src.sgd.frontend import config
import datetime
import json
import requests

TEMPLATE_ROOT = 'src:sgd/frontend/yeastgenome/static/templates/'

@view_config(route_name='blast_fungal') 
def blast_fungal(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_fungal.jinja2', {}, request=request)

@view_config(route_name='blast_sgd') 
def blast_sgd(request):
    return render_to_response(TEMPLATE_ROOT + 'blast_sgd.jinja2', {}, request=request)

@view_config(route_name='download_list') 
def download_list(request):
    date = datetime.datetime.now().strftime("%m/%d/%Y")
    query = request.params.get('query')
    url = request.params.get('url')
    print query, url
    description = '!Search results for "' + query + '"\n!Date: ' + date + '\n' + "!From: Saccharomyces Genome Database (SGD) \n!URL: http://yeastgenome.org" + url +  "\n!Contact Email: sgd-helpdesk@lists.stanford.edu \n!Funding: NHGRI at US NIH, grant number 5-P41-HG001315 \n!"
    response_text = description + '\n\n'
    loci_list = json.loads(request.params.get('bioent_ids'))
    for locus_name in loci_list:
        response_text += (locus_name + '\n')
    return Response(body=response_text, content_type='text/plain', charset='utf-8', content_disposition='attachment; filename=search_results.txt')

# If is_quick, try to redirect to gene page.  If not, or no suitable response, then just show results in script tag and let client js do the rest.
@view_config(route_name='search') 
def search(request):
    # get limit, default to 25
    limit = '25' if request.params.get('page_size') is None else request.params.get('page_size')
    # get search results
    search_url = config.backend_url + '/get_search_results' + '?' + request.query_string + '&limit=' + limit
    json_bootstrapped_search_results = requests.get(search_url).text
    # if param is_quick = true and the first result has is_quick: true then direct to that URL
    parsed_results = json.loads(json_bootstrapped_search_results)['results']
    if (request.params.get('is_quick') == 'true' and len(parsed_results) > 0):
        first_result = parsed_results[0]
        if (first_result.get('is_quick')):
            return HTTPFound(first_result['href'])
    # if wrapped, or page > 0, just make bootstrapped results None to avoid pagination logic in python and fetch on client
    page = 0 if request.params.get('page') is None else int(request.params.get('page'))
    if request.params.get('wrapResults') == 'true' or page > 0:
        json_bootstrapped_search_results = 'false'    
    # otherwise, render results page and put results in script tag
    return render_to_response(TEMPLATE_ROOT + 'search.jinja2', { 'bootstrapped_search_results_json': json_bootstrapped_search_results }, request=request)

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
    
# TEMP, render homepage here for prototype
# hardcode meetings and blog posts
@view_config(route_name='home') 
def home(request):
    meetings = [
        {
            'name': 'Gene transcription in yeast: From chromatin to RNA and back',
            'url': 'http://events.embo.org/16-transcription-yeast/',
            'date': 'June 11, 2016',
            'location': 'Sant Feliu de Guixols, Spain',
            'deadline_description': 'Abstract deadline: March 14, 2016'
        },
        {
            'name': 'Northeast Regional Yeast Meeting (NERY)',
            'url': 'http://pjcullen.wix.com/nery',
            'date': 'June 16, 2016',
            'location': 'Buffalo, NY',
            'deadline_description': 'Abstract and Registration Deadline: May 15, 2016'
        },
        {
            'name': 'PYFF6 - 6th Conference on Physiology of Yeast and Filamentous Fungi',
            'url': 'http://groups.tecnico.ulisboa.pt/bsrg/pyff6/index.php',
            'date': 'July 11, 2016',
            'location': 'University of Lisbon, Lisbon, Portugal',
        },
        {
            'name': 'Yeast Genetics Meeting at TAGC 2016: The Allied Genetics Conference',
            'url': 'http://www.genetics2016.org/communities/yeast',
            'date': 'July 13, 2016',
            'location': 'Orlando, FL',
            'deadline_description': 'Abstract and early registration deadline: March 23, 2016'
        },
        {
            'name': 'Yeast Genetics & Genomics Course',
            'url': 'http://meetings.cshl.edu/courses.aspx?course=c-yeas&year=16',
            'date': 'July 26, 2016',
            'location': 'Cold Spring Harbor Laboratory, Cold Spring Harbor, NY',
            'deadline_description': 'Application Deadline: April 15, 2016'
        }
    ]
    blog_posts = [
        {
            'title': "Can't Get There Like That",
            'url': 'http://www.yeastgenome.org/cant-get-there-like-that',
            'date': '05/04/2016',
            'excerpt': "As HBO's Silicon Valley scathingly relates, the mapping app from Apple was truly terrible when it was first launched. There are all kinds of funny (scary?) stories in which people following the directions ended up in the wrong place. (Click here for a few more of the epic fails.) And sometimes it would show impossible ways to get from one location to the other. For example, to get to a certain place, my iPhone would recommend..."
        },
        {
            'title': "Sign Up Now for the Next SGD Webinar: May 4th, 2016",
            'url': 'http://www.yeastgenome.org/sign-up-now-for-the-next-sgd-webinar-may-4th-2016',
            'date': '04/26/2016',
            'excerpt': "If you're not already using YeastMine to answer all your questions about S. cerevisiae genes and gene products...you should be! SGD's YeastMine is a powerful search tool that can retrieve, compare, and analyze data on thousands of genes at a time, greatly reducing the time needed to answer real, practical research questions. Through YeastMine, questions such as..."
        },
        {
            'title': 'Chocolate and Coffee Too?',
            'url': 'http://www.yeastgenome.org/chocolate-and-coffee-too',
            'date': '04/20/2016',
            'excerpt': "Most of us know about yeast's big part in making bread and booze. But those aren't yeast's only wonderful gifts. It also plays a big role in chocolate and coffee too. Is there anything this marvelous microorganism can't do? A new study by Ludlow and coworkers in Current Biology set out to look at the strains involved in cacao and coffee fermentation."
        },
        {
            'title': "Lessons from Yeast: Poisoning Cancer ",
            'url': 'http://www.yeastgenome.org/lessons-from-yeast-poisoning-cancer',
            'date': '04/06/2016',
            'excerpt': "In the book Dune, the mentat Thufir Hawat is captured by the evil Harkonnens and given a residual poison. He can only stay alive by getting a constant dose of the antidote. Once it is withdrawn, he will die. A new study in the journal GENETICS by Dodgson and coworkers shows that the same sort of thing can happen to yeast that carry an extra chromosome. In this case, certain genes on the extra chromosome turn..."
        }
    ]
    return render_to_response(TEMPLATE_ROOT + 'temp_homepage.jinja2', { 'meetings': meetings, 'blog_posts': blog_posts }, request=request)

# example
# @view_config(route_name='example') 
# def example(request):
#     return render_to_response(TEMPLATE_ROOT + 'example.jinja2', {}, request=request)
