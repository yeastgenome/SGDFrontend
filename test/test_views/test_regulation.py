from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import locus_side_effect
from src.views import locus_regulation_details, locus_regulation_graph, locus_regulation_target_enrichment, locus_binding_site_details


class RegulationTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value = "S000203483")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_regulation_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_regulation_details(request)

        self.assertEqual(response, locus.regulation_details())


    @mock.patch('src.views.extract_id_request', return_value = "S000203483")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_regulation_target_enrichment(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_regulation_target_enrichment(request)

        self.assertEqual(response, locus.regulation_target_enrichment())

    @mock.patch('src.views.extract_id_request', return_value = "S000203483")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_binding_site_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_binding_site_details(request)

        self.assertEqual(response, locus.binding_site_details())


    @mock.patch('src.views.extract_id_request', return_value = "S000203483")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_regulation_graph(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_regulation_graph(request)

        self.assertEqual(response, locus.regulation_graph())


    @mock.patch('src.views.extract_id_request', return_value = "nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_regulation_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = 'nonexistent_id'
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_regulation_details(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.views.extract_id_request', return_value = "nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_regulation_target_enrichment(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_regulation_target_enrichment(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value = "nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_binding_site_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_binding_site_details(request)
        self.assertEqual(response.status_code, 404)



    @mock.patch('src.views.extract_id_request', return_value = "nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_regulation_graph(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'regulation', param_name='id')
        response = locus_regulation_graph(request)
        self.assertEqual(response.status_code, 404)