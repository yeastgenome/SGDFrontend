from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import observable_side_effect
from src.views import observable, observable_locus_details, observable_locus_details_all, observable_ontology_graph


class ObservableTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_observable(self, mock_search):
        mock_search.side_effect = observable_side_effect

        obs = factory.ApoFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = "APO:0000007"

        response = observable(request)
        self.assertEqual(response, obs.to_dict())

    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_valid_observable_locus_details(self, mock_search):
    #     mock_search.side_effect = observable_side_effect
    #
    #     obs = factory.ApoFactory()
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['id'] = "169841"
    #
    #     response = observable_locus_details(request)
    #     self.assertEqual(response, obs.to_dict())
    #
    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_valid_observable_locus_details_all(self, mock_search):
    #     mock_search.side_effect = observable_side_effect
    #
    #     obs = factory.ApoFactory()
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['id'] = "169841"
    #
    #     response = observable_locus_details_all(request)
    #     self.assertEqual(response, obs.to_dict())
    #
    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_valid_observable_ontology_graph(self, mock_search):
    #     mock_search.side_effect = observable_side_effect
    #
    #     obs = factory.ApoFactory()
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['id'] = "169841"
    #
    #     response = observable_ontology_graph(request)
    #     self.assertEqual(response, obs.to_dict())
