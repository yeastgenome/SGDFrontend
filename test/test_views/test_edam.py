from pyramid import testing

import unittest
import mock
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import formats
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

    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_all_topics(self, mock_search):
    #     pass
    #     mock_search.return_value = MockQuery([self.keyword, self.keyword_2])
        
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     response = keywords(request)
    #     self.assertEqual(response, {"options": [{"id": int(self.keyword.keyword_id), "name": self.keyword.display_name}, {"id": int(self.keyword_2.keyword_id), "name": self.keyword_2.display_name}]})

    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_all_extensions(self, mock_search):
    #     pass
    #     mock_search.return_value = MockQuery([self.keyword, self.keyword_2])
        
    #     request = testing.DummyRequest()
    #     request.context = testing.DummyResource()
    #     response = keywords(request)
    #     self.assertEqual(response, {"options": [{"id": int(self.keyword.keyword_id), "name": self.keyword.display_name}, {"id": int(self.keyword_2.keyword_id), "name": self.keyword_2.display_name}]})
