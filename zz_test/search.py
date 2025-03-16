from collections import defaultdict
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
# from os import getcwd


from elasticsearch import Elasticsearch
from agr_literature_service.api.config import config

from fastapi import HTTPException, status

from agr_literature_service.lit_processing.utils.sqlalchemy_utils import create_postgres_session
from agr_literature_service.api.crud.topic_entity_tag_utils import get_map_ateam_curies_to_names
from agr_literature_service.api.crud.workflow_tag_crud import atp_get_all_descendents
logger = logging.getLogger(__name__)

file_workflow_root_ids = ["ATP:0000140", "ATP:0000161"]
reference_classification_root_ids = ["ATP:0000165"]
entity_extraction_root_ids = ["ATP:0000172"]
manual_indexing_root_ids = ["ATP:0000273"]


def date_str_to_micro_seconds(date_str: str, start: bool):
    # convert string to Datetime int that is stored in Elastic search
    # initial strings are in the format:- "2010-10-28T04:00:00.000"
    # So just grab chars before T and converts to seconds after epoch
    # then mulitply by 1000000 and convert to int.
    date_time = datetime.fromisoformat(date_str)
    if start:
        return_date= date_time.replace(hour=0,minute=0)
    else:
        return_date = date_time.replace(hour=23, minute=59)

    return int(return_date.timestamp() * 1000000)


