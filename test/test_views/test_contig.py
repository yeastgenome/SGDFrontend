from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import sequence_side_effect
from src.views import contig, contig_sequence_details


class ContigTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value="Chromosome_V")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_contig(self, mock_search, mock_redis):
        mock_search.side_effect = sequence_side_effect

        ctg = factory.ContigFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['format_name'] = "Chromosome_V"
        id = mock_redis.extract_id_request(request, 'contig', param_name='id')
        response = contig(request)

        self.assertEqual(response, ctg.to_dict())


    @mock.patch('src.views.extract_id_request', return_value="1381933")
    @mock.patch('src.models.DBSession.execute')
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_contig_sequence_details(self, mock_search, mock_execute, mock_redis):
        mock_search.side_effect = sequence_side_effect

        ctg = factory.ContigFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = "1381933"
        id = mock_redis.extract_id_request(request, 'contig', param_name='id')
        response = contig_sequence_details(request)

        self.assertEqual(response, ctg.sequence_details())


    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_contig(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['format_name'] = 'nonexistent_id'
        format_name = mock_redis.extract_id_request(request, 'contig', param_name='format_name')
        response = contig(request)
        self.assertEqual(response.status_code, 404)


    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_contig_sequence_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        #request.matchdict['id'] = 'nonexistent_id'
        id = mock_redis.extract_id_request(request, 'contig', param_name='id')
        response = contig_sequence_details(request)
        self.assertEqual(response.status_code, 404)
