from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import complex_side_effect
from src.views import complex

class ComplexTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value="CPX-863")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_complex(self, mock_search, mock_redis):
        mock_search.side_effect = complex_side_effect
        cx = factory.ComplexdbentityFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "CPX-863" 
        response = complex(request)
        self.assertEqual(response, cx.protein_complex_details())

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_complex(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'  
        response = complex(request)
        self.assertEqual(response.get('complex_name'), None)


