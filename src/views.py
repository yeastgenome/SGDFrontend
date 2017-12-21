from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk, HTTPNotFound
from pyramid.response import Response, FileResponse
from pyramid.view import view_config
from pyramid.compat import escape
from sqlalchemy import func, distinct, and_, or_
from sqlalchemy.orm.exc import DetachedInstanceError
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
from primer3.bindings import designPrimers

import os
import re
import transaction
import traceback
import datetime
import logging
import json

from .models import DBSession, ESearch, Colleague, Dbentity, Edam, Referencedbentity, ReferenceFile, Referenceauthor, FileKeyword, Keyword, Referencedocument, Chebi, ChebiUrl, PhenotypeannotationCond, Phenotypeannotation, Reservedname, Straindbentity, Literatureannotation, Phenotype, Apo, Go, Referencetriage, Referencedeleted, Locusdbentity, Dataset, DatasetKeyword, Contig, Proteindomain, Ec, Dnasequenceannotation, Straindbentity
from .helpers import extract_id_request, link_references_to_file, link_keywords_to_file, FILE_EXTENSIONS, get_locus_by_id, get_go_by_id
from .search_helpers import build_autocomplete_search_body_request, format_autocomplete_results, build_search_query, build_es_search_body_request, build_es_aggregation_body_request, format_search_results, format_aggregation_results, build_sequence_objects_search_query

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.ERROR)
log = logging.getLogger()

ES_INDEX_NAME = os.environ.get('ES_INDEX_NAME', 'searchable_items_aws')

@view_config(route_name='home', request_method='GET', renderer='home.jinja2')
def home_view(request):
    return {
        'google_client_id': os.environ['GOOGLE_CLIENT_ID'],
        'pusher_key': os.environ['PUSHER_KEY']
    }
@view_config(route_name='autocomplete_results', renderer='json', request_method='GET')
def search_autocomplete(request):
    query = request.params.get('q', '')
    category = request.params.get('category', '')
    field = request.params.get('field', 'name')

    if query == '':
        return {
            "results": None
        }

    autocomplete_results = ESearch.search(
        index=ES_INDEX_NAME,
        body=build_autocomplete_search_body_request(query, category, field)
    )

    return {
        "results": format_autocomplete_results(autocomplete_results, field)
    }

@view_config(route_name='search', renderer='json', request_method='GET')
def search(request):

    query = request.params.get('q', '')
    limit = int(request.params.get('limit', 10))
    offset = int(request.params.get('offset', 0))
    category = request.params.get('category', '')
    sort_by = request.params.get('sort_by', '')

    # subcategory filters. Map: (request GET param name from frontend, ElasticSearch field name)
    category_filters = {
        "locus": [('feature type', 'feature_type'), ('molecular function', 'molecular_function'), ('phenotype', 'phenotypes'), ('cellular component', 'cellular_component'), ('biological process', 'biological_process'), ('status', 'status')],
        "phenotype": [("observable", "observable"), ("qualifier", "qualifier"), ("references", "references"), ("phenotype_locus", "phenotype_loci"), ("chemical", "chemical"), ("mutant_type", "mutant_type")],
        "biological_process": [("go_locus", "go_loci")],
        "cellular_component": [("go_locus", "go_loci")],
        "molecular_function": [("go_locus", "go_loci")],
        "reference": [("author", "author"), ("journal", "journal"), ("year", "year"), ("reference_locus", "reference_loci")],
        "contig": [("strain", "strain")],
        "colleague": [("last_name", "last_name"), ("position", "position"), ("institution", "institution"), ("country", "country"), ("keywords", "keywords"), ("colleague_loci", "colleague_loci")]
    }

    search_fields = ["name", "description", "first_name", "last_name", "institution", "colleague_loci", "feature_type", "name_description", "summary", "phenotypes", "cellular_component", "biological_process", "molecular_function", "ec_number", "protein", "tc_number", "secondary_sgdid", "sequence_history", "gene_history", "observable", "qualifier", "references", "phenotype_loci", "chemical", "mutant_type", "synonyms", "go_id", "go_loci", "author", "journal", "reference_loci","aliases", "status"] # year not inserted, have to change to str in mapping

    json_response_fields = ['name', 'href', 'description', 'category', 'bioentity_id', 'phenotype_loci', 'go_loci', 'reference_loci','aliases','year']

    args = {}

    for key in request.params.keys():
        args[key] = request.params.getall(key)

    es_query = build_search_query(query, search_fields, category,
                                  category_filters, args)

    search_body = build_es_search_body_request(query,
                                               category,
                                               es_query,
                                               json_response_fields,
                                               search_fields,
                                               sort_by)
    search_results = ESearch.search(
        index=ES_INDEX_NAME,
        body=search_body,
        size=limit,
        from_=offset,
        preference='p_'+query
    )

    if search_results['hits']['total'] == 0:
        return {
            'total': 0,
            'results': [],
            'aggregations': []
        }
    
    aggregation_body = build_es_aggregation_body_request(
        es_query,
        category,
        category_filters
    )

    aggregation_results = ESearch.search(
        index=ES_INDEX_NAME,
        body=aggregation_body,
        preference='p_'+query
    )
   
    return {
        'total': search_results['hits']['total'],
        'results': format_search_results(search_results, json_response_fields, query),
        'aggregations': format_aggregation_results(
            aggregation_results,
            category,
            category_filters
        )
    }

