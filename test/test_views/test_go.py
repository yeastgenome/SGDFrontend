from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import go_side_effect
from src.views import go, go_locus_details, go_locus_details_all, go_ontology_graph


class GoTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_go(self, mock_search):
        mock_search.side_effect = go_side_effect

        go_obj = factory.GoFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = "GO:0000256"
        response = go(request)

        self.assertEqual(response, go_obj.to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_go_ontology_graph(self, mock_search):
        mock_search.side_effect = go_side_effect

        go_obj = factory.GoFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "285800"
        response = go_ontology_graph(request)

        self.assertEqual(response, go_obj.ontology_graph())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_go_locus_details(self, mock_search):
        mock_search.side_effect = go_side_effect

        go_obj = factory.GoFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "285800"
        response = go_locus_details(request)

        self.assertEqual(response, go_obj.annotations_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_go_locus_details_all(self, mock_search):
        mock_search.side_effect = go_side_effect

        go_obj = factory.GoFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "285800"
        response = go_locus_details_all(request)

        self.assertEqual(response, go_obj.annotations_and_children_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_go(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = 'nonexistent_id'
        response = go(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_go_ontology_graph(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = '285800'
        response = go_ontology_graph(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_go_locus_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = '285800'
        response = go_locus_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_go_locus_details_all(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = '285800'
        response = go_locus_details_all(request)
        self.assertEqual(response.status_code, 404)

