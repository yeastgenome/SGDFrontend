import json
import re
import requests
from datetime import datetime
import os
from dateutil import parser
from src.sgd.frontend import config

BLOG_BASE_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/sgdblogtest.wordpress.com/posts'
BLOG_PAGE_SIZE = 10
HOMEPAGE_REQUEST_TIMEOUT = 2
URL_REGEX = 'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'

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
    now = datetime.now()
    this_year = now.year
    archive_years = []
    for i in range(5):
        archive_years.append(this_year - i)
    return archive_years

def get_recent_blog_posts():
    wp_url = BLOG_BASE_URL + '?number=5'
    try:
        response = requests.get(wp_url, timeout=HOMEPAGE_REQUEST_TIMEOUT)
        blog_posts = json.loads(response.text)['posts']
        for post in blog_posts:
            post = add_simple_date_to_post(post)
    except Exception, e:
        blog_posts = []
    return blog_posts

# fetch "SGD Public Events" google calendar data and format as needed for homepage
def get_meetings():
    try:
        calendar_url = config.google_calendar_api_url
        response = requests.get(calendar_url, timeout=HOMEPAGE_REQUEST_TIMEOUT)
        meetings = json.loads(response.text)['items']
        # only get "add day" events
        meetings = [d for d in meetings if 'date' in d['start'].keys()]
        for meeting in meetings:
            # get URL from description and remove URLs from description
            urls = re.findall(URL_REGEX, meeting['description'])
            if len(urls) > 0:
                url = urls[0]
            else:
                url = None
            meeting['url'] = url
            meeting['description'] = re.sub(URL_REGEX, '', meeting['description'])
            # format date as a string which is either a single day or range of dates
            start_date = datetime.strptime(meeting['start']['date'], '%Y-%m-%d')
            end_date = datetime.strptime(meeting['end']['date'], '%Y-%m-%d')
            meeting['start_date'] = start_date
            days_delta = (end_date - start_date).days
            if (days_delta > 1):
                start_desc = start_date.strftime('%B %d')
                end_desc = end_date.strftime('%B %d, %Y')
                date_description = start_desc + ' to ' + end_desc
            else:
                date_description = start_date.strftime('%B %d, %Y')
            meeting['date_description'] = date_description
        # filter to only show future events
        now = datetime.now()
        meetings = [d for d in meetings if d['start_date'] > now]
        # sort by start date
        meetings = sorted(meetings, key=lambda d: d['start_date'])
    except Exception, e:
        meetings = []
    return meetings

def add_simple_date_to_post(raw):
    simple_date = parser.parse(raw['date']).strftime("%B %d, %Y")
    raw['simple_date'] = simple_date
    return raw
