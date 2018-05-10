from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Locusdbentity, Filedbentity, FileKeyword, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
from elasticsearch import Elasticsearch
from mapping import mapping
import os
import requests
from threading import Thread
import json
import collections
from index_es_helpers import IndexESHelper
import concurrent.futures
import uuid


engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = os.environ.get('ES_INDEX_NAME', 'searchable_items_aws')
DOC_TYPE = 'searchable_item'
ES_URI = os.environ['WRITE_ES_URI']
es = Elasticsearch(ES_URI, retry_on_timeout=True)



def delete_mapping():
    print("Deleting mapping...")
    response = requests.delete(ES_URI + INDEX_NAME + "/")
    if response.status_code != 200:
        print("ERROR: " + str(response.json()))
    else:
        print("SUCCESS")


def put_mapping():
    print("Putting mapping... ")
    response = requests.put(ES_URI + INDEX_NAME + "/", json=mapping)
    if response.status_code != 200:
        print("ERROR: " + str(response.json()))
    else:
        print("SUCCESS")


def index_toolbar_links():
    links = [
        ("Gene List", "https://yeastmine.yeastgenome.org/yeastmine/bag.do",
         []), ("Yeastmine", "https://yeastmine.yeastgenome.org",
               'yeastmine'), ("Submit Data", "/cgi-bin/submitData.pl",
                              []), ("SPELL", "https://spell.yeastgenome.org",
                                    'spell'), ("BLAST", "/blast-sgd", 'blast'),
        ("Fungal BLAST", "/blast-fungal",
         'blast'), ("Pattern Matching", "/nph-patmatch",
                    []), ("Design Primers", "/cgi-bin/web-primer", []),
        ("Restriction Mapper", "/cgi-bin/PATMATCH/RestrictionMapper",
         []), ("Genome Browser", "/browse",
                             []), ("Gene/Sequence Resources",
                                   "/cgi-bin/seqTools", []),
        ("Download Genome",
         "https://downloads.yeastgenome.org/sequence/S288C_reference/genome_releases/",
         'download'), ("Genome Snapshot", "/genomesnapshot",
                       []), ("Chromosome History",
                             "/cgi-bin/chromosomeHistory.pl", []),
        ("Systematic Sequencing Table", "/cache/chromosomes.shtml",
         []), ("Original Sequence Papers",
               "http://wiki.yeastgenome.org/index.php/Original_Sequence_Papers",
               []), ("Variant Viewer", "/variant-viewer",
                     []), ("Align Strain Sequences",
                           "/cgi-bin/FUNGI/alignment.pl", []),
        ("Synteny Viewer", "/cgi-bin/FUNGI/FungiMap",
         []), ("Fungal Alignment", "/cgi-bin/FUNGI/showAlign",
               []), ("PDB Search", "/cgi-bin/protein/get3d",
                     'pdb'), ("GO Term Finder", "/cgi-bin/GO/goTermFinder.pl",
                              'go'), ("GO Slim Mapper",
                                      "/cgi-bin/GO/goSlimMapper.pl", 'go'),
        ("GO Slim Mapping File",
         "https://downloads.yeastgenome.org/curation/literature/go_slim_mapping.tab",
         'go'), ("Expression", "https://spell.yeastgenome.org/#",
                 []), ("Biochemical Pathways",
                       "http://pathway.yeastgenome.org/",
                       []), ("Browse All Phenotypes", "/ontology/phenotype/ypo",
                             []), ("Interactions", "/interaction-search", []),
        ("YeastGFP", "https://yeastgfp.yeastgenome.org/",
         'yeastgfp'), ("Full-text Search", "http://textpresso.yeastgenome.org/",
                       'texxtpresso'), ("New Yeast Papers", "/reference/recent",
                                        []),
        ("Genome-wide Analysis Papers", "/cache/genome-wide-analysis.html",
         []), ("Find a Colleague", "/cgi-bin/colleague/colleagueInfoSearch",
               []), ("Add or Update Info", "/cgi-bin/colleague/colleagueSearch",
                     []), ("Find a Yeast Lab", "/cache/yeastLabs.html", []),
        ("Career Resources",
         "http://wiki.yeastgenome.org/index.php/Career_Resources", []),
        ("Future",
         "http://wiki.yeastgenome.org/index.php/Meetings#Upcoming_Conferences_.26_Courses",
         []),
        ("Yeast Genetics",
         "http://wiki.yeastgenome.org/index.php/Meetings#Past_Yeast_Meetings",
         []), ("Submit a Gene Registration", "/cgi-bin/registry/geneRegistry",
               []), ("Gene Registry", "/help/community/gene-registry",
                     []), ("Nomenclature Conventions",
                           "/help/community/nomenclature-conventions", []),
        ("Global Gene Hunter", "/cgi-bin/geneHunter",
         []), ("Strains and Constructs",
               "http://wiki.yeastgenome.org/index.php/Strains",
               []), ("Reagents",
                     "http://wiki.yeastgenome.org/index.php/Reagents",
                     []), ("Protocols and Methods",
                           "http://wiki.yeastgenome.org/index.php/Methods", []),
        ("Physical & Genetic Maps",
         "http://wiki.yeastgenome.org/index.php/Combined_Physical_and_Genetic_Maps_of_S._cerevisiae",
         []),
        ("Genetic Maps",
         "http://wiki.yeastgenome.org/index.php/Yeast_Mortimer_Maps_-_Edition_12",
         []),
        ("Sequence",
         "http://wiki.yeastgenome.org/index.php/Historical_Systematic_Sequence_Information",
         []), ("Wiki", "http://wiki.yeastgenome.org/index.php/Main_Page",
               'wiki'), ("Resources",
                         "http://wiki.yeastgenome.org/index.php/External_Links",
                         [])
    ]

    print('Indexing ' + str(len(links)) + ' toolbar links')

    for l in links:
        obj = {
            'name': l[0],
            'href': l[1],
            'description': None,
            'category': 'resource',
            'keys': l[2]
        }
        es.index(index=INDEX_NAME, doc_type=DOC_TYPE, body=obj, id=l[1])