@view_config(route_name='formats', renderer='json', request_method='GET')
def formats(request):
    formats_db = DBSession.query(Edam).filter(Edam.edam_namespace == 'format').all()
    return {'options': [f.to_dict() for f in formats_db]}

@view_config(route_name='topics', renderer='json', request_method='GET')
def topics(request):
    topics_db = DBSession.query(Edam).filter(Edam.edam_namespace == 'topic').all()
    return {'options': [t.to_dict() for t in topics_db]}

@view_config(route_name='extensions', renderer='json', request_method='GET')
def extensions(request):
    return {'options': [{'id': e, 'name': e} for e in FILE_EXTENSIONS]}

@view_config(route_name='reference_this_week', renderer='json', request_method='GET')
def reference_this_week(request):
    start_date = datetime.datetime.today() - datetime.timedelta(days=30)
    end_date = datetime.datetime.today()

    recent_literature = DBSession.query(Referencedbentity).filter(Referencedbentity.date_created >= start_date).order_by(Referencedbentity.date_created.desc()).all()

    refs = [x.to_dict_citation() for x in recent_literature]
    return {
        'start': start_date.strftime("%Y-%m-%d"),
        'end': end_date.strftime("%Y-%m-%d"),
        'references': refs
    }

@view_config(route_name='reference_list', renderer='json', request_method='POST')
def reference_list(request):
    reference_ids = request.POST.get('reference_ids', request.json_body.get('reference_ids', None))

    if reference_ids is None or len(reference_ids) == 0:
        return HTTPBadRequest(body=json.dumps({'error': "No reference_ids sent. JSON object expected: {\"reference_ids\": [\"id_1\", \"id_2\", ...]}"}))
    else:
        try:
            reference_ids = [int(r) for r in reference_ids]
            references = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reference_ids)).all()

            if len(references) == 0:
                return HTTPNotFound(body=json.dumps({'error': "Reference_ids do not exist."}))

            return [r.to_bibentry() for r in references]
        except ValueError:
            return HTTPBadRequest(body=json.dumps({'error': "IDs must be string format of integers. Example JSON object expected: {\"reference_ids\": [\"1\", \"2\"]}"}))

@view_config(route_name='search_sequence_objects', request_method='GET')
def search_sequence_objects(request):
    query = request.params.get('query', '').lower()
    offset = request.params.get('offset', 0)
    limit = request.params.get('limit', 1000)

    search_body = build_sequence_objects_search_query(query)

    res = ESearch.search(index=request.registry.settings['elasticsearch.variant_viewer_index'], body=search_body, size=limit, from_=offset)

    simple_hits = []
    for hit in res['hits']['hits']:
        simple_hits.append(hit['_source'])

    formatted_response = {
        'loci': simple_hits,
        'total': res['hits']['total'],
        'offset': offset
    }

    return Response(body=json.dumps(formatted_response), content_type='application/json')

