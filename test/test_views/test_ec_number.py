from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import side_effect
from src.views import ecnumber, ecnumber_locus_details, locus_ecnumber_details


class EcTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value="S000203483")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_ec_number(self, mock_search, mock_redis):
        mock_search.side_effect = side_effect

        ec = factory.EcFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = "S000203483"
        id = mock_redis.extract_id_request(request, 'ecnumber', param_name='id')

        response = ecnumber(request)

        self.assertEqual(response, ec.to_dict())

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_ec_number(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = 'nonexistent_id'
        id = mock_redis.extract_id_request(request, 'ecnumber', param_name='id')

        response = ecnumber(request)
        self.assertEqual(response.status_code, 404)