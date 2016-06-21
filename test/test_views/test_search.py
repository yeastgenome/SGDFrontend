from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import search

class SearchTest(unittest.TestCase):    
    def setUp(self):
        testing.setUp()
    
    def tearDown(self):
        testing.tearDown()
    
    @mock.patch('src.models.ESearch.search')
    def test_should_return_all_results_for_no_query_param_on_search(self, mock_es):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search(request)

        mock_es.assert_called_with(body={
            'query': {'match_all': {}},
            'aggs': {
                'feature_type': {
                    'terms': {
                        'field': 'feature_type'
                    }
                },
                'categories': {
                    'terms': {
                        'field': 'category'
                    }
                }
            }, 'size': 0}, index='searchable_items')
