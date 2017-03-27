from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import phenotype_side_effect
from src.views import phenotype_locus_details, phenotype


class PhenotypeTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_phenotype(self, mock_search):
        mock_search.side_effect = phenotype_side_effect

        obs = factory.ApoFactory()
        pheno = factory.PhenotypeFactory()
        pheno.observable = obs
        pheno.qualifier = obs

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = "increased_innate_thermotolerance"
        response = phenotype(request)

        self.assertEqual(response, pheno.to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_phenotype_locus_details(self, mock_search):
        mock_search.side_effect = phenotype_side_effect

        pheno = factory.PhenotypeFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "1760982"
        response = phenotype_locus_details(request)

        self.assertEqual(response, pheno.annotations_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_phenotype(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = 'nonexistent_id'
        response = phenotype(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_phenotype_locus_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = phenotype_locus_details(request)
        self.assertEqual(response.status_code, 404)