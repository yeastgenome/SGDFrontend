from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import disease_side_effect
from src.views import disease, disease_locus_details, disease_locus_details_all, disease_ontology_graph


class DiseaseTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value="DOID:574")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_disease(self, mock_search, mock_redis):
        mock_search.side_effect = disease_side_effect
        dis = factory.DiseaseFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease(request)
        self.assertEqual(response, dis.to_dict())

    @mock.patch('src.views.extract_id_request', return_value="DOID:574")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_disease_locus_details(self, mock_search, mock_redis):
        mock_search.side_effect = disease_side_effect
        dis = factory.DiseaseFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease_locus_details(request)
        self.assertEqual(response, dis.annotations_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="DOID:574")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_disease_locus_details_all(self, mock_search, mock_redis):
        mock_search.side_effect = disease_side_effect
        dis = factory.DiseaseFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease_locus_details_all(request)
        self.assertEqual(response, dis.annotations_and_children_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="DOID:574")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_disease_ontology_graph(self, mock_search, mock_redis):
        mock_search.side_effect = disease_side_effect
        dis = factory.DiseaseFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease_ontology_graph(request)
        self.assertEqual(response, dis.ontology_graph())
      
    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_disease(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_disease_locus_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease_locus_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_disease_locus_details_all(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease_locus_details_all(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_disease_ontology_graph(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "DOID:574"
        response = disease_ontology_graph(request)
        self.assertEqual(response.status_code, 404)
