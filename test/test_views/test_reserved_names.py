from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import reserved_name


class ReservedNameTest(unittest.TestCase):    
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_reserved_name(self, mock_search):
        r_name = factory.ReservedNameFactory()
        mock_search.return_value = MockQuery(r_name)
        
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = r_name.format_name
        response = reserved_name(request)
        
        self.assertEqual(response, r_name.to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_reserved_name(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = reserved_name(request)
        self.assertEqual(response.status_code, 404)