def index_colleagues():
    colleagues = DBSession.query(Colleague).all()
    _locus_ids = IndexESHelper.get_colleague_locus()
    _locus_names = IndexESHelper.get_colleague_locusdbentity()
    _combined_list = IndexESHelper.combine_locusdbentity_colleague(
        colleagues, _locus_names, _locus_ids)
    print("Indexing " + str(len(colleagues)) + " colleagues")
    bulk_data = []
    for item_k, item_v in _combined_list.items():
        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })

        bulk_data.append(item_v)
        if len(bulk_data) == 1000:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []
    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)




def index_genes():
    # Indexing just the S228C genes
    # dbentity: 1364643 (id) -> straindbentity -> 274901 (taxonomy_id)
    # list of dbentities comes from table DNASequenceAnnotation with taxonomy_id 274901
    # feature_type comes from DNASequenceAnnotation as well
    gene_ids_so = DBSession.query(
        Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(
            Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    # add some non S288C genes
    not_s288c = DBSession.query(Locusdbentity.dbentity_id).filter(
        Locusdbentity.not_in_s288c == True).all()
    for id in not_s288c:
        dbentity_ids.add(id[0])
        # assume non S288C features to be ORFs
        dbentity_ids_to_so[id[0]] = 263757
    all_genes = DBSession.query(Locusdbentity).filter(
        Locusdbentity.dbentity_id.in_(list(dbentity_ids))).all()

    # make list of merged/deleted genes so they don't redirect when they show up as an alias
    merged_deleted_r = DBSession.query(Locusdbentity.format_name).filter(
        Locusdbentity.dbentity_status.in_(['Merged', 'Deleted'])).all()
    merged_deleted = [d[0] for d in merged_deleted_r]

    feature_types_db = DBSession.query(
        So.so_id, So.display_name).filter(So.so_id.in_(list(so_ids))).all()
    feature_types = {}
    for ft in feature_types_db:
        feature_types[ft[0]] = ft[1]

    tc_numbers_db = DBSession.query(LocusAlias).filter_by(
        alias_type="TC number").all()
    tc_numbers = {}
    for tc in tc_numbers_db:
        if tc.locus_id in tc_numbers:
            tc_numbers[tc.locus_id].append(tc.display_name)
        else:
            tc_numbers[tc.locus_id] = [tc.display_name]

    ec_numbers_db = DBSession.query(LocusAlias).filter_by(
        alias_type="EC number").all()
    ec_numbers = {}
    for ec in ec_numbers_db:
        if ec.locus_id in ec_numbers:
            ec_numbers[ec.locus_id].append(ec.display_name)
        else:
            ec_numbers[ec.locus_id] = [ec.display_name]

    secondary_db = DBSession.query(LocusAlias).filter_by(
        alias_type="SGDID Secondary").all()
    secondary_sgdids = {}

    for sid in secondary_db:
        if sid.locus_id in secondary_sgdids:
            secondary_sgdids[sid.locus_id].append(sid.display_name)
        else:
            secondary_sgdids[sid.locus_id] = [sid.display_name]

    bulk_data = []

    print('Indexing ' + str(len(all_genes)) + ' genes')
    ##### test newer methods ##########
    _summary = IndexESHelper.get_locus_dbentity_summary()
    _protein = IndexESHelper.get_locus_dbentity_alias(["NCBI protein name"])
    _phenos = IndexESHelper.get_locus_phenotypeannotation()
    _goids = IndexESHelper.get_locus_go_annotation()
    _aliases_raw = IndexESHelper.get_locus_dbentity_alias(
        ["Uniform", "Non-uniform", "Retired name", "UniProtKB ID"])

    ###################################
    not_mapped_genes = IndexESHelper.get_not_mapped_genes()
    is_quick_flag = True

    for gene in all_genes:
        if gene.gene_name:
            _name = gene.gene_name
            if gene.systematic_name and gene.gene_name != gene.systematic_name:
                _name += " / " + gene.systematic_name
        else:
            _name = gene.systematic_name

        #summary = DBSession.query(Locussummary.text).filter_by(locus_id=gene.dbentity_id).all()
        summary = []
        if (_summary is not None):
            summary = _summary.get(gene.dbentity_id)
        #protein = DBSession.query(LocusAlias.display_name).filter_by(locus_id=gene.dbentity_id, alias_type="NCBI protein name").one_or_none()
        protein = _protein.get(gene.dbentity_id)
        if protein is not None:
            protein = protein[0].display_name

        # TEMP don't index due to schema schange
        # sequence_history = DBSession.query(Locusnoteannotation.note).filter_by(dbentity_id=gene.dbentity_id, note_type="Sequence").all()
        # gene_history = DBSession.query(Locusnoteannotation.note).filter_by(dbentity_id=gene.dbentity_id, note_type="Locus").all()

        #phenotype_ids = DBSession.query(Phenotypeannotation.phenotype_id).filter_by(dbentity_id=gene.dbentity_id).all()
        phenotype_ids = []
        if _phenos is not None:
            temp = _phenos.get(gene.dbentity_id)
            if temp is not None:
                phenotype_ids = [x.phenotype_id for x in temp]
        if len(phenotype_ids) > 0:
            phenotypes = DBSession.query(Phenotype.display_name).filter(
                Phenotype.phenotype_id.in_(phenotype_ids)).all()
        else:
            phenotypes = []
        #go_ids = DBSession.query(Goannotation.go_id).filter(and_(Goannotation.go_qualifier != 'NOT', Goannotation.dbentity_id == gene.dbentity_id)).all()
        go_ids = _goids.get(gene.dbentity_id)
        if go_ids is not None:
            go_ids = [x.go_id for x in go_ids]
        else:
            go_ids = []
        go_annotations = {
            'cellular component': set([]),
            'molecular function': set([]),
            'biological process': set([])
        }
        if len(go_ids) > 0:
            #go_ids = [g[0] for g in go_ids]
            go = DBSession.query(
                Go.display_name,
                Go.go_namespace).filter(Go.go_id.in_(go_ids)).all()
            for g in go:
                go_annotations[g[1]].add(g[0] + ' (direct)')
        go_slim_ids = DBSession.query(Goslimannotation.goslim_id).filter(
            Goslimannotation.dbentity_id == gene.dbentity_id).all()
        if len(go_slim_ids) > 0:
            go_slim_ids = [g[0] for g in go_slim_ids]
            go_slim = DBSession.query(Goslim.go_id, Goslim.display_name).filter(
                Goslim.goslim_id.in_(go_slim_ids)).all()
            go_ids = [g[0] for g in go_slim]
            go = DBSession.query(
                Go.go_id, Go.go_namespace).filter(Go.go_id.in_(go_ids)).all()
            for g in go:
                for gs in go_slim:
                    if (gs[0] == g[0]):
                        go_annotations[g[1]].add(gs[1])

        # add "quick direct" keys such as aliases, SGD, UniProt ID and format aliases
        #aliases_raw = DBSession.query(LocusAlias.display_name, LocusAlias.alias_type).filter(and_(LocusAlias.locus_id==gene.dbentity_id, LocusAlias.alias_type.in_())).all()
        aliases_raw = _aliases_raw.get(gene.dbentity_id)
        alias_quick_direct_keys = []
        aliases = []
        if aliases_raw is not None:
            for alias_item in aliases_raw:
                name = alias_item.display_name
                if name not in merged_deleted:
                    alias_quick_direct_keys.append(name)
                if alias_item.alias_type != "UniProtKB ID":
                    aliases.append(name)
        '''for d in aliases_raw:
            name = d[0]
            if name not in merged_deleted:
                alias_quick_direct_keys.append(name)
            if d[1] != "UniProtKB ID":
                aliases.append(name)'''
        # make everything in keys lowercase to ignore case
        keys = []
        _keys = [gene.gene_name, gene.systematic_name, gene.sgdid
                ] + alias_quick_direct_keys
        # Add SGD:<gene SGDID> to list of keywords for quick search
        _keys.append('SGD:{}'.format(gene.sgdid))
        # If this gene has a reservedname associated with it, add that reservedname to
        # the list of keywords used for the quick search of this gene
        reservedname = DBSession.query(Reservedname).filter_by(locus_id=gene.dbentity_id).one_or_none()
        if reservedname:
            _keys.append(reservedname.display_name)
        for k in _keys:
            if k:
                keys.append(k.lower())

        obj = {
            'name':
                _name,
            'href':
                gene.obj_url,
            'description':
                gene.description,
            'category':
                'locus',
            'feature_type':
                feature_types[dbentity_ids_to_so[gene.dbentity_id]],
            'name_description':
                gene.name_description,
            'summary':
                summary,
            'phenotypes': [p[0] for p in phenotypes],
            'aliases':
                aliases,
            'cellular_component':
                list(go_annotations["cellular component"] - set([
                    "cellular component", "cellular component (direct)",
                    "cellular_component", "cellular_component (direct)"
                ])),
            'biological_process':
                list(go_annotations["biological process"] - set([
                    "biological process (direct)", "biological process",
                    "biological_process (direct)", "biological_process"
                ])),
            'molecular_function':
                list(go_annotations["molecular function"] - set([
                    "molecular function (direct)", "molecular function",
                    "molecular_function (direct)", "molecular_function"
                ])),
            'ec_number':
                ec_numbers.get(gene.dbentity_id),
            'protein':
                protein,
            'tc_number':
                tc_numbers.get(gene.dbentity_id),
            'secondary_sgdid':
                secondary_sgdids.get(gene.dbentity_id),
            'status':
                gene.dbentity_status,
            # TEMP don't index due to schema change
            # 'sequence_history': [s[0] for s in sequence_history],
            # 'gene_history': [g[0] for g in gene_history],
            'bioentity_id':
                gene.dbentity_id,
            'keys':
                list(keys),
            'is_quick_flag': str(is_quick_flag)
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 1000:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_phenotypes():
    bulk_data = []
    phenotypes = DBSession.query(Phenotype).all()
    _result = IndexESHelper.get_pheno_annotations(phenotypes)
    print("Indexing " + str(len(_result)) + " phenotypes")
    for phenotype_item in _result:
        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })
        bulk_data.append(phenotype_item)
        if len(bulk_data) == 300:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
        bulk_data = []
    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)




