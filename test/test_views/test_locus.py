from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import go_side_effect, phenotype_side_effect, locus_side_effect, reference_side_effect, locus_reference_side_effect, locus_expression_side_effect
from src.views import locus, locus_go_details, locus_phenotype_details, locus_phenotype_graph, locus_literature_details, locus_interaction_details, locus_expression_details


class LocusTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_valid_locus(self, mock_search):
    #     mock_search.side_effect = locus_side_effect
    #
    #     loc = factory.LocusdbentityFactory()
    #
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['sgdid'] = "S000114259"
    #     response = locus(request)
    #     self.assertEqual(response, loc.to_dict())
    # #
    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_non_existent_locus(self, mock_search):
    #     mock_search.return_value = MockQuery(None)
    #
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['id'] = 'nonexistent_id'
    #     response = locus(request)
    #     self.assertEqual(response.status_code, 404)


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_go_details(self, mock_search):
        mock_search.side_effect = go_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000114259"
        response = locus_go_details(request)
        self.assertEqual(response, locus.go_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_go_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = locus_go_details(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_interaction_details(self, mock_search):
        mock_search.side_effect = reference_side_effect

        locus = factory.LocusdbentityFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000114259"
        response = locus_interaction_details(request)
        self.assertEqual(response, locus.interactions_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_interaction_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = locus_interaction_details(request)
        self.assertEqual(response.status_code, 404)



    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_phenotype_details(self, mock_search):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory(format_name='format_1')
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000114259"
        response = locus_phenotype_details(request)
        self.assertEqual(response, locus.phenotype_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_phenotype_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = locus_phenotype_details(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_literature_details(self, mock_search):
        mock_search.side_effect = locus_reference_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000114259"
        response = locus_literature_details(request)
        self.assertEqual(response, locus.literature_to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_literature_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = locus_literature_details(request)
        self.assertEqual(response.status_code, 404)

    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_valid_locus_expression_details(self, mock_search):
    #     mock_search.side_effect = locus_expression_side_effect
    #
    #     locus = factory.LocusdbentityFactory()
    #
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['id'] = "S000114259"
    #     response = locus_expression_details(request)
    #     self.assertEqual(response, locus.expression_to_dict())


    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_non_existent_locus_expression_details(self, mock_search):
    #      mock_search.return_value = MockQuery(None)
    #
    #      request = testing.DummyRequest()
    #      request.context = testing.DummyResource()
    #      request.matchdict['id'] = 'nonexistent_id'
    #      response = locus_expression_details(request)
    #      self.assertEqual(response.status_code, 404)