def search_date_range(es_body,
                      date_pubmed_modified: Optional[List[str]] = None,
                      date_pubmed_arrive: Optional[List[str]] = None,
                      date_published: Optional[List[str]] = None,
                      date_created: Optional[List[str]] = None):
    # date_pubmed_X is split to just get the date and remove the time element
    # as elastic search does a tr comparison and if the end date has the time
    # element stil in it fails even if the date bits match as the string is longer.
    if "must" not in es_body["query"]["bool"]["filter"]["bool"]:
        es_body["query"]["bool"]["filter"]["bool"]["must"] = []
    if date_pubmed_modified:
        es_body["query"]["bool"]["filter"]["bool"]["must"].append(
            {
                "range": {
                    "date_last_modified_in_pubmed": {
                        "gte": date_pubmed_modified[0],
                        "lte": date_pubmed_modified[1]
                    }
                }
            })
    if date_pubmed_arrive:
        es_body["query"]["bool"]["filter"]["bool"]["must"].append(
            {
                "range": {
                    "date_arrived_in_pubmed": {
                        "gte": date_pubmed_arrive[0],
                        "lte": date_pubmed_arrive[1]
                    }
                }
            })
    if date_created:
        es_body["query"]["bool"]["filter"]["bool"]["must"].append(
            {
                "range": {
                    "date_created": {
                        "gte": date_str_to_micro_seconds(date_created[0],True),
                        "lte": date_str_to_micro_seconds(date_created[1], False)
                    }
                }
            })
    if date_published:
        start = date_published[0]
        end = date_published[1]
        es_body["query"]["bool"]["filter"]["bool"]["must"].append(
            {
                "bool": {
                    "should": [
                        {
                            "range": {
                                "date_published_end": {
                                    "gte": start,
                                    "lte": end
                                }
                            }
                        },
                        {
                            "range": {
                                "date_published_start": {
                                    "lte": start,
                                    "gte": end
                                }
                            }
                        },
                        {
                            "bool": {
                                "must": [
                                    {
                                        "range": {
                                            "date_published_start": {
                                                "lte": start
                                            }
                                        }
                                    },
                                    {
                                        "range": {
                                            "date_published_end": {
                                                "gte": end
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            })


# flake8: noqa: C901
def search_references(query: str = None, facets_values: Dict[str, List[str]] = None, negated_facets_values: Dict[str, List[str]] = None,
                      size_result_count: Optional[int] = 10, sort_by_published_date_order: Optional[str] = "asc",
                      page: Optional[int] = 1,
                      facets_limits: Dict[str, int] = None, return_facets_only: bool = False,
                      author_filter: Optional[str] = None, date_pubmed_modified: Optional[List[str]] = None,
                      date_pubmed_arrive: Optional[List[str]] = None,
                      date_published: Optional[List[str]] = None,
                      date_created: Optional[List[str]] = None,
                      query_fields: str = None, partial_match: bool = True,
                      tet_nested_facets_values: Optional[Dict] = None):
    if query is None and facets_values is None and not return_facets_only:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="requested a search but no query and no facets provided")

    
    # for testing
    wft_mod_abbreviation = ['SGD']
    tet_data_provider = ['SGD']

    
    if facets_limits is None:
        facets_limits = {}
    if size_result_count is None:
        size_result_count = 10
    if page is None:
        page = 1

    from_entry = (page-1) * size_result_count
    es_host = config.ELASTICSEARCH_HOST
    es = Elasticsearch(hosts=es_host + ":" + config.ELASTICSEARCH_PORT)
    es_body: Dict[str, Any] = {
        "query": {
            "bool": {
                "must": [],
                "should": [],
                "filter": {
                    "bool": {}
                }
            }
        },
        "fields": ["language.keyword"],
        "highlight": {
            "fields": [
                {"title": {"type": "unified"}},
                {"abstract": {"type": "unified"}},
                {"keywords": {"type": "unified"}},
                {"citation": {"type": "unified"}},
                {"authors.name": {"type": "unified"}}
            ]
        },
        "aggregations": {
            "language.keyword": {
                "terms": {
                    "field": "language.keyword",
                    "min_doc_count": 0,
                    "size": facets_limits.get("mod_reference_types.keyword", 10)
                }
            },
            "mod_reference_types.keyword": {
                "terms": {
                    "field": "mod_reference_types.keyword",
                    "size": facets_limits.get("mod_reference_types.keyword", 10)
                }
            },
            "pubmed_types.keyword": {
                "terms": {
                    "field": "pubmed_types.keyword",
                    "size": facets_limits.get("pubmed_types.keyword", 10)
                }
            },
            "category.keyword": {
                "terms": {
                    "field": "category.keyword",
                    "size": facets_limits.get("category.keyword", 10)
                }
            },
            "pubmed_publication_status.keyword": {
                "terms": {
                    "field": "pubmed_publication_status.keyword",
                    "min_doc_count": 0,
                    "size": facets_limits.get("pubmed_publication_status.keyword", 10)
                }
            },
            "mods_in_corpus.keyword": {
                "terms": {
                    "field": "mods_in_corpus.keyword",
                    "min_doc_count": 0,
                    "size": facets_limits.get("mods_in_corpus.keyword", 10)
                }
            },
            "mods_needs_review.keyword": {
                "terms": {
                    "field": "mods_needs_review.keyword",
                    "min_doc_count": 0,
                    "size": facets_limits.get("mods_needs_review.keyword", 10)
                }
            },
            "mods_in_corpus_or_needs_review.keyword": {
                "terms": {
                    "field": "mods_in_corpus_or_needs_review.keyword",
                    "min_doc_count": 0,
                    "size": facets_limits.get("mods_in_corpus_or_needs_review.keyword", 10)
                }
            },
            "authors.name.keyword": {
                "terms": {
                    "field": "authors.name.keyword",
                    "size": facets_limits.get("authors.name.keyword", 10)
                }
            },
            # Define workflow_tags as a nested aggregation.
            "workflow_tags": {
                "nested": {
                    "path": "workflow_tags"
                },
                "aggs": {
                    "by_mod_abbreviation": {
                        "terms": {
                            "field": "workflow_tags.mod_abbreviation",
                            "min_doc_count": 0,
                            "size": 100
                        },
                        "aggs": {
                            "workflow_tag_ids": {
                                "terms": {
                                    "field": "workflow_tags.workflow_tag_id.keyword",
                                    "min_doc_count": 0,
                                    "size": 100
                                },
                                "aggs": {
                                    "reverse_docs": {
                                        "reverse_nested": {}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "from": from_entry,
        "size": size_result_count,
        "track_total_hits": True,
        "sort": [
            {
                "date_published_start": {
                    "order": sort_by_published_date_order,
                    "missing": "_last"
                }
            }
        ]
    }
    if sort_by_published_date_order not in ["desc", "asc"]:
        del es_body["sort"]

    ensure_structure(es_body)

    tet_facets = {}
    if tet_nested_facets_values and "tet_facets_values" in tet_nested_facets_values:
        tet_facets = add_tet_facets_values(es_body, tet_nested_facets_values,
                                           tet_nested_facets_values.get("apply_to_single_tag", False))
    apply_all_tags_tet_aggregations(es_body, tet_facets, facets_limits)
    if return_facets_only:
        del es_body["query"]
        es_body["size"] = 0
        res = es.search(index=config.ELASTICSEARCH_INDEX, body=es_body)
        return process_search_results(res, wft_mod_abbreviation, tet_data_provider)
    if query and (query_fields == "All" or query_fields is None):
        es_body["query"]["bool"]["must"].append({
            "bool": {
                "should":
                    [
                        {
                            "simple_query_string": {
                                "fields": [
                                    "title",
                                    "keywords",
                                    "abstract",
                                    "citation"
                                ],
                                "query": query + "*" if partial_match else query,
                                "analyze_wildcard": "true",
                                "flags" : "PHRASE|PREFIX|WHITESPACE|OR|AND|ESCAPE"
                            }
                        },
                        {
                            "match": {
                                "authors.name": {
                                    "query": query.lower(),
                                    "analyzer": "authorNameAnalyzer"
                                }
                            }
                        },
                        {
                            "wildcard" : {
                                "curie.keyword": "*" + query
                            }
                        },
                        {
                            "wildcard": {
                                "cross_references.curie.keyword": "*" + query
                            }
                        }
                    ]
            }
        })
    elif query and (query_fields == "Title" or query_fields=="Abstract" or query_fields == "Keyword" or query_fields == "Citation"):
        if query_fields == "Title":
                es_field = "title"
        elif query_fields == "Abstract":
                es_field = "abstract"
        elif query_fields =="Keyword":
                es_field = "keywords"
        elif query_fields =="Citation":
                es_field = "citation"
        es_body["query"]["bool"]["must"].append(
            {
                "simple_query_string":{
                    "fields":[
                        es_field,
                    ],
                    "query" : query + "*" if partial_match else query,
                    "analyze_wildcard": "true",
                    "flags" : "PHRASE|PREFIX|WHITESPACE|OR|AND|ESCAPE"
                }
            })
    elif query and query_fields == "Curie":
        es_body["query"]["bool"]["must"].append(
            {
                "wildcard" : {
                    "curie.keyword": "*" + query
                }
            })
    elif query and query_fields == "Xref":
        es_body["query"]["bool"]["must"].append(
            {
                "wildcard": {
                    "cross_references.curie.keyword": "*" + query
                }
            })

    WORKFLOW_FACETS = ["file_workflow", "manual_indexing", "entity_extraction", "reference_classification"]

    if facets_values:
        for facet_field, facet_list_values in facets_values.items():
            if "must" not in es_body["query"]["bool"]["filter"]["bool"]:
                es_body["query"]["bool"]["filter"]["bool"]["must"] = []    
            if facet_field in WORKFLOW_FACETS:
                nested_query = {
                    "nested": {
                        "path": "workflow_tags",
                        "query": {
                            "bool": {
                                "must": [
                                    {"terms": {"workflow_tags.mod_abbreviation": wft_mod_abbreviation}},
                                    {"terms": {"workflow_tags.workflow_tag_id.keyword": facet_list_values}}
                                ]
                            }
                        }
                    }
                }
                es_body["query"]["bool"]["filter"]["bool"]["must"].append(nested_query)
            else:
                # Standard facet application
                es_body["query"]["bool"]["filter"]["bool"]["must"].append({"bool": {"must": []}})
                for facet_value in facet_list_values:
                    es_body["query"]["bool"]["filter"]["bool"]["must"][-1]["bool"]["must"].append({"term": {}})
                    es_body["query"]["bool"]["filter"]["bool"]["must"][-1]["bool"]["must"][-1]["term"][facet_field] = facet_value

    if negated_facets_values:
        for facet_field, facet_list_values in negated_facets_values.items():
            if "must_not" not in es_body["query"]["bool"]["filter"]["bool"]:
                es_body["query"]["bool"]["filter"]["bool"]["must_not"] = []
            for facet_value in facet_list_values:
                es_body["query"]["bool"]["filter"]["bool"]["must_not"].append({"term": {}})
                es_body["query"]["bool"]["filter"]["bool"]["must_not"][-1]["term"][facet_field] = facet_value

    date_range = False
    if date_pubmed_modified or date_pubmed_arrive or date_published or date_created:
        date_range = True
        search_date_range(es_body, date_pubmed_modified, date_pubmed_arrive, date_published, date_created)
    if not facets_values and not date_range and not negated_facets_values and not tet_facets:
        del es_body["query"]["bool"]["filter"]

    if author_filter:
        # es_body["aggregations"]["authors.name.keyword"]["terms"]["include"] = ".*" + author_filter + ".*"
        author_filter_query = {
            "match": {
                "authors.name": {
                    "query": author_filter,
                    "analyzer": "authorNameAnalyzer"
                }
            }
        }
        es_body["query"]["bool"]["must"].append(author_filter_query)
    res = es.search(index=config.ELASTICSEARCH_INDEX, body=es_body)
    formatted_results = process_search_results(res, wft_mod_abbreviation, tet_data_provider)
    return formatted_results


def process_search_results(res, wft_mod_abbreviation, tet_data_provider):  # pragma: no cover

    hits = [{
        "curie": ref["_source"]["curie"],
        "citation": ref["_source"]["citation"],
        "title": ref["_source"]["title"],
        "date_published": ref["_source"]["date_published"],
        "date_published_start": ref["_source"]["date_published_start"],
        "date_published_end": ref["_source"]["date_published_end"],
        "date_created": ref["_source"]["date_created"],
        "abstract": ref["_source"]["abstract"],
        "cross_references": ref["_source"]["cross_references"],
        "workflow_tags": ref["_source"]["workflow_tags"],
        "mod_reference_types": ref["_source"]["mod_reference_types"],
        "language": ref["fields"]["language.keyword"],
        "authors": ref["_source"]["authors"],
        "highlight": remap_highlights(ref.get("highlight", {}))
    } for ref in res["hits"]["hits"]]

    # process aggregations
    topics = extract_tet_aggregation_data(res, 'topic_aggregation','topics')
    confidence_levels = extract_tet_aggregation_data(res, 'confidence_aggregation', 'confidence_levels')
    source_methods = extract_tet_aggregation_data(res, 'source_method_aggregation', 'source_methods')
    source_evidence_assertions = extract_tet_aggregation_data(res, 'source_evidence_assertion_aggregation',
                                                              'source_evidence_assertions')
    res['aggregations'].pop('topic_aggregation', None)
    res['aggregations'].pop('confidence_aggregation', None)
    res['aggregations'].pop('source_method_aggregation', None)
    res['aggregations'].pop('source_evidence_assertion_aggregation', None)

    add_curie_to_name_values(topics)
    add_curie_to_name_values(source_evidence_assertions)
    
    res['aggregations']['topics'] = topics
    res['aggregations']['confidence_levels'] = confidence_levels
    res['aggregations']['source_methods'] = source_methods
    res['aggregations']['source_evidence_assertions'] = source_evidence_assertions

    # Process workflow tags using the nested aggregation.
    workflow_tags_nested = res['aggregations'].get("workflow_tags", {})
    mod_buckets = workflow_tags_nested.get("by_mod_abbreviation", {}).get("buckets", [])

    # Build a mapping of mod abbreviation to its tag buckets.
    # We use uppercase keys for tags for case-insensitive matching.
    mod_bucket_lookup = {}
    for mod_bucket in mod_buckets:
        mod_key = mod_bucket["key"]  # e.g., 'mgi', 'sgd'
        tag_buckets = mod_bucket.get("workflow_tag_ids", {}).get("buckets", [])
        mod_bucket_lookup[mod_key] = {bucket["key"].upper(): bucket for bucket in tag_buckets}

    print("HELLO: workflow_tags_nested=", workflow_tags_nested)
    
    atp_ids = {
        "file_workflow": get_atp_ids(file_workflow_root_ids),
        "reference_classification": get_atp_ids(reference_classification_root_ids),
        "entity_extraction": get_atp_ids(entity_extraction_root_ids),
        "manual_indexing": get_atp_ids(manual_indexing_root_ids)
    }
    
    # Aggregate counts for each expected tag across allowed mods.
    # The result for each category will be a single bucket per term that sums counts from allowed mods.
    grouped_workflow_tags = {category: {} for category in atp_ids}
    for category, id_list in atp_ids.items():
        for mod, bucket_lookup in mod_bucket_lookup.items():
            # Only include mods that are in the allowed list.
            if mod.upper() not in wft_mod_abbreviation:
                continue
            for expected_id in id_list:
                expected_upper = expected_id.upper()
                if expected_upper in bucket_lookup:
                    bucket = bucket_lookup[expected_upper]
                    # Use reverse_nested count if available; otherwise, use the raw doc_count.
                    count = bucket.get("reverse_docs", {}).get("doc_count", bucket["doc_count"])
                    # Sum the count for the expected term.
                    if expected_upper not in grouped_workflow_tags[category]:
                        grouped_workflow_tags[category][expected_upper] = {
                            "key": expected_upper,
                            "doc_count": 0,
                            "name": bucket.get("name", expected_upper)
                        }
                    grouped_workflow_tags[category][expected_upper]["doc_count"] += count

    # Convert the aggregated counts to the final output format.
    for category, buckets_dict in grouped_workflow_tags.items():
        buckets_list = list(buckets_dict.values())
        filtered_buckets = [
            b for b in buckets_list
            if b.get("reverse_docs", {}).get("doc_count", b["doc_count"]) > 0
        ]
        sorted_buckets = sorted(
            filtered_buckets,
            key=lambda x: x.get("reverse_docs", {}).get("doc_count", x["doc_count"]),
            reverse=True
        )
        aggregated_result = {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": sorted_buckets
        }
        # Add CURIEs to the bucket names
        add_curie_to_name_values(aggregated_result)
        res['aggregations'][category] = aggregated_result

    # remove the old "workflow_tags" aggregation key.
    res['aggregations'].pop("workflow_tags.workflow_tag_id.keyword", None)
    
    return {
        "hits": hits,
        "aggregations": res['aggregations'],
        "return_count": res["hits"]["total"]["value"]
    }


def remap_highlights(highlights):  # pragma: no cover

    remapped = {}
    for key, value in highlights.items():
        new_key = key.replace('authors.name', 'authors')
        remapped[new_key] = value
    return remapped


def extract_tet_aggregation_data(res: Dict[str, Any], main_key: str, data_key: str) -> Dict[str, Any]:
    main_agg = res['aggregations'].get(main_key, {})
    if main_agg.get('filter_by_other_tet_values'):
        return main_agg.get('filter_by_other_tet_values', {}).get(data_key, {})
    return main_agg.get(data_key, {})


def add_tet_facets_values(es_body, tet_nested_facets_values, apply_to_single_tet):  # pragma: no cover
    tet_facet_values = defaultdict(list)
    for facet_name_value_dict in tet_nested_facets_values.get("tet_facets_values", []):
        add_nested_query(es_body, facet_name_value_dict)
        if apply_to_single_tet:
            for facet_name, facet_value in facet_name_value_dict.items():
                tet_facet_values[facet_name.replace("topic_entity_tags.", "").replace(".keyword", "")] = facet_value
    return tet_facet_values

    
def add_nested_query(es_body, facet_name_values_dict):  # pragma: no cover

    must_conditions = [{"term": {facet_name: facet_values}} for facet_name, facet_values in
                       facet_name_values_dict.items()]
    
    nested_query = {
        "nested": {
            "path": "topic_entity_tags",
            "query": {
                "bool": {
                    "must": must_conditions
                }
            }
        }
    }
    es_body["query"]["bool"]["filter"]["bool"]["must"].append(nested_query)


def create_filtered_aggregation(path, tet_facets, term_field, term_key, size=10):  # pragma: no cover

    tet_agg = {
        "nested": {
            "path": path
        }
    }
    if tet_facets:
        tet_agg["aggs"] = {
            "filter_by_other_tet_values": {
                "filter": {
                    "bool": {
                        "must": [
                            {"term": {f"topic_entity_tags.{filter_field}.keyword": filter_value}}
                            for filter_field, filter_value in tet_facets.items()
                        ]
                    }
                },
                "aggs": {
                    term_key: {
                        "terms": {
                            "field": term_field,
                            "size": size
                        },
                        "aggs": {
                            # reverse nesting to count documents
                            "docs_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    else:
        tet_agg["aggs"] = {
            term_key: {
                "terms": {
                    "field": term_field,
                    "size": size
                },
                "aggs": {
                    # reverse nesting to count documents
                    "docs_count": {
                        "reverse_nested": {}
                    }
                }
            }
        }
    return tet_agg

    
def apply_all_tags_tet_aggregations(es_body, tet_facets, facets_limits):  # pragma: no cover

    es_body["aggregations"]["topic_aggregation"] = create_filtered_aggregation(
        path="topic_entity_tags",
        tet_facets=tet_facets,
        term_field="topic_entity_tags.topic.keyword",
        term_key="topics",
        size=facets_limits.get("topics", 10)
    )
    es_body["aggregations"]["confidence_aggregation"] = create_filtered_aggregation(
        path="topic_entity_tags",
        tet_facets=tet_facets,
        term_field="topic_entity_tags.confidence_level.keyword",
        term_key="confidence_levels",
        size=facets_limits.get("confidence_levels", 10)
    )
    es_body["aggregations"]["source_method_aggregation"] = create_filtered_aggregation(
        path="topic_entity_tags",
        tet_facets=tet_facets,
        term_field="topic_entity_tags.source_method.keyword",
        term_key="source_methods",
        size=facets_limits.get("source_methods", 10)
    )
    es_body["aggregations"]["source_evidence_assertion_aggregation"] = create_filtered_aggregation(
        path="topic_entity_tags",
        tet_facets=tet_facets,
        term_field="topic_entity_tags.source_evidence_assertion.keyword",
        term_key="source_evidence_assertions",
        size=facets_limits.get("source_evidence_assertions", 10) 
    )


def ensure_structure(es_body):

    if "query" not in es_body:
        es_body["query"] = {}
    if "bool" not in es_body["query"]:
        es_body["query"]["bool"] = {}
    if "filter" not in es_body["query"]["bool"]:
        es_body["query"]["bool"]["filter"] = {"bool": {}}
    if "must" not in es_body["query"]["bool"]["filter"]["bool"]:
        es_body["query"]["bool"]["filter"]["bool"]["must"] = []


def add_curie_to_name_values(aggregations):

    curie_keys = [
        bucket["key"] for bucket in aggregations.get("buckets", [])
    ]
    curie_to_name_map = get_map_ateam_curies_to_names(
        category="atpterm",
        curies=[curie_key.upper() for curie_key in curie_keys if curie_key.upper().startswith("ATP:")]
    )
    curie_to_name_map.update(get_map_ateam_curies_to_names(
        category="ecoterm",
        curies=[curie_key.upper() for curie_key in curie_keys if curie_key.upper().startswith("ECO:")]
    ))

    # iterate over the buckets and add names
    for bucket in aggregations.get("buckets", []):
        curie_name = curie_to_name_map.get(bucket["key"].upper(), "Unknown")
        bucket["name"] = curie_name


def get_atp_ids(root_atp_ids):
    return [child for root_atp_id in root_atp_ids for child in atp_get_all_descendents(root_atp_id)]

    

