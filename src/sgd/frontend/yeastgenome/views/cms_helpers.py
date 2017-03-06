import json
import re
import requests
import datetime

MEETINGS_WIKI_URL = 'http://wiki.yeastgenome.org/api.php/?action=parse&page=Meetings&format=json'
# from https://public-api.wordpress.com/rest/v1.1/sites/sgdblogtest.wordpress.com/categories
wp_categories = [
    {
        'name': 'Conferences',
        'slug': 'conferences'
    },
    {
        'name': 'Data updates',
        'slug': 'data-updates'
    },
    {
        'name': 'Homologs',
        'slug': 'homologs'
    },
    {
        'name': 'New Data',
        'slug': 'new-data'
    },
    {
        'name': 'News and Views',
        'slug': 'news-and-views'
    },
    {
        'name': 'Newsletter',
        'slug': 'newsletter'
    },
    {
        'name': 'Research Spotlight',
        'slug': 'research-spotlight'
    },
    {
        'name': 'Sequence',
        'slug': 'sequence'
    },
    {
        'name': 'Tutorial',
        'slug': 'tutorial'
    },
    {
        'name': 'Uncategorized',
        'slug': 'uncategorized'
    },
    {
        'name': 'Website changes',
        'slug': 'website-changes'
    },
    {
        'name': 'Yeast and Human Disease',
        'slug': 'yeast-and-human-disease'
    }
]

def get_archive_years():
    now = datetime.datetime.now()
    this_year = now.year
    archive_years = []
    for i in range(5):
        archive_years.append(this_year - i)
    return archive_years

def get_meetings_html():
    try:
        response = requests.get(MEETINGS_WIKI_URL, timeout=2)
        text = json.loads(response.text)['parse']['text']['*']
        text = text.encode('utf8')
        start_expr = 'Upcoming Conferences &amp; Courses </span></h1>'
        end_expr = '<h1><span class="editsection">[<a href="/index.php?title=Meetings&amp;action=edit&amp;section=2" title="Edit section: Past Yeast Meetings"'
        start_i = text.find(start_expr) + len(start_expr)
        end_i = text.find(end_expr)
        # find text between two undesired blocks of text
        filtered_text = text[start_i:end_i]
        return unicode(filtered_text, 'utf-8')
    except Exception, e:
        return ''
