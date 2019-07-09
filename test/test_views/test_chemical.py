from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import chemical_side_effect
from src.views import chemical, chemical_phenotype_details, chemical_go_details, \
                      chemical_complex_details, chemical_network_graph

class ChemicalTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value="CHEBI:16240")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical(self, mock_search, mock_redis):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['format_name'] = "CHEBI:16240"
        format_name = mock_redis.extract_id_request(request, 'chemical', param_name='format_name')

        response = chemical(request)
        self.assertEqual(response, chem.to_dict())

    @mock.patch('src.views.extract_id_request', return_value="184870")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical_phenotype_details(self, mock_search, mock_redis):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = "184870"
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')

        response = chemical_phenotype_details(request)
        self.assertEqual(response, chem.phenotype_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="485823")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical_go_details(self, mock_search, mock_redis):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')

        response = chemical_go_details(request)
        self.assertEqual(response, chem.go_to_dict())
        
    @mock.patch('src.views.extract_id_request', return_value="171437")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical_complex_details(self, mock_search, mock_redis):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')

        response = chemical_complex_details(request)
        self.assertEqual(response, chem.complex_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="184870")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical_network_graph(self, mock_search, mock_redis):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')

        response = chemical_network_graph(request)
        self.assertEqual(response, chem.chemical_network())

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['format_name'] = 'nonexistent_id'
        id = mock_redis.extract_id_request(request, 'chemical', param_name='format_name')
        response = chemical(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical_phenotype_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = 'nonexistent_id'
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')
        response = chemical_phenotype_details(request)
        self.assertEqual(response.status_code, 404)
        
    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical_go_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')
        response = chemical_go_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical_complex_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')
        response = chemical_complex_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical_network_graph(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'chemical', param_name='id')
        response = chemical_network_graph(request)
        self.assertEqual(response.status_code, 404)

