from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import search, search_autocomplete

class SearchTest(unittest.TestCase):    
    def setUp(self):
        testing.setUp()

        self.category_filters = {
            "locus": [('feature type', 'feature_type'), ('molecular function', 'molecular_function'), ('phenotype', 'phenotypes'), ('cellular component', 'cellular_component'), ('biological process', 'biological_process')],
            "phenotype": [("observable", "observable"), ("qualifier", "qualifier"), ("references", "references"), ("phenotype_locus", "phenotype_loci"), ("chemical", "chemical"), ("mutant_type", "mutant_type")],
            "biological_process": [("go_locus", "go_loci")],
            "cellular_component": [("go_locus", "go_loci")],
            "molecular_function": [("go_locus", "go_loci")],
            "reference": [("author", "author"), ("journal", "journal"), ("year", "year"), ("reference_locus", "reference_loci")],
            "contig": [("strain", "strain")],
            "colleague": [("first_name", "first_name"), ("last_name", "last_name"), ("institution", "institution"), ("position", "position"), ("country", "country"), ("colleague_loci", "colleague_loci"), ("keywords", "keywords")]
        }

        self.autocomplete_query_result = {"took":4,"timed_out":False,"_shards":{"total":5,"successful":5,"failed":0},"hits":{"total":3016,"max_score":3.8131394,"hits":[{"_index":"searchable_items_green","_type":"searchable_item","_id":"S000001855","_score":3.8131394,"_source":{"name":"ACT1 / YFL039C","href":"/locus/S000001855/overview","category":"locus"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0000185","_score":0.46771955,"_source":{"name":"activation of MAPKKK activity","href":"/go/GO:0000185/overview","category":"biological_process"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0007256","_score":0.46771955,"_source":{"name":"activation of JNKK activity","href":"/go/GO:0007256/overview","category":"biological_process"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0000187","_score":0.46180964,"_source":{"name":"activation of MAPK activity","href":"/go/GO:0000187/overview","category":"biological_process"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0008494","_score":0.46180964,"_source":{"name":"translation activator activity","href":"/go/GO:0008494/overview","category":"molecular_function"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0005096","_score":0.45729372,"_source":{"name":"GTPase activator activity","href":"/go/GO:0005096/overview","category":"molecular_function"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0001648","_score":0.45445517,"_source":{"name":"proteinase activated receptor activity","href":"/go/GO:0001648/overview","category":"molecular_function"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:1990583","_score":0.4461447,"_source":{"name":"phospholipase D activator activity","href":"/go/GO:1990583/overview","category":"molecular_function"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0000186","_score":0.4461447,"_source":{"name":"activation of MAPKK activity","href":"/go/GO:0000186/overview","category":"biological_process"}},{"_index":"searchable_items_green","_type":"searchable_item","_id":"GO:0001671","_score":0.4461447,"_source":{"name":"ATPase activator activity","href":"/go/GO:0001671/overview","category":"molecular_function"}}]}}

        self.autocomplete_response = {"results": [{"category": "locus", "href": "/locus/S000001855/overview", "name": "ACT1 / YFL039C"}, {"category": "biological_process", "href": "/go/GO:0000185/overview", "name": "activation of MAPKKK activity"}, {"category": "biological_process", "href": "/go/GO:0007256/overview", "name": "activation of JNKK activity"}, {"category": "biological_process", "href": "/go/GO:0000187/overview", "name": "activation of MAPK activity"}, {"category": "molecular_function", "href": "/go/GO:0008494/overview", "name": "translation activator activity"}, {"category": "molecular_function", "href": "/go/GO:0005096/overview", "name": "GTPase activator activity"}, {"category": "molecular_function", "href": "/go/GO:0001648/overview", "name": "proteinase activated receptor activity"}, {"category": "molecular_function", "href": "/go/GO:1990583/overview", "name": "phospholipase D activator activity"}, {"category": "biological_process", "href": "/go/GO:0000186/overview", "name": "activation of MAPKK activity"}, {"category": "molecular_function", "href": "/go/GO:0001671/overview", "name": "ATPase activator activity"}]}
    
    def tearDown(self):
        testing.tearDown()

    def test_autocomplete_should_return_empty_for_no_q(self):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search_autocomplete(request)

        self.assertEqual(response, {"results": None})

    @mock.patch('src.models.ESearch.search')
    def test_autocomplete_queries_elastic_search(self, mock_es):
        request = testing.DummyRequest(params={'q': 'act'})
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search_autocomplete(request)

        mock_es.assert_called_with(body={
            "query": {
                "bool": {
                    "must": {
                        "match": {
                            "name": {
                                "query": "act",
                                "analyzer": "standard"
                            }
                        }
                    },
                    "must_not": { "match": { "category": "reference" }, "match": { "category": "download" }},
                    "should": [
                        {
                            "match": {
                                "category": {
                                    "query": "locus",
                                    "boost": 4
                                }
                            }
                        }
                    ]
                }
            }
        }, index='searchable_items')

    @mock.patch('src.models.ESearch.search')
    def test_autocomplete_queries_elastic_search(self, mock_es):
        mock_es.return_value = self.autocomplete_query_result
        
        request = testing.DummyRequest(params={'q': 'act'})
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search_autocomplete(request)

        self.assertEqual(response, self.autocomplete_response)
        
    @mock.patch('src.models.ESearch.search')
    def test_should_return_all_results_for_no_query_param_on_search(self, mock_es):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search(request)

        mock_es.assert_called_with(body={
            'query': {'match_all': {}},
            'aggs': {
                'feature_type': {
                    'terms': {
                        'field': 'feature_type'
                    }
                },
                'categories': {
                    'terms': {
                        'field': 'category'
                    }
                }
            }, 'size': 0}, index='searchable_items')

    @mock.patch('src.models.ESearch.search')
    def test_should_apply_pagination(self, mock_es):
        request = testing.DummyRequest(params={'q': 'eu gene', 'limit': 10, 'offset': 25, 'category': 'unknown'})
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search(request)

        mock_es.assert_called_with(body={
            'highlight': {
                'fields': {
                    'gene_history': {}, 'reference_loci': {}, 'strain': {}, 'synonyms': {}, 'references': {}, 'year': {}, 'secondary_sgdid': {}, 'name_description': {}, 'description': {}, 'mutant_type': {}, 'author': {}, 'cellular_component': {}, 'ec_number': {}, 'chemical': {}, 'go_loci': {}, 'phenotype_loci': {}, 'biological_process': {}, 'qualifier': {}, 'journal': {}, 'molecular_function': {}, 'phenotypes': {}, 'observable': {}, 'name': {}, 'tc_number': {}, 'sequence_history': {}, 'summary': {}, 'first_name': {}, 'last_name': {}, 'institution': {}, 'position': {}, 'country': {}, 'colleague_loci': {}, 'keywords': {}}},
            'query': {
                'filtered': {
                    'filter': {
                        'bool': {
                            'must': [{'term': {'category': 'unknown'}}]
                        }
                    },
                    'query': {
                        'bool': {
                            'minimum_should_match': 1,
                            'should': [
                                {
                                    "match_phrase_prefix": {
                                        "name": {
                                            "query": "eu gene",
                                            "boost": 3,
                                            "max_expansions": 30,
                                            "analyzer": "standard"
                                        }
                                    }
                                },
                                {
                                    "match_phrase_prefix": {
                                        "keys": {
                                            "query": "eu gene",
                                            "boost": 35,
                                            "max_expansions": 12,
                                            "analyzer": "standard"
                                        }
                                    }
                                },
                                {
                                    "match_phrase": {
                                        "name": {
                                            "query": "eu gene",
                                            "boost": 80,
                                            "analyzer": "standard"
                                        }
                                    }
                                },                        
                                {
                                    "match": {
                                        "description": {
                                            "query": "eu gene",
                                            "boost": 1,
                                            "analyzer": "standard"
                                        }
                                    }
                                },
                                {
                                    "match_phrase": {
                                        "keys": {
                                            "query": "eu gene",
                                            "boost": 50,
                                            "analyzer": "standard"
                                        }
                                    }
                                },
                                {
                                    "multi_match": {
                                        "query": "eu gene",
                                        "type": "best_fields",
                                        "fields": ['summary', 'name_description', 'phenotypes', 'cellular_component', 'biological_process', 'molecular_function', 'observable', 'qualifier', 'references', 'phenotype_loci', 'chemical', 'mutant_type', 'go_loci', 'author', 'journal', 'year', 'reference_loci', 'synonyms', 'ec_number', 'gene_history', 'sequence_history', 'secondary_sgdid', 'tc_number', 'strain', 'first_name', 'last_name', 'institution', 'position', 'country', 'colleague_loci', 'keywords'],
                                        "boost": 1
                                    }
                                }
                            ]
                        }
                    }
                }}, '_source': ['name', 'href', 'description', 'category', 'bioentity_id', 'phenotype_loci', 'go_loci', 'reference_loci', 'keys']}, from_=25, index='searchable_items', size=10)

    @mock.patch('src.models.ESearch.search')
    @mock.patch('src.views.format_aggregation_results')
    @mock.patch('src.views.format_search_results')
    def test_should_format_response(self, mock_format_search, mock_format_aggs, mock_es):
        mock_es.return_value = {
            'hits': {
                'total': 10
            }
        }

        mock_format_search.return_value = [1,2,3]
        mock_format_aggs.return_value = [3,2,1]
        
        request = testing.DummyRequest(params={'limit': 10, 'offset': 25, 'category': 'locus'})
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search(request)

        self.assertEqual(response, {
            'total': 10,
            'results': [1,2,3],
            'aggregations': [3,2,1]
        })

    @mock.patch('src.models.ESearch.search')
    @mock.patch('src.views.format_aggregation_results')
    @mock.patch('src.views.format_search_results')
    def test_should_format_response(self, mock_format_search, mock_format_aggs, mock_es):
        mock_es.return_value = {
            'hits': {
                'total': 10
            }
        }

        mock_format_search.return_value = [1,2,3]
        mock_format_aggs.return_value = [3,2,1]
        
        request = testing.DummyRequest(params={'limit': 10, 'offset': 25, 'category': 'locus'})
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search(request)

        mock_format_aggs.assert_called_with(mock_es.return_value, 'locus', self.category_filters)
        
        self.assertEqual(response, {
            'total': 10,
            'results': [1,2,3],
            'aggregations': [3,2,1]
        })

    @mock.patch('src.models.ESearch.search')
    @mock.patch('src.views.format_aggregation_results')
    @mock.patch('src.views.format_search_results')
    def test_should_return_empty_aggregations_for_unknown_categories(self, mock_format_search, mock_format_aggs, mock_es):
        mock_es.return_value = {
            'hits': {
                'total': 10
            }
        }

        mock_format_search.return_value = [1,2,3]
        mock_format_aggs.return_value = [3,2,1]
        
        request = testing.DummyRequest(params={'limit': 10, 'offset': 25, 'category': 'blablabla'})
        request.context = testing.DummyResource()
        request.registry.settings['elasticsearch.index'] = 'searchable_items'
        response = search(request)

        mock_format_aggs.assert_called_with([], 'blablabla', self.category_filters)
