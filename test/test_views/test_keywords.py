from pyramid import testing

import unittest
import mock
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import keywords
from src.models import Keyword

class KeywordsTest(unittest.TestCase):    
    def setUp(self):
        self.config = testing.setUp()
        self.keyword = factory.KeywordFactory(format_name="format_name_1")
        self.keyword_2 = factory.KeywordFactory(keyword_id=2, format_name="format_name_2")

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.models.DBSession.query')
    def test_should_return_all_keywords(self, mock_search):
        mock_search.return_value = MockQuery([self.keyword, self.keyword_2])
        
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = keywords(request)
        self.assertEqual(response, {"options": [{"id": int(self.keyword.keyword_id), "name": self.keyword.display_name}, {"id": int(self.keyword_2.keyword_id), "name": self.keyword_2.display_name}]})