@view_config(route_name='get_sequence_object', renderer='json', request_method='GET')
def get_sequence_object(request):
    id = request.matchdict['id'].upper()

    return ESearch.get(index=request.registry.settings['elasticsearch.variant_viewer_index'], id=id)['_source']

@view_config(route_name='reserved_name', renderer='json', request_method='GET')
def reserved_name(request):
    id = extract_id_request(request, "reservedname")

    reserved_name = DBSession.query(Reservedname).filter_by(reservedname_id=id).one_or_none()

    if reserved_name:
        return reserved_name.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='strain', renderer='json', request_method='GET')
def strain(request):
    id = extract_id_request(request, 'strain')

    strain = DBSession.query(Straindbentity).filter_by(dbentity_id=id).one_or_none()

    if strain:
        return strain.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference', renderer='json', request_method='GET')
def reference(request):
    id = extract_id_request(request, 'reference', 'id', True)
    # allow reference to be accessed by sgdid even if not in disambig table
    if id:
        reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
    else:
        reference = DBSession.query(Referencedbentity).filter_by(sgdid=request.matchdict['id']).one_or_none()

    if reference:
        return reference.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_literature_details', renderer='json', request_method='GET')
def reference_literature_details(request):
    id = extract_id_request(request, 'reference', 'id', True)
    # allow reference to be accessed by sgdid even if not in disambig table
    if id:
        reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()
    else:
        reference = DBSession.query(Referencedbentity).filter_by(sgdid=request.matchdict['id']).one_or_none()

    if reference:
        return reference.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_interaction_details', renderer='json', request_method='GET')
def reference_interaction_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

    if reference:
        return reference.interactions_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_go_details', renderer='json', request_method='GET')
def reference_go_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

    if reference:
        return reference.go_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_phenotype_details', renderer='json', request_method='GET')
def reference_phenotype_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

    if reference:
        return reference.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='reference_regulation_details', renderer='json', request_method='GET')
def reference_regulation_details(request):
    id = extract_id_request(request, 'reference')
    reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=id).one_or_none()

    if reference:
        return reference.regulation_to_dict()
    else:
        return HTTPNotFound()
@view_config(route_name='author', renderer='json', request_method='GET')
def author(request):
    format_name = extract_id_request(request, 'author', param_name="format_name")

    key = "/author/" + format_name

    authors_ref = DBSession.query(Referenceauthor).filter_by(obj_url=key).all()

    references_dict = sorted([author_ref.reference.to_dict_reference_related() for author_ref in authors_ref], key=lambda r: r["display_name"])

    if len(authors_ref) > 0:
        return {
            "display_name": authors_ref[0].display_name,
            "references": sorted(references_dict, key=lambda r: r["year"], reverse=True)
        }
    else:
        return HTTPNotFound()

@view_config(route_name='chemical', renderer='json', request_method='GET')
def chemical(request):
    id = extract_id_request(request, 'chebi', param_name="format_name")
    chebi = DBSession.query(Chebi).filter_by(chebi_id=id).one_or_none()
    if chebi:
        return chebi.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='chemical_phenotype_details', renderer='json', request_method='GET')
def chemical_phenotype_details(request):
    id = extract_id_request(request, 'chebi')

    chebi = DBSession.query(Chebi).filter_by(chebi_id=id).one_or_none()
    if chebi:
        return chebi.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='phenotype', renderer='json', request_method='GET')
def phenotype(request):
    id = extract_id_request(request, 'phenotype', param_name="format_name")
    phenotype = DBSession.query(Phenotype).filter_by(phenotype_id=id).one_or_none()
    if phenotype:
        return phenotype.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='phenotype_locus_details', renderer='json', request_method='GET')
