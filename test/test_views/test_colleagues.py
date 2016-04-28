from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import colleagues_by_last_name, colleague_by_format_name
from src.models import Colleague, ColleagueAssociation, ColleagueKeyword, Keyword

class ColleaguesTest(unittest.TestCase):    
    def setUp(self):
        self.config = testing.setUp()
        
        self.colleague = factory.ColleagueFactory.build()
        self.colleague_2 = factory.ColleagueFactory.build(colleague_id=113699, format_name="Jimmy_2")
        
        self.url_1 = factory.ColleagueUrlFactory.build(url_id=1, colleague_id=self.colleague.colleague_id)
        self.url_2 = factory.ColleagueUrlFactory.build(url_id=2, colleague_id=self.colleague.colleague_id, url_type="Lab")
        
        self.association_1_2 = factory.ColleagueAssociationFactory.build(colleague_id=self.colleague.colleague_id, associate_id=self.colleague_2.colleague_id, association_type="Lab member")
        self.association_2_1 = factory.ColleagueAssociationFactory.build(colleague_id=self.colleague.colleague_id, associate_id=self.colleague_2.colleague_id, association_type="Associate")
        
        self.keyword = factory.KeywordFactory(format_name="format_name_1")
        self.keyword_2 = factory.KeywordFactory(keyword_id=2, format_name="format_name_2")
        
        self.colleague_keyword = factory.ColleagueKeywordFactory.build(colleague_id=self.colleague.colleague_id, keyword_id=self.keyword.keyword_id)
        self.colleague_keyword_2 = factory.ColleagueKeywordFactory.build(colleague_id=self.colleague.colleague_id, keyword_id=self.keyword_2.keyword_id)

    def tearDown(self):
        testing.tearDown()

    def test_should_return_400_for_missing_last_name_arg(self):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = colleagues_by_last_name(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Query string field is missing: last_name'})

    @mock.patch('src.models.Colleague.urls', new_callable=mock.PropertyMock)
    @mock.patch('src.models.DBSession.query')
    def test_should_return_list_of_colleagues_by_last_name(self, mock_search, colleague_urls):
        request = testing.DummyRequest(params={'last_name': 'Page'})
        request.context = testing.DummyResource()

        mock_search.return_value = MockQuery(self.colleague)
        colleague_urls.return_value = [self.url_1, self.url_2]

        response = colleagues_by_last_name(request)

        self.assertEqual(response, [{
            'format_name': self.colleague.format_name,
            'work_phone': self.colleague.work_phone,
            'organization': self.colleague.institution,
            'first_name': self.colleague.first_name,
            'last_name': self.colleague.last_name,
            'email': self.colleague.email,
            'fax': self.colleague.fax,
            'webpages': {
                'lab_url': self.url_2.obj_url,
                'research_summary_url': self.url_1.obj_url
            }
        }])

    @mock.patch('src.models.DBSession.query')
    def test_last_names_should_begin_with_query_string(self, mock_search):
        mock_search.return_value = MockQuery(self.colleague)

        request = testing.DummyRequest(params={'last_name': 'page'})
        exp = Colleague.last_name.like("Page%")

        response = colleagues_by_last_name(request)

        self.assertTrue(mock_search.called_with(Colleague))
        self.assertTrue(exp.compare(mock_search.return_value._query_filter.query_params()))

    @mock.patch('src.models.DBSession.query')
    def test_should_return_empty_list_for_last_name_not_matched(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(params={'last_name': 'page'})
        response = colleagues_by_last_name(request)

        self.assertEqual(response, [])

    @mock.patch('src.models.Colleague.urls', new_callable=mock.PropertyMock)
    @mock.patch('src.models.DBSession.query')
    def test_should_return_colleague_by_format_name(self, mock_search, colleague_urls):
        
        def side_effect(*args, **kwargs):
            if args[0] == Colleague:
                return MockQuery(self.colleague)
            elif args[0].__dict__ == ColleagueKeyword.keyword_id.__dict__:
                return MockQuery(tuple([self.colleague_keyword.keyword_id]))
            elif args[0].__dict__ == Keyword.display_name.__dict__:
                return MockQuery(tuple([self.keyword.display_name]))
            elif len(args) == 2: # We can't group them into 'and'(&)-clauses because sqlalchemy overloads all the operator and then it would generate a query and not a boolean expression
                if args[0].__dict__ == ColleagueAssociation.associate_id.__dict__:
                    if args[1].__dict__ == ColleagueAssociation.association_type.__dict__:
                        return MockQuery((self.association_1_2.associate_id, self.association_1_2.association_type))
            elif len(args) == 3:
               if args[0].__dict__ == Colleague.first_name.__dict__:
                    if args[1].__dict__ == Colleague.last_name.__dict__:
                        if args[2].__dict__ == Colleague.format_name.__dict__:
                            return MockQuery((self.colleague_2.first_name, self.colleague_2.last_name, self.colleague_2.format_name))
            else:
                return MockQuery(None)
            
        mock_search.side_effect = side_effect
        colleague_urls.return_value = [self.url_1, self.url_2]

        request = testing.DummyRequest()
        request.matchdict['format_name'] = str(self.colleague.format_name)
        response = colleague_by_format_name(request)
        self.maxDiff = None
        self.assertEqual(response, {
            'orcid': self.colleague.orcid,
            'first_name': self.colleague.first_name,
            'last_name': self.colleague.last_name,
            'email': self.colleague.email,
            'position': self.colleague.job_title,
            'profession': self.colleague.profession,
            'organization': self.colleague.institution,
            'address': [self.colleague.address1],
            'city': self.colleague.city,
            'state': self.colleague.state,
            'country': self.colleague.country,
            'postal_code': self.colleague.postal_code,
            'work_phone': self.colleague.work_phone,
            'fax': self.colleague.fax,
            'webpages': {
                'lab_url': self.url_2.obj_url,
                'research_summary_url': self.url_1.obj_url
            },
            'associations': {'Lab member': [(self.colleague_2.first_name, self.colleague_2.last_name, self.colleague_2.format_name)]},
            'keywords': [self.keyword.display_name],
            'research_interests': self.colleague.research_interest,
            'last_update': str(self.colleague.date_last_modified)
        })

    @mock.patch('src.models.DBSession.query')
    def test_should_return_not_found_for_valid_colleague_by_format_name_but_non_existent(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.matchdict['format_name'] = str(self.colleague.format_name)
        response = colleague_by_format_name(request)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.body), {'error': 'Colleague not found'})

