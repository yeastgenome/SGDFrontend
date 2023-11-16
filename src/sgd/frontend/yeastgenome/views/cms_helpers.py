import json
import re
import requests
from datetime import datetime, timedelta
import os
from dateutil import parser
# from src.sgd.frontend import config

BLOG_BASE_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/yeastgenomeblog.wordpress.com/posts'

DISCOURSE_BASE_URL = 'https://community.alliancegenome.org/'

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
    },
    {
        'name': 'Announcements',
        'slug': 'announcements'
    }
]


def get_wp_categories():
    return sorted(wp_categories, key=lambda k: k['name'])


def get_archive_years():
    now = datetime.now()
    this_year = now.year
    archive_years = []
    for i in range(7):
        archive_years.append(this_year - i)
    return archive_years


def get_recent_blog_posts():
    wp_url = BLOG_BASE_URL + '?number=5'
    try:
        response = requests.get(wp_url, timeout=HOMEPAGE_REQUEST_TIMEOUT)
        blog_posts = json.loads(response.text)['posts']
        for post in blog_posts:
            post = add_simple_date_to_post(post)
    except Exception as e:
        blog_posts = []
    return blog_posts


def get_recent_posts_from_discourse():
    try:
        # response = requests.get(DISCOURSE_BASE_URL + "latest.json",
        response = requests.get(DISCOURSE_BASE_URL + "c/model-organism-yeast/8/l/latest.json",
                                timeout=HOMEPAGE_REQUEST_TIMEOUT)
        json_data = json.loads(response.text)
        sgd_posts = []
        post_count = 0

        """
        num2mon = {"01": "January", "02": "February", "03": "March", "04": "April",
                   "05": "May", "06": "June", "07": "July", "08": "August",
                   "09": "September", "10": "October", "11": "November", "12": "December"
         }
        """

        id_to_category = { 237: "Announcements",
                           241: "Conferences",
                           238: "News and Views",
                           239: "Newsletter",
                           240: "Tutorial",
                           242: "Strain collections"
        }
        
        for post in json_data['topic_list']['topics']:
            post_count += 1
            if post_count > 20:
                break
            link_url = DISCOURSE_BASE_URL + 't/' + post['slug'] + '/' + str(post['id'])

            """
            res = requests.get(link_url)
            content = res.text
            content = content.split('meta name="twitter:description"')[1]
            content = content.split('..." />')[0]
            content = content.replace('content="', "")
            words = content.split(' ')
            if len(words) > 55:
                content = ' '.join(words[0:56]) + ' '
            short_content = None
            if not content.endswith(' '):
                words = content.split(' ')
                words[-1] = '[...]'
                short_content = ' '.join(words)
            else:
                short_content = content + "[...]"
            short_content = short_content.strip()
            date = post['last_posted_at'].split('T')[0].split('-')
            last_posted_at = num2mon[date[1]] + " " + date[2] + ", " + date[0]
            """
            category = ''
            if post['category_id'] in id_to_category:
                category = id_to_category[post['category_id']]
            
            sgd_posts.append({ "title": post['title'],
                               "link_url": link_url,
                               "category": category })
    except Exception as e:
        sgd_posts = []
    return sgd_posts


# fetch "SGD Public Events" google calendar data and format as needed for homepage
def get_meetings():
    try:
        calendar_url = os.environ['GOOGLE_CALENDAR_API_URL']
        response = requests.get(calendar_url, timeout=HOMEPAGE_REQUEST_TIMEOUT)
        meetings = json.loads(response.text)['items']
        # only get "all day" events
        meetings = [d for d in meetings if 'date' in list(d['start'].keys())]
        for meeting in meetings:
            if 'description' not in list(meeting.keys()):
                meeting['description'] = ''
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
            end_date = datetime.strptime(meeting['end']['date'], '%Y-%m-%d') - timedelta(days=1)
            meeting['start_date'] = start_date
            days_delta = (end_date - start_date).days
            if (days_delta >= 1):
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
    except Exception as e:
        meetings = []
    return meetings


def add_simple_date_to_post(raw):
    simple_date = parser.parse(raw['date']).strftime("%B %d, %Y")
    raw['simple_date'] = simple_date
    return raw
