from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import strain


class StraindbentityTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_strain_name(self, mock_search):
        s_name = factory.StraindbentityFactory()
        mock_search.return_value = MockQuery(s_name)
        
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = s_name.display_name
        response = strain(request)
        
        self.assertEqual(response, s_name.to_dict())
