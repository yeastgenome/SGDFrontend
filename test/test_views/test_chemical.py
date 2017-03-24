from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import chemical_side_effect
from src.views import chemical, chemical_phenotype_details


class ChemicalTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical(self, mock_search):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = "CHEBI:16240"

        response = chemical(request)
        self.assertEqual(response, chem.to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_chemical_phenotype_details(self, mock_search):
        mock_search.side_effect = chemical_side_effect

        chem = factory.ChebiFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "184870"

        response = chemical_phenotype_details(request)
        self.assertEqual(response, chem.phenotype_to_dict())


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = 'nonexistent_id'
        response = chemical(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_chemical_phenotype_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = chemical_phenotype_details(request)
        self.assertEqual(response.status_code, 404)