def phenotype_locus_details(request):
    id = extract_id_request(request, 'phenotype')
    phenotype = DBSession.query(Phenotype).filter_by(phenotype_id=id).one_or_none()
    if phenotype:
        return phenotype.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable', renderer='json', request_method='GET')
def observable(request):
    if request.matchdict['format_name'].upper() == "YPO": # /ontology/phenotype/ypo -> root of APOs
        return Apo.root_to_dict()

    id = extract_id_request(request, 'apo', param_name="format_name")
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_locus_details', renderer='json', request_method='GET')
def observable_locus_details(request):
    id = extract_id_request(request, 'apo')
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_ontology_graph', renderer='json', request_method='GET')
def observable_ontology_graph(request):
    id = extract_id_request(request, 'apo')
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.ontology_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='observable_locus_details_all', renderer='json', request_method='GET')
def observable_locus_details_all(request):
    id = extract_id_request(request, 'apo')
    observable = DBSession.query(Apo).filter_by(apo_id=id).one_or_none()
    if observable:
        return observable.annotations_and_children_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go', renderer='json', request_method='GET')
def go(request):
    id = extract_id_request(request, 'go', param_name="format_name")
    go = get_go_by_id(id)
    if go:
        return go.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go_ontology_graph', renderer='json', request_method='GET')
def go_ontology_graph(request):
    id = extract_id_request(request, 'go')
    go = get_go_by_id(id)
    if go:
        return go.ontology_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='go_locus_details', renderer='json', request_method='GET')
def go_locus_details(request):
    id = extract_id_request(request, 'go')
    go = get_go_by_id(id)
    if go:
        return go.annotations_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='go_locus_details_all', renderer='json', request_method='GET')
def go_locus_details_all(request):
    id = extract_id_request(request, 'go')
    go = get_go_by_id(id)
    if go:
        return go.annotations_and_children_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus', renderer='json', request_method='GET')
def locus(request):
    id = extract_id_request(request, 'locus', param_name="sgdid")
    locus = get_locus_by_id(id)
    if locus:
        return locus.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_tabs', renderer='json', request_method='GET')
def locus_tabs(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.tabs()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_phenotype_details', renderer='json', request_method='GET')
def locus_phenotype_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.phenotype_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_phenotype_graph', renderer='json', request_method='GET')
def locus_phenotype_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.phenotype_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_go_graph', renderer='json', request_method='GET')
def locus_go_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.go_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_expression_graph', renderer='json', request_method='GET')
def locus_expression_graph(request):
    # TEMP disable
    return {
        'nodes': [],
        'edges': []
    }
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.expression_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_literature_details', renderer='json', request_method='GET')
def locus_literature_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.literature_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_literature_graph', renderer='json', request_method='GET')
def locus_literature_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.literature_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_interaction_graph', renderer='json', request_method='GET')
def locus_interaction_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.interaction_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_regulation_graph', renderer='json', request_method='GET')
def locus_regulation_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.regulation_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_go_details', renderer='json', request_method='GET')
def locus_go_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.go_to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_interaction_details', renderer='json', request_method='GET')
def locus_interaction_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.interactions_to_dict()
    else:
        return HTTPNotFound()

# TEMP disable
# @view_config(route_name='locus_expression_details', renderer='json', request_method='GET')
# def locus_expression_details(request):
#     id = extract_id_request(request, 'locus')
#     locus = get_locus_by_id(id)
#     if locus:
#         return locus.expression_to_dict()
#     else:
#         return HTTPNotFound()

@view_config(route_name='locus_neighbor_sequence_details', renderer='json', request_method='GET')
def locus_neighbor_sequence_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.neighbor_sequence_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_sequence_details', renderer='json', request_method='GET')
def locus_sequence_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.sequence_details()
    else:
        return HTTPNotFound()

@view_config(route_name='bioentity_list', renderer='json', request_method='POST')
def analyze(request):
    try:
        data = request.json
    except ValueError:
        return HTTPBadRequest(body=json.dumps({'error': 'Invalid JSON format in body request'}))

    if "bioent_ids" not in data:
        return HTTPBadRequest(body=json.dumps({'error': 'Key \"bioent_ids\" missing'}))

    loci = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(data['bioent_ids'])).all()

    return [locus.to_dict_analyze() for locus in loci]

