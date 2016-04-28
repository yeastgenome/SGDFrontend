from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import chemical
from src.models import Chebi, ChebiUrl

class ChemicalTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.chebi = factory.ChebiFactory()
        self.chebi_url = factory.ChebiUrlFactory()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.models.DBSession.query')
    def test_chemical_should_404_nonexistent_identifier(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = chemical(request)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.body), {'error': "Chemical not found"})

    @mock.patch('src.models.DBSession.query')
    def test_chemical_should_return_chemical_for_id(self, mock_search):
        mock_chebi = MockQuery((self.chebi.chebi_id, self.chebi.display_name, self.chebi.chebiid, self.chebi.format_name))
        mock_chebi_url = MockQuery((self.chebi_url.obj_url,))
        
        def side_effect(*args, **kwargs):
            if args[0] == ChebiUrl.obj_url:
                return mock_chebi_url
            else:
                return mock_chebi

        mock_search.side_effect = side_effect

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = self.chebi.chebi_id
        response = chemical(request)

        self.assertEqual(response, {
            'display_name': self.chebi.display_name,
            'chebi_id': self.chebi.chebiid,
            'id': self.chebi.chebi_id,
            'link': '/chemical/' + self.chebi.format_name + '/overview/',
            'urls': [{'link': self.chebi_url.obj_url}]
        })
        self.assertTrue(mock_chebi._query_filter._params.compare(Chebi.chebi_id == self.chebi.chebi_id))
        self.assertTrue(mock_chebi_url._query_filter._params.compare(ChebiUrl.chebi_id == self.chebi.chebi_id))

    @mock.patch('src.models.DBSession.query')
    def test_chemical_should_return_chemical_for_format_name(self, mock_search):
        mock_chebi = MockQuery((self.chebi.chebi_id, self.chebi.display_name, self.chebi.chebiid, self.chebi.format_name))
        mock_chebi_url = MockQuery((self.chebi_url.obj_url,))
        
        def side_effect(*args, **kwargs):
            if args[0] == ChebiUrl.obj_url:
                return mock_chebi_url
            else:
                return mock_chebi

        mock_search.side_effect = side_effect

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = self.chebi.format_name
        response = chemical(request)

        self.assertEqual(response, {
            'display_name': self.chebi.display_name,
            'chebi_id': self.chebi.chebiid,
            'id': self.chebi.chebi_id,
            'link': '/chemical/' + self.chebi.format_name + '/overview/',
            'urls': [{'link': self.chebi_url.obj_url}]
        })
        self.assertTrue(mock_chebi._query_filter._params.compare(Chebi.format_name == self.chebi.format_name))
        self.assertTrue(mock_chebi_url._query_filter._params.compare(ChebiUrl.chebi_id == self.chebi.chebi_id))

    
