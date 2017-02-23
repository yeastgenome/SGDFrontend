from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import side_effect
from src.views import strain


class StraindbentityTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_strain_name(self, mock_search):
        mock_search.side_effect = side_effect

        strain_obj = factory.StraindbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000203483"
        response = strain(request)

        self.assertEqual(response, strain_obj.to_dict())


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_strain(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = strain(request)
        self.assertEqual(response.status_code, 404)