@view_config(route_name='dataset', renderer='json', request_method='GET')
def dataset(request):
    id = extract_id_request(request, 'dataset')

    dataset = DBSession.query(Dataset).filter_by(dataset_id=id).one_or_none()
    if dataset:
        return dataset.to_dict(add_conditions=True, add_resources=True)
    else:
        return HTTPNotFound()

@view_config(route_name='keyword', renderer='json', request_method='GET')
def keyword(request):
    id = extract_id_request(request, 'keyword')

    keyword = DBSession.query(Keyword).filter_by(keyword_id=id).one_or_none()
    if keyword:
        return keyword.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='keywords', renderer='json', request_method='GET')
def keywords(request):
    keyword_ids = DBSession.query(distinct(DatasetKeyword.keyword_id)).all()

    keywords = DBSession.query(Keyword).filter(Keyword.keyword_id.in_(keyword_ids)).all()
    simple_keywords = [k.to_simple_dict() for k in keywords]
    for k in simple_keywords:
        k['name'] = k['display_name']
    return simple_keywords

@view_config(route_name='contig', renderer='json', request_method='GET')
def contig(request):
    id = extract_id_request(request, 'contig', param_name="format_name")

    contig = DBSession.query(Contig).filter_by(contig_id=id).one_or_none()
    if contig:
        return contig.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='contig_sequence_details', renderer='json', request_method='GET')
def contig_sequence_details(request):
    id = extract_id_request(request, 'contig')

    contig = DBSession.query(Contig).filter_by(contig_id=id).one_or_none()
    if contig:
        return contig.sequence_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_posttranslational_details', renderer='json', request_method='GET')
def locus_posttranslational_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.posttranslational_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_ecnumber_details', renderer='json', request_method='GET')
def locus_ecnumber_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.ecnumber_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_protein_experiment_details', renderer='json', request_method='GET')
def locus_protein_experiment_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.protein_experiment_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_protein_domain_details', renderer='json', request_method='GET')
def locus_protein_domain_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.protein_domain_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_binding_site_details', renderer='json', request_method='GET')
def locus_binding_site_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.binding_site_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_regulation_details', renderer='json', request_method='GET')
def locus_regulation_details(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)

    if locus:
        return locus.regulation_details()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_regulation_target_enrichment', renderer='json', request_method='GET')
def locus_regulation_target_enrichment(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.regulation_target_enrichment()
    else:
        return HTTPNotFound()

@view_config(route_name='locus_protein_domain_graph', renderer='json', request_method='GET')
def locus_protein_domain_graph(request):
    id = extract_id_request(request, 'locus')
    locus = get_locus_by_id(id)
    if locus:
        return locus.protein_domain_graph()
    else:
        return HTTPNotFound()

@view_config(route_name='domain', renderer='json', request_method='GET')
def domain(request):
    id = extract_id_request(request, 'proteindomain', param_name="format_name")

    proteindomain = DBSession.query(Proteindomain).filter_by(proteindomain_id=id).one_or_none()
    if proteindomain:
        return proteindomain.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='domain_locus_details', renderer='json', request_method='GET')
def domain_locus_details(request):
    id = extract_id_request(request, 'proteindomain')

    proteindomain = DBSession.query(Proteindomain).filter_by(proteindomain_id=id).one_or_none()
    if proteindomain:
        return proteindomain.locus_details()
    else:
        return HTTPNotFound()

@view_config(route_name='domain_enrichment', renderer='json', request_method='GET')
def domain_enrichment(request):
    id = extract_id_request(request, 'proteindomain')

    proteindomain = DBSession.query(Proteindomain).filter_by(proteindomain_id=id).one_or_none()
    if proteindomain:
        return proteindomain.enrichment()
    else:
        return HTTPNotFound()

