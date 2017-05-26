from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import dataset_side_effect, keywords_side_effect
from src.views import dataset, keyword, keywords


class DatasetTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.maxDiff = None

    def tearDown(self):
        testing.tearDown()


    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_dataset(self, mock_search):
            mock_search.side_effect = dataset_side_effect

            dset = factory.DatasetFactory()

            request = testing.DummyRequest()
            request.context = testing.DummyResource()
            request.matchdict['id'] = "S000203483"
            response = dataset(request)
            self.assertEqual(json.dumps(response, sort_keys=True), json.dumps(dset.to_dict(add_conditions=True, add_resources=True), sort_keys=True))

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_keyword(self, mock_search):
        mock_search.side_effect = dataset_side_effect

        kw = factory.KeywordFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000203483"
        response = keyword(request)

        self.assertEqual(response, kw.to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_keywords(self, mock_search):
        mock_search.side_effect = keywords_side_effect

        kw = factory.KeywordFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000203483"
        response = keywords(request)

        self.assertEqual(response, [kw.to_simple_dict()])


    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_dataset(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = dataset(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_kw(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = keyword(request)
        self.assertEqual(response.status_code, 404)

    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_non_existent_kws(self, mock_search):
    #     mock_search.return_value = MockQuery(None)
    #
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     request.matchdict['id'] = 'nonexistent_id'
    #     response = keywords(request)
    #     self.assertEqual(response.status_code, 404)

