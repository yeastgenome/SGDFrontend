from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import reference_list
from src.models import Referencedocument

class ReferencesTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.topic = factory.EdamFactory()
        self.topic_2 = factory.EdamFactory()
        self.format = factory.EdamFactory()

    def tearDown(self):
        testing.tearDown()

    def test_reference_lists_should_400_for_no_data(self):
        request = testing.DummyRequest()
        request.json_body = {}
        request.context = testing.DummyResource()
        response = reference_list(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': "No reference_ids sent. JSON object expected: {\"reference_ids\": [\"id_1\", \"id_2\", ...]}"})
        
    def test_reference_list_should_400_for_invalid_data(self):
        request = testing.DummyRequest(post={'blablabla_ids': ['123']})
        request.json_body = {'blablabla_ids': ['123']}
        request.context = testing.DummyResource()
        response = reference_list(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': "No reference_ids sent. JSON object expected: {\"reference_ids\": [\"id_1\", \"id_2\", ...]}"})

        request = testing.DummyRequest(post={'reference_ids': []})
        request.json_body = {'reference_ids': []}
        request.context = testing.DummyResource()
        response = reference_list(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': "No reference_ids sent. JSON object expected: {\"reference_ids\": [\"id_1\", \"id_2\", ...]}"})
        
        request = testing.DummyRequest(post={'reference_ids': ['a_random_crazy_id']})
        request.json_body = {'reference_ids': ['a_random_crazy_id']}
        request.context = testing.DummyResource()
        response = reference_list(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': "IDs must be string format of integers. Example JSON object expected: {\"reference_ids\": [\"1\", \"2\"]}"})

    @mock.patch('src.models.DBSession.query')
    def test_reference_list_should_404_valid_but_nonexistent_ids(self, mock_search):
        mock_search.return_value = MockQuery(None)
        
        request = testing.DummyRequest(post={'reference_ids': ['1']})
        request.json_body = {'reference_ids': ['1']}
        request.context = testing.DummyResource()
        response = reference_list(request)

        self.assertEqual(json.loads(response.body), {'error': "Reference_ids do not exist."})
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.models.DBSession.query')
    def test_reference_lists_should_return_data_for_valid_ids(self, mock_search):
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()

        refdoc = factory.ReferenceDocumentFactory(referencedocument_id=1)
        refdoc_2 = factory.ReferenceDocumentFactory(referencedocument_id=2)

        mock_search.return_value = MockQuery([refdoc, refdoc_2])

        request = testing.DummyRequest(post={'reference_ids': [refdoc.reference_id, refdoc_2.reference_id]})
        request.json_body = {'reference_ids': [refdoc.reference_id, refdoc_2.reference_id]}
        request.context = testing.DummyResource()
        response = reference_list(request)

        self.assertEqual(response, [{'id': refdoc.reference_id, 'text': refdoc.text}, {'id': refdoc.reference_id, 'text': refdoc_2.text}])

        self.assertTrue(mock_search.return_value._full_params[0].compare(Referencedocument.reference_id.in_([refdoc.reference_id, refdoc_2.reference_id])))
        self.assertTrue(mock_search.return_value._full_params[1].compare(Referencedocument.document_type == 'Medline'))

                        
