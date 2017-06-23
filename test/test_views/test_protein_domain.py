from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import locus_side_effect
from src.views import domain, domain_locus_details, domain_enrichment


class ProteindomainTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_domain(self, mock_search):
        mock_search.side_effect = locus_side_effect

        proteindomain = factory.ProteindomainFactory()
        source = factory.SourceFactory()
        proteindomain.source = source

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = "PTHR13389"
        response = domain(request)

        self.assertEqual(response, proteindomain.to_dict())


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_domain(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['format_name'] = 'nonexistent_id'
        response = domain(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_domain_locus_details(self, mock_search):
        mock_search.side_effect = locus_side_effect

        proteindomain = factory.ProteindomainFactory()
        source = factory.SourceFactory()
        proteindomain.source = source

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "PTHR13389"
        response = domain_locus_details(request)

        self.assertEqual(response, proteindomain.locus_details())


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_domain_locus_details(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = domain_locus_details(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_domain_enrichment(self, mock_search):
        mock_search.side_effect = locus_side_effect

        proteindomain = factory.ProteindomainFactory()
        source = factory.SourceFactory()
        proteindomain.source = source

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "PTHR13389"
        response = domain_enrichment(request)

        self.assertEqual(response, proteindomain.enrichment())


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_domain_enrichment(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = domain_enrichment(request)
        self.assertEqual(response.status_code, 404)