def index_observables():
    observables = DBSession.query(Apo).filter_by(
        apo_namespace="observable").all()

    print("Indexing " + str(len(observables)) + " observables")
    bulk_data = []

    for observable in observables:
        obj = {
            "name": observable.display_name,
            "href": observable.obj_url,
            "description": observable.description,
            "category": "observable",
            "keys": []
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 300:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_strains():
    strains = DBSession.query(Straindbentity).all()

    print("Indexing " + str(len(strains)) + " strains")
    for strain in strains:
        key_values = [
            strain.display_name, strain.format_name, strain.genbank_id
        ]

        keys = set([])
        for k in key_values:
            if k is not None:
                keys.add(k.lower())

        paragraph = DBSession.query(Strainsummary.text).filter_by(
            strain_id=strain.dbentity_id).one_or_none()
        description = None
        if paragraph:
            description = paragraph[0]

        obj = {
            "name": strain.display_name,
            "href": strain.obj_url,
            "description": strain.headline,
            "category": "strain",
            "keys": list(keys)
        }

        es.index(
            index=INDEX_NAME,
            doc_type=DOC_TYPE,
            body=obj,
            id=str(uuid.uuid4())


def index_reserved_names():
    # only index reservednames that do not have a locus associated with them
    reserved_names = DBSession.query(Reservedname).all()

    print("Indexing " + str(len(reserved_names)) + " reserved names")
    for reserved_name in reserved_names:
        name = reserved_name.display_name
        href = reserved_name.obj_url
        keys = [reserved_name.display_name.lower()]
        # change name if has an orf
        if reserved_name.locus_id:
            locus = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id == reserved_name.locus_id).one_or_none()
            name = name + ' / ' + locus.systematic_name
            href = locus.obj_url
            keys = []
        obj = {
            "name": name,
            "href": href,
            "description": reserved_name.name_description,
            "category": "reserved_name",
            "keys": keys
        }
        es.index(
            index=INDEX_NAME,
            doc_type=DOC_TYPE,
            body=obj,
            id=str(uuid.uuid4())


def load_go_id_blacklist(list_filename):
    go_id_blacklist = set()
    for l in open(list_filename, 'r'):
        go_id_blacklist.add(l[:-1])
    return go_id_blacklist


def index_go_terms():
    go_id_blacklist = load_go_id_blacklist('scripts/search/go_id_blacklist.lst')

    gos = DBSession.query(Go).all()

    print("Indexing " + str(len(gos) - len(go_id_blacklist)) + " GO terms")

    bulk_data = []
    for go in gos:
        if go.goid in go_id_blacklist:
            continue

        synonyms = DBSession.query(GoAlias.display_name).filter_by(
            go_id=go.go_id).all()

        references = set([])
        go_loci = set([])
        annotations = DBSession.query(Goannotation).filter_by(
            go_id=go.go_id).all()
        for annotation in annotations:
            if annotation.go_qualifier != 'NOT':
                go_loci.add(annotation.dbentity.display_name)
            references.add(annotation.reference.display_name)

        numerical_id = go.goid.split(':')[1]
        key_values = [
            go.goid, 'GO:' + str(int(numerical_id)), numerical_id,
            str(int(numerical_id))
        ]

        keys = set([])
        for k in key_values:
            if k is not None:
                keys.add(k.lower())

        obj = {
            "name": go.display_name,
            "href": go.obj_url,
            "description": go.description,
            "synonyms": [s[0] for s in synonyms],
            "go_id": go.goid,
            "go_loci": sorted(list(go_loci)),
            "number_annotations": len(annotations),
            "references": list(references),
            "category": go.go_namespace.replace(' ', '_'),
            "keys": list(keys)
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 800:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_references():
    _ref_loci = IndexESHelper.get_dbentity_locus_note()
    _references = DBSession.query(Referencedbentity).all()
    _abstracts = IndexESHelper.get_ref_abstracts()
    _authors = IndexESHelper.get_ref_authors()
    _aliases = IndexESHelper.get_ref_aliases()

    bulk_data = []
    print('Indexing ' + str(len(_references)) + ' references')

    for reference in _references:
        reference_loci = []
        if len(_ref_loci) > 0:
            temp_loci = _ref_loci.get(reference.dbentity_id)
            if temp_loci is not None:
                reference_loci = list(set([x.display_name for x in IndexESHelper.flattern_list(temp_loci)]))

        abstract = _abstracts.get(reference.dbentity_id)
        if abstract is not None:
            abstract = abstract[0]
        sec_sgdids = _aliases.get(reference.dbentity_id)
        sec_sgdid = None
        authors = _authors.get(reference.dbentity_id)
        if sec_sgdids is not None:
            sec_sgdid = sec_sgdids[0]

        if authors is None:
            authors = []

        journal = reference.journal
        if journal:
            journal = journal.display_name
        key_values = [
            reference.pmcid, reference.pmid, "pmid: " + str(reference.pmid),
            "pmid:" + str(reference.pmid), "pmid " + str(reference.pmid),
            reference.sgdid
        ]

        keys = set([])
        for k in key_values:
            if k is not None:
                keys.add(str(k).lower())
        obj = {
            'name': reference.citation,
            'href': reference.obj_url,
            'description': abstract,
            'author': authors,
            'journal': journal,
            'year': str(reference.year),
            'reference_loci': reference_loci,
            'secondary_sgdid': sec_sgdid,
            'category': 'reference',
            'keys': list(keys)
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })
        bulk_data.append(obj)
        if len(bulk_data) == 1000:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_chemicals():
    all_chebi_data = DBSession.query(Chebi).all()
    _result = IndexESHelper.get_chebi_annotations(all_chebi_data)
    bulk_data = []
    print("Indexing " + str(len(all_chebi_data)) + " chemicals")
    for item_key, item_v in _result.items():
        if item_v is not None:
            obj = {
                "name": item_v.display_name,
                "href": item_v.obj_url,
                "description": item_v.description,
                "category": "chemical",
                "keys": []
            }
            bulk_data.append({
                'index': {
                    '_index': INDEX_NAME,
                    '_type': DOC_TYPE,
                    '_id': 'chemical_' + str(item_key)
                }
            })

            bulk_data.append(obj)
            if len(bulk_data) == 300:
                es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
                bulk_data = []
    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def cleanup():
    delete_mapping()
    put_mapping()


def setup():
    # see if index exists, if not create it
    indices = es.indices.get_aliases().keys()
    index_exists = INDEX_NAME in indices
    if not index_exists:
        put_mapping()



def index_not_mapped_genes():
    url = "https://downloads.yeastgenome.org/curation/literature/genetic_loci.tab"
    bulk_data = []
    with open('./scripts/search/not_mapped.json',
              "r") as json_data:
        _data = json.load(json_data)
        print('indexing ' + str(len(_data)) + ' not physically mapped genes')
        for item in _data:
            temp_aliases = []
            if len(item["FEATURE_NAME"]) > 0:
                obj = {
                    'name': item["FEATURE_NAME"],
                    'href': url,
                    'category': 'locus',
                    'feature_type': ["Unmapped Genetic Loci"],
                    'aliases': item["ALIASES"].split('|'),
                    'description': item["DESCRIPTION"],
                    'is_quick_flag': "False"
                }
                bulk_data.append({
                    'index': {
                        '_index': INDEX_NAME,
                        '_type': DOC_TYPE,
                        '_id': str(uuid.uuid4())
                    }
                })
                bulk_data.append(obj)
                if len(bulk_data) == 300:
                    es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
                    bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_downloads():
    bulk_data = []
    dbentity_file_obj = IndexESHelper.get_file_dbentity_keyword()
    files = DBSession.query(Filedbentity).filter(Filedbentity.is_public == True,
                                                 Filedbentity.s3_url != None,
                                                 Filedbentity.readme_file_id != None).all()
    print('indexing ' + str(len(files)) + ' download files')
    for x in files:
        keyword = []
        status = ''
        temp = dbentity_file_obj.get(x.dbentity_id)
        if temp:
            keyword = temp
        if (x.dbentity_status == "Active" or x.dbentity_status == "Archived"):
            if x.dbentity_status == "Active":
                status = "Active"
            else:
                status = "Archived"
        obj = {
            'name':
                x.display_name,
            'href':
                x.s3_url,
            'category':
                'download',
            'description':
                x.description,
            'keyword':
                keyword,
            'format':
                str(x.format.display_name),
            'status':
                str(status),
            'file_size':
                str(IndexESHelper.convertBytes(x.file_size))
                if x.file_size is not None else x.file_size,
            'year':
                str(x.year),
            'readme_url':
                x.readme_file[0].s3_url,
            'topic': x.topic.display_name,
            'data': x.data.display_name,
            'path_id': x.get_path_id()
        }
        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': str(uuid.uuid4())
            }
        })

        bulk_data.append(obj)
        if len(bulk_data) == 50:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_part_1():
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_phenotypes()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_downloads()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_not_mapped_genes()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_genes()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_strains()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_colleagues()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_chemicals()


def index_part_2():
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_reserved_names()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_toolbar_links()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_observables()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_go_terms()
    with concurrent.futures.ProcessPoolExecutor(max_workers=8) as executor:
        index_references()


if __name__ == '__main__':
    cleanup()
    setup()
    t1 = Thread(target=index_part_1)
    t2 = Thread(target=index_part_2)
    t1.start()
    t2.start()