@view_config(route_name='ecnumber', renderer='json', request_method='GET')
def ecnumber(request):
    id = extract_id_request(request, 'ec')

    ec = DBSession.query(Ec).filter_by(ec_id=id).one_or_none()

    if ec:
        return ec.to_dict()
    else:
        return HTTPNotFound()

@view_config(route_name='primer3', renderer='json', request_method='GET')
def primer3(request):
    p_keys = request.params.keys()
    if 'sequence' in p_keys:
        sequence = str(request.params.get('sequence'))
    elif 'gene_name' in p_keys:
        gene_name = request.params.get('gene_name')
        locus = DBSession.query(Locusdbentity).filter(or_(Locusdbentity.gene_name == gene_name.upper(),Locusdbentity.systematic_name == gene_name)).one_or_none()
        tax_id = DBSession.query(Straindbentity.taxonomy_id).filter(Straindbentity.strain_type =='Reference').one_or_none()
        dna = DBSession.query(Dnasequenceannotation.residues).filter(and_(Dnasequenceannotation.taxonomy_id == tax_id, Dnasequenceannotation.dbentity_id == locus.dbentity_id, Dnasequenceannotation.dna_type =='GENOMIC')).one_or_none()[0]
        sequence = str(dna)
    else:
        return HTTPBadRequest('No sequence provided')

    result = designPrimers(
        {
            'SEQUENCE_ID': 'MH1000',
            'SEQUENCE_TEMPLATE': sequence
        },
        {
        'PRIMER_OPT_SIZE': 20,
        'PRIMER_PICK_INTERNAL_OLIGO': 1,
        'PRIMER_INTERNAL_MAX_SELF_END': 8,
        'PRIMER_MIN_SIZE': 18,
        'PRIMER_MAX_SIZE': 25,
        'PRIMER_OPT_TM': 60.0,
        'PRIMER_MIN_TM': 57.0,
        'PRIMER_MAX_TM': 63.0,
        'PRIMER_MIN_GC': 20.0,
        'PRIMER_MAX_GC': 80.0,
        'PRIMER_MAX_POLY_X': 100,
        'PRIMER_INTERNAL_MAX_POLY_X': 100,
        'PRIMER_SALT_MONOVALENT': 50.0,
        'PRIMER_DNA_CONC': 50.0,
        'PRIMER_MAX_NS_ACCEPTED': 0,
        'PRIMER_MAX_SELF_ANY': 12,
        'PRIMER_MAX_SELF_END': 8,
        'PRIMER_PAIR_MAX_COMPL_ANY': 12,
        'PRIMER_PAIR_MAX_COMPL_END': 8,
        'PRIMER_PRODUCT_SIZE_RANGE': [[75, 100], [100, 125], [125, 150],
                                      [150, 175], [175, 200], [200, 225]],
        })
    return result

@view_config(route_name='ecnumber_locus_details', renderer='json', request_method='GET')
def ecnumber_locus_details(request):
    id = extract_id_request(request, 'ec')

    ec = DBSession.query(Ec).filter_by(ec_id=id).one_or_none()

    if ec:
        return ec.locus_details()
    else:
        return HTTPNotFound()

# check for basic rad54 response
@view_config(route_name='healthcheck', renderer='json', request_method='GET')
def healthcheck(request):
    MAX_QUERY_ATTEMPTS = 3
    attempts = 0
    ldict = None
    while attempts < MAX_QUERY_ATTEMPTS:
        try:
            locus = get_locus_by_id(1268789)
            ldict = locus.to_dict()
            break
        except DetachedInstanceError:
            traceback.print_exc()
            log.info('DB session closed from detached instance state.')
            DBSession.remove()
            attempts += 1
        except IntegrityError:
            traceback.print_exc()
            log.info('DB rolled back from integrity error.')
            DBSession.rollback()
            DBSession.remove()
            attempts += 1
    return ldict