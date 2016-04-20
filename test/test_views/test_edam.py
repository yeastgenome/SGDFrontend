from pyramid import testing

import unittest
import mock
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import formats, topics
from src.models import Edam

class EdamTest(unittest.TestCase):    
    def setUp(self):
        self.config = testing.setUp()
        self.topic = factory.EdamFactory()
        self.topic_2 = factory.EdamFactory()
        self.format = factory.EdamFactory()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.models.DBSession.query')
    def test_should_return_all_formats(self, mock_search):
        mock_search.return_value = MockQuery([self.topic, self.topic_2])
        
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = formats(request)
        
        self.assertEqual(response, {"options": [{"id": int(self.topic.edam_id), "name": self.topic.format_name}, {"id": int(self.topic_2.edam_id), "name": self.topic_2.format_name}]})
        self.assertTrue(mock_search.return_value._query_filter.query_params().compare(Edam.edam_namespace == 'format'))

    @mock.patch('src.models.DBSession.query')
    def test_should_return_all_topics(self, mock_search):
        mock_search.return_value = MockQuery([self.topic, self.topic_2])
        
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = topics(request)
        
        self.assertEqual(response, {"options": [{"id": int(self.topic.edam_id), "name": self.topic.format_name}, {"id": int(self.topic_2.edam_id), "name": self.topic_2.format_name}]})
        self.assertTrue(mock_search.return_value._query_filter.query_params().compare(Edam.edam_namespace == 'topic'))
