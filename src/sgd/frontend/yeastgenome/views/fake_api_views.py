# TEMP to show how to get needed data for blog
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render_to_response
from pyramid.httpexceptions import HTTPFound, HTTPNotFound, HTTPInternalServerError
import json
import requests

EXAMPLE_POST_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/sgdblogtest.wordpress.com/posts/7838'
EXAMPLE_POSTS_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/sgdblogtest.wordpress.com/posts'

@view_config(route_name='blog_api', renderer='json')
def blog_api(request):
    post_response = json.loads(requests.get(EXAMPLE_POST_URL).text)
    simple_dict = {
        'title': post_response.get('title'),
        'content': post_response.get('content'),
        'date': post_response.get('date'),
        'tags': post_response.get('tags'),
        'slug': post_response.get('slug'),
        'recent_posts': [
            {
                'title': 'Hola Mundo',
                'url': '/blog/hola'
            }
        ],
        'categories': [
            {
                'name': 'Conferences',
                'url': '/blog/category/conferences'
            }
        ]
    }
    return simple_dict
