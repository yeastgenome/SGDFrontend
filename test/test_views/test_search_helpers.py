import os

import unittest
import mock
from pyramid import testing

from src.search_helpers import add_sort_by, add_highlighting, format_search_results, format_aggregation_results, search_is_quick, add_exact_match, build_aggregation_query, build_search_query, build_es_search_query, build_autocomplete_search_query, format_autocomplete_results


class SearchHelpersTest(unittest.TestCase):
    def setUp(self):
        self.es_raw_response = {"took":4,"timed_out": False,"_shards":{"total":5,"successful":5,"failed":0},"hits":{"total":120735,"max_score":1.0,"hits":[{"_index":"searchable_items","_type":"searchable_item","_id":"Theo_C_Verrips_9119","_score":1.0,"_source":{"name":"Theo C Verrips","href":"/colleagues/Theo_C_Verrips_9119","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Kristin_Verschueren_6112","_score":1.0,"_source":{"name":"Kristin Verschueren","href":"/colleagues/Kristin_Verschueren_6112","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Matthias_Versele_6113","_score":1.0,"_source":{"name":"Matthias Versele","href":"/colleagues/Matthias_Versele_6113","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Francoise_Vezinhet_6115","_score":1.0,"_source":{"name":"Francoise Vezinhet","href":"/colleagues/Francoise_Vezinhet_6115","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Benoit_Viard_6116","_score":1.0,"_source":{"name":"Benoit Viard","href":"/colleagues/Benoit_Viard_6116","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Julie_Brill_648","_score":1.0,"_source":{"name":"Julie Brill","href":"/colleagues/Julie_Brill_648","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Steven_J._Brill_649","_score":1.0,"_source":{"name":"Steven J. Brill","href":"/colleagues/Steven_J._Brill_649","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"James_K._Keeven_2961","_score":1.0,"_source":{"name":"James K. Keeven","href":"/colleagues/James_K._Keeven_2961","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Walter_Keller_2970","_score":1.0,"_source":{"name":"Walter Keller","href":"/colleagues/Walter_Keller_2970","category":"colleagues"}},{"_index":"searchable_items","_type":"searchable_item","_id":"Douglas_Kellogg_2972","_score":1.0,"_source":{"name":"Douglas Kellogg","href":"/colleagues/Douglas_Kellogg_2972","category":"colleagues"}}]}}

        self.es_formatted_response = [{"category": "colleagues", "name": "Theo C Verrips", "highlights": None, "bioentity_id": None, "href": "/colleagues/Theo_C_Verrips_9119", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Kristin Verschueren", "highlights": None, "bioentity_id": None, "href": "/colleagues/Kristin_Verschueren_6112", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Matthias Versele", "highlights": None, "bioentity_id": None, "href": "/colleagues/Matthias_Versele_6113", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Francoise Vezinhet", "highlights": None, "bioentity_id": None, "href": "/colleagues/Francoise_Vezinhet_6115", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Benoit Viard", "highlights": None, "bioentity_id": None, "href": "/colleagues/Benoit_Viard_6116", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Julie Brill", "highlights": None, "bioentity_id": None, "href": "/colleagues/Julie_Brill_648", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Steven J. Brill", "highlights": None, "bioentity_id": None, "href": "/colleagues/Steven_J._Brill_649", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "James K. Keeven", "highlights": None, "bioentity_id": None, "href": "/colleagues/James_K._Keeven_2961", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Walter Keller", "highlights": None, "bioentity_id": None, "href": "/colleagues/Walter_Keller_2970", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}, {"category": "colleagues", "name": "Douglas Kellogg", "highlights": None, "bioentity_id": None, "href": "/colleagues/Douglas_Kellogg_2972", "description": None, 'reference_loci': None, 'go_loci': None, 'phenotype_loci': None}]

        self.es_aggregation_raw_response = {"took":12,"timed_out":False,"_shards":{"total":5,"successful":5,"failed":0},"hits":{"total":120735,"max_score":0.0,"hits":[]},"aggregations":{"feature_type":{"doc_count_error_upper_bound":0,"sum_other_doc_count":312,"buckets":[{"key":"orf","doc_count":6691},{"key":"long_terminal_repeat","doc_count":387},{"key":"ars","doc_count":352},{"key":"trna_gene","doc_count":299},{"key":"transposable_element_gene","doc_count":92},{"key":"snorna_gene","doc_count":77},{"key":"in","doc_count":55},{"key":"not","doc_count":55},{"key":"of","doc_count":55},{"key":"s288c","doc_count":55}]},"categories":{"doc_count_error_upper_bound":0,"sum_other_doc_count":0,"buckets":[{"key":"reference","doc_count":30279},{"key":"biological_process","doc_count":28648},{"key":"contig","doc_count":25199},{"key":"colleagues","doc_count":12230},{"key":"molecular_function","doc_count":10161},{"key":"locus","doc_count":8155},{"key":"cellular_component","doc_count":3908},{"key":"phenotype","doc_count":2023},{"key":"strain","doc_count":73},{"key":"resource","doc_count":59}]}}}

        self.es_aggregation_formatted_response = [{"values": [{"total": 30279, "key": "reference"}, {"total": 28648, "key": "biological_process"}, {"total": 25199, "key": "contig"}, {"total": 12230, "key": "colleagues"}, {"total": 10161, "key": "molecular_function"}, {"total": 8155, "key": "locus"}, {"total": 3908, "key": "cellular_component"}, {"total": 2023, "key": "phenotype"}, {"total": 73, "key": "strain"}, {"total": 59, "key": "resource"}], "key": "category"}]

        self.response_fields = ['name', 'href', 'description', 'category', 'bioentity_id', 'phenotype_loci', 'go_loci', 'reference_loci']

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
        pass

    def test_add_sort_by_should_ignore_unknown_sorts(self):
        search_body = {}
        add_sort_by('blablabla', search_body)
        self.assertEqual({}, search_body)
    
    def test_add_sort_by_should_include_alphabetical_and_annotation(self):
        search_body = {}
        add_sort_by('alphabetical', search_body)
        self.assertEqual({'sort': [
            {
                "name.raw": {
                    "order": "asc"
                }
            }
        ]}, search_body)

        search_body = {}
        add_sort_by('annotation', search_body)
        self.assertEqual({'sort': [
            {
                "number_annotations": {
                    "order": "desc"
                }
            }
        ]}, search_body)

    def test_add_highlighting_should_include_every_field_passed(self):
        search_body = {'highlight' : {
            'fields' : {}
        }}
        add_highlighting(['field_1', 'field_2'], search_body)
        self.assertEqual(search_body, {
            'highlight': {
                'fields': {
                    'field_1': {},
                    'field_2': {}
                }
            }
        })

    def test_add_highlighting_should_do_nothing_for_empty_fields(self):
        search_body = {'highlight' : {
            'fields' : {}
        }}
        add_highlighting([], search_body)
        self.assertEqual({'highlight': {
            'fields': {}
        }}, search_body)

    def test_format_search_results_should_process_es_response(self):
        self.assertEqual(format_search_results(self.es_raw_response, "", self.response_fields), self.es_formatted_response)

    @mock.patch('src.search_helpers.search_is_quick')
    def test_format_search_results_should_include_is_quick(self, is_quick):
        is_quick.return_value = True

        self.es_formatted_response[0]['is_quick'] = True

        self.assertEqual(format_search_results(self.es_raw_response, "name of the first result", self.response_fields), self.es_formatted_response)

    def tests_format_aggregation_results_should_return_empty_for_unknown_category(self):
        self.assertEqual([], format_aggregation_results(self.es_aggregation_raw_response, 'lalala', self.category_filters))

    def tests_format_aggregation_results_for_no_category(self):
        self.assertEqual(self.es_aggregation_formatted_response, format_aggregation_results(self.es_aggregation_raw_response, '', self.category_filters))

    def tests_format_aggregation_results_for_existing_category_and_no_subcategory(self):
        self.assertEqual([{'key': 'go_locus', 'values': []}], format_aggregation_results(self.es_aggregation_raw_response, 'biological_process', self.category_filters))
        
    def test_search_is_not_quick_when_empty_query(self):
        query = ""
        search_results = {'hits': {'hits': [{'_source': {'keys': ['key_1', 'key_2']}}]}}
        self.assertFalse(search_is_quick(query, search_results))
        
    def test_search_is_quick_not_in_keys(self):
        query = "eu_gene"
        search_results = {'hits': {'hits': [{'_source': {'keys': ['key_1', 'key_2']}}]}}
        self.assertFalse(search_is_quick(query, search_results))

    def test_search_is_quick_in_keys(self):
        query = "eu_gene"
        search_results = {'hits': {'hits': [{'_source': {'keys': ['key_1', 'eu_gene']}}]}}
        self.assertTrue(search_is_quick(query, search_results))

    def test_search_is_quick_in_keys_case_insensitive(self):
        query = "   Eu_GeNe "
        search_results = {'hits': {'hits': [{'_source': {'keys': ['key_1', 'eu_gene']}}]}}
        self.assertTrue(search_is_quick(query, search_results))

    def test_search_is_quick_must_ignore_quotes(self):
        query = "\"eu_gene\""
        search_results = {'hits': {'hits': [{'_source': {'keys': ['key_1', 'eu_gene']}}]}}
        self.assertTrue(search_is_quick(query, search_results))

    def test_build_es_search_query(self):
        query = "eu_gene"
        
        multi_match_fields = [1,2,3]

        self.maxDiff = None
        
        self.assertEqual({
            "bool": {
                "should": [
                    {
                        "match_phrase_prefix": {
                            "name": {
                                "query": query,
                                "boost": 3,
                                "max_expansions": 30,
                                "analyzer": "standard"
                            }
                        }
                    },
                    {
                        "match_phrase_prefix": {
                            "keys": {
                                "query": query,
                                "boost": 35,
                                "max_expansions": 12,
                                "analyzer": "standard"
                            }
                        }
                    },
                    {
                        "match_phrase": {
                            "name": {
                                "query": query,
                                "boost": 80,
                                "analyzer": "standard"
                            }
                        }
                    },                        
                    {
                        "match": {
                            "description": {
                                "query": query,
                                "boost": 1,
                                "analyzer": "standard"
                            }
                        }
                    },
                    {
                        "match_phrase": {
                            "keys": {
                                "query": query,
                                "boost": 50,
                                "analyzer": "standard"
                            }
                        }
                    },
                    {
                        "multi_match": {
                            "query": query,
                            "type": "best_fields",
                            "fields": multi_match_fields,
                            "boost": 1
                        }
                    },
                ],
                "minimum_should_match": 1
            }
        }, build_es_search_query(query, multi_match_fields))

    def test_build_es_search_query_should_quote_query_with_special_characters(self):
        query = "eu-gene"
        
        multi_match_fields = [1,2,3]

        self.maxDiff = None
        
        self.assertEqual({
            'bool': {
                'minimum_should_match': 1,
                'should': [{
                    'match_phrase_prefix': {
                        'name': {
                            'analyzer': 'standard',
                            'boost': 3,
                            'max_expansions': 30,
                            'query': "\"" + query + "\""}}
                }, {
                    'match_phrase_prefix': {
                        'name': {
                            'analyzer': 'standard',
                            'boost': 80,
                            'query': "\"" + query + "\""}}
                }, {
                    'match_phrase_prefix': {
                        'description': {
                            'analyzer': 'standard',
                            'boost': 1,
                            'query': "\"" + query + "\""}}
                }, {
                    'multi_match': {
                        'boost': 3,
                        'fields': [1, 2, 3],
                        'query': "\"" + query + "\"",
                        'type': 'phrase_prefix'
                    }
                }]
            }
        }, build_es_search_query(query, multi_match_fields))
        
    def test_build_es_query_for_empty_query(self):
        query = ""
        self.assertEqual({'match_all': {}}, build_es_search_query("", []))
        
    @mock.patch('src.search_helpers.add_exact_match')
    def test_add_exact_match_for_single_comma_queries(self, mock_exact):
        query = "'eu gene'"
        multi_match_fields = [1,2,3]
        
        build_es_search_query(query, multi_match_fields)
        self.assertTrue(mock_exact.called)

    @mock.patch('src.search_helpers.add_exact_match')
    def test_add_exact_match_for_double_comma_queries(self, mock_exact):
        query = "\"eu gene\""
        multi_match_fields = [1,2,3]
        
        build_es_search_query(query, multi_match_fields)
        self.assertTrue(mock_exact.called)

    def test_build_search_query_with_empty_category(self):
        query = "eu gene"
        multi_match_fields = [1,2,3]
        category = ""

        request = testing.DummyRequest()
        request.context = testing.DummyResource()

        self.assertEqual(build_es_search_query(query, multi_match_fields), build_search_query(query, multi_match_fields, category, self.category_filters, request))

    def test_build_search_query_with_no_filters(self):
        query = "eu gene"
        multi_match_fields = [1,2,3]
        category = "locus"

        request = testing.DummyRequest()
        request.context = testing.DummyResource()

        self.assertEqual({
            'filtered': {
                'query': build_es_search_query(query, multi_match_fields),
                'filter': {
                    'bool': {
                        'must': [{'term': {'category': category}}]
                    }
                }
            }
        }, build_search_query(query, multi_match_fields, category, self.category_filters, request))

    def test_build_search_query_with_filters(self):
        query = "eu gene"
        multi_match_fields = [1,2,3]
        category = "locus"

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.params['feature type'] = 'type_1'

        item = self.category_filters[category][0]

        self.assertEqual({
            'filtered': {
                'query': build_es_search_query(query, multi_match_fields),
                'filter': {
                    'bool': {
                        'must': [{'term': {'category': category}}, {'term': {(item[1]+".raw"): request.params.get(item[0])}}]
                    }
                }
            }
        }, build_search_query(query, multi_match_fields, category, self.category_filters, request))

    def test_build_aggregation_query_with_emtpy_category(self):
        query = "eu gene"
        multi_match_fields = [1,2]
        category = ""
        
        es_query = build_es_search_query(query, multi_match_fields)
        
        self.assertEqual({
            'query': es_query,
            'size': 0,
            'aggs': {
                'categories': {
                    'terms': {'field': 'category'}
                },
                'feature_type': {
                    'terms': {'field': 'feature_type'}
                }
            }
        }, build_aggregation_query(es_query, category, self.category_filters))

    def test_build_aggregation_query_with_category(self):
        query = "eu gene"
        multi_match_fields = [1,2]
        category = "locus"
        
        es_query = build_es_search_query(query, multi_match_fields)

        aggs = {}
        
        for c in self.category_filters[category]:
            aggs[c[1]] = {'terms': {'field': c[1] + '.raw', 'size': 999}}
        
        self.assertEqual({
            'query': es_query,
            'size': 0,
            'aggs': aggs
        }, build_aggregation_query(es_query, category, self.category_filters))

    def test_add_exact_match(self):
        query = "eu gene"
        multi_match_fields = [1,2]
        es_query = build_es_search_query(query, multi_match_fields)
        
        add_exact_match(es_query, query, multi_match_fields)

        es_query_original = build_es_search_query(query, multi_match_fields)

        self.assertEqual(es_query, {
            'bool': {'minimum_should_match': 1,
                     'should': [{
                         'match_phrase_prefix': {
                             'name': {
                                 'analyzer': 'standard',
                                 'boost': 3,
                                 'max_expansions': 30,
                                 'query': 'eu gene'}}
                     }, {
                         'match_phrase_prefix': {
                             'name': {
                                 'analyzer': 'standard',
                                 'boost': 80,
                                 'query': 'eu gene'
                             }
                         }
                     }, {
                         'match_phrase_prefix': {
                             'description': {
                                 'analyzer': 'standard',
                                 'boost': 1,
                                 'query': 'eu gene'
                             }
                         }
                     }, {
                         'multi_match': {
                             'boost': 3,
                             'fields': [1, 2],
                             'query': 'eu gene',
                             'type': 'phrase_prefix'
                         }
                     }
                     ]
            }})

    def test_build_autocomplete_search_query(self):
        query = "act"
        es_query = build_autocomplete_search_query(query)
        self.assertEqual(es_query, {
            "query": {
                "bool": {
                    "must": {
                        "match": {
                            "name": {
                                "query": query,
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
            }, '_source': ['name', 'href', 'category']
        })

    def test_format_autocomplete_results(self):
        self.assertEqual(format_autocomplete_results(self.autocomplete_query_result), self.autocomplete_response["results"])
