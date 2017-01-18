def add_sort_by(sort_by, search_body):
    if sort_by == 'alphabetical':
        search_body['sort'] = [
            {
                "name.raw": {
                    "order": "asc"
                }
            }
        ]
    elif sort_by == 'annotation':
        search_body['sort'] = [
            {
                "number_annotations": {
                    "order": "desc"
                }
            }
        ]

def add_highlighting(fields, search_body):
    for field in fields:
        search_body['highlight']['fields'][field] = {}

def format_search_results(search_results, query, response_fields):
    formatted_results = []

    for r in search_results['hits']['hits']:
        raw_obj = r.get('_source')

        obj = {}
        for field in response_fields:
            obj[field] = raw_obj.get(field)
                
        obj['highlights'] = r.get('highlight')

        formatted_results.append(obj)

    if search_is_quick(query, search_results):
        formatted_results[0]['is_quick'] = True

    return formatted_results

def format_aggregation_results(aggregation_results, category, category_filters):
    if category == '':
        category_obj = {'values': [], 'key': 'category'}
        for bucket in aggregation_results['aggregations']['categories']['buckets']:
            category_obj['values'].append({'key': bucket['key'], 'total': bucket['doc_count']})
        return [category_obj]
    
    elif category in category_filters.keys():
        formatted_agg = []
        
        for agg_info in category_filters[category]:
            agg_obj = {'key': agg_info[0], 'values': []}
            if agg_info[1] in aggregation_results['aggregations']:
                for agg in aggregation_results['aggregations'][agg_info[1]]['buckets']:
                    agg_obj['values'].append({'key': agg['key'], 'total': agg['doc_count']})
            formatted_agg.append(agg_obj)
            
        return formatted_agg
    
    else:
        return []

def search_is_quick(query, search_results):
    if search_results['hits']['hits'][0].get('_source').get('keys'):
        if query and query.replace('"', '').lower().strip() in search_results['hits']['hits'][0].get('_source').get('keys'):
            if len(search_results['hits']['hits']) > 1:
                if (query.replace('"', '').lower().strip() not in search_results['hits']['hits'][1].get('_source').get('keys')):
                    return True
            else:
                return True
    return False

def build_aggregation_query(es_query, category, category_filters):
    agg_query_body = {
        'query': es_query,
        'size': 0,
        'aggs': {}
    }

    if category == '':
        agg_query_body['aggs'] = {
            'categories': {
                'terms': {'field': 'category', 'size': 50}
            },
            'feature_type': {
                'terms': {'field': 'feature_type', 'size': 50}
            }
        }
    else:
        for c in category_filters[category]:
            agg_query_body['aggs'][c[1]] = {'terms': {'field': c[1] + '.raw', 'size': 999}}

    return agg_query_body

def build_es_search_body(query, category, es_query, returning_fields):
    results_search_body = {
        '_source': returning_fields,
        'highlight': {
            'fields' : {}
        },
        'query': es_query
    }
    
    if query == '' and category == '':
        results_search_body["query"] = {
            "function_score": {
                "query": es_query,
                "random_score": {"seed" : 12345}
            }
        }
    else:
        results_search_body["sort"] = [
            '_score',
            {'number_annotations': {'order': 'desc'}}
        ]

    return results_search_body

def build_search_query(query, multi_match_fields, category, category_filters, request):
    es_query = build_es_search_query(query, multi_match_fields)

    if category == '':
        return es_query
    
    query = {
        'filtered': {
            'query': es_query,
            'filter': {
                'bool': {
                    'must': [{'term': {'category': category}}]
                }
            }
        }
    }
    
    if category in category_filters.keys():
        for item in category_filters[category]:
            if request.params.get(item[0]):
                query['filtered']['filter']['bool']['must'].append({'term': {(item[1]+".raw"): request.params.get(item[0])}})

    return query
    
def build_es_search_query(query, search_fields):
    if query == "":
        es_query = {"match_all": {}}
    else:
        es_query = {'dis_max': {'queries': []}}

        if (query[0] in ('"', "'") and query[-1] in ('"', "'")):
            query = query[1:-1]

        es_query['dis_max']['queries'] = []

        custom_boosts = {
            "name": 200,
            "name.symbol": 300,
        }

        fields = search_fields + [
            "name.symbol"
        ]

        for field in fields:
            match = {}
            match[field] = {
                'query': query,
                'boost': custom_boosts.get(field, 50)
            }

            partial_match = {}
            partial_match[field.split(".")[0]] = {
                'query': query
            }

            es_query['dis_max']['queries'].append({'match': match})
            es_query['dis_max']['queries'].append({'match_phrase_prefix': partial_match})

    return es_query

def build_autocomplete_search_query(query, category, field='name'):
    es_query = {
        "query": {
            "bool": {
                "must": [{
                    "match": {
                        "name": {
                            "query": query,
                            "analyzer": "standard"
                        }
                    }
                }],
                "must_not": [{
                    "match": { "category": "reference" }
                }, {
                    "match": { "category": "download" }
                }],
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
        },
        '_source': ['name', 'href', 'category']
    }

    if category != '':
        es_query["query"]["bool"]["must"].append({"match": {"category": category}})
        if category != "locus":
            es_query["query"]["bool"].pop("should")

    if field != 'name':
        es_query['aggs'] = {}
        es_query['aggs'][field] = {
            'terms': {'field': field + '.raw', 'size': 999}
        }

        es_query['query']['bool']['must'][0]['match'] = {}
        es_query['query']['bool']['must'][0]['match'][field + '.autocomplete'] = {
            'query': query,
            'analyzer': 'standard'
        }

        es_query['_source'] = [field]

    return es_query

def format_autocomplete_results(es_response, field='name'):
    formatted_results = []
    
    if field != 'name':
        results = es_response['aggregations'][field]['buckets']
        for r in results:
            obj = {
                'name': r['key']
            }
            formatted_results.append(obj)
    else:
        for hit in es_response['hits']['hits']:
            obj = {
                'name': hit['_source']['name'],
                'href': hit['_source']['href'],
                'category': hit['_source']['category']
            }
            formatted_results.append(obj)

    return formatted_results

def build_sequence_objects_search_query(query):
    if query == '':
        search_body = {
            'query': { 'match_all': {} },
            'sort': { 'absolute_genetic_start': { 'order': 'asc' }}
        }
    elif ',' in query:
        search_body = {
            'query': {
                'filtered': {
                    'filter': {
                        'terms': {
                            '_all': [q.strip() for q in query.split(',')]
                        }
                    }
                }
            }
        }
    else:
        query_type = 'wildcard' if '*' in query else 'match_phrase'
        
        search_body = {
            'query': {
                query_type: {
                    '_all': query
                }
            }
        }

    search_body['_source'] = ['sgdid', 'name', 'href', 'absolute_genetic_start', 'format_name', 'dna_scores', 'protein_scores', 'snp_seqs']

    return search_body
    
