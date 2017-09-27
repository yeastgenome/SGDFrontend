from src.models import DBSession, Base, Colleague, ColleagueLocus, Dbentity, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias, Chebi
from sqlalchemy import create_engine, and_
from elasticsearch import Elasticsearch
from mapping import mapping
import os
import requests
from pycallgraph import PyCallGraph
from pycallgraph.output import GraphvizOutput
from pympler import summary, muppy
import psutil

from threading import Thread
import pdb
from progressbar import ProgressBar
pbar = ProgressBar()

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
    links = [("Gene List", "https://yeastmine.yeastgenome.org/yeastmine/bag.do",  []),
             ("Yeastmine", "https://yeastmine.yeastgenome.org",  'yeastmine'),
             ("Submit Data", "/cgi-bin/submitData.pl",  []),
             ("SPELL", "http://spell.yeastgenome.org",  'spell'),
             ("BLAST", "/blast-sgd",  'blast'),
             ("Fungal BLAST", "/blast-fungal",  'blast'),
             ("Pattern Matching", "/cgi-bin/PATMATCH/nph-patmatch",  []),
             ("Design Primers", "/cgi-bin/web-primer",  []),
             ("Restriction Mapper", "/cgi-bin/PATMATCH/RestrictionMapper",  []),
             ("Download", "/download-data/sequence",  'download'),
             ("Genome Browser", "/browse",  []),
             ("Gene/Sequence Resources", "/cgi-bin/seqTools",  []),
             ("Download Genome", "https://downloads.yeastgenome.org/sequence/S288C_reference/genome_releases/",  'download'),
             ("Genome Snapshot", "/genomesnapshot",  []),
             ("Chromosome History", "/cgi-bin/chromosomeHistory.pl",  []),
             ("Systematic Sequencing Table", "/cache/chromosomes.shtml",  []),
             ("Original Sequence Papers", "http://wiki.yeastgenome.org/index.php/Original_Sequence_Papers",  []),
             ("Variant Viewer", "/variant-viewer",  []),
             ("Align Strain Sequences", "/cgi-bin/FUNGI/alignment.pl",  []),
             ("Synteny Viewer", "/cgi-bin/FUNGI/FungiMap",  []),
             ("Fungal Alignment", "/cgi-bin/FUNGI/showAlign",  []),
             ("PDB Search", "/cgi-bin/protein/get3d",  'pdb'),
             ("GO Term Finder", "/cgi-bin/GO/goTermFinder.pl",  'go'),
             ("GO Slim Mapper", "/cgi-bin/GO/goSlimMapper.pl",  'go'),
             ("GO Slim Mapping File", "https://downloads.yeastgenome.org/curation/literature/go_slim_mapping.tab",  'go'),
             ("Expression", "http://spell.yeastgenome.org/#",  []),
             ("Biochemical Pathways", "http://pathway.yeastgenome.org/",  []),
             ("Browse All Phenotypes", "/ontology/phenotype/ypo",  []),
             ("Interactions", "/interaction_search",  []),
             ("YeastGFP", "https://yeastgfp.yeastgenome.org/",  'yeastgfp'),
             ("Full-text Search", "http://textpresso.yeastgenome.org/",  'texxtpresso'),
             ("New Yeast Papers", "/reference/recent",  []),
             ("Genome-wide Analysis Papers", "/cache/genome-wide-analysis.html",  []),
             ("Find a Colleague", "/cgi-bin/colleague/colleagueInfoSearch",  []),
             ("Add or Update Info", "/cgi-bin/colleague/colleagueSearch",  []),
             ("Find a Yeast Lab", "/cache/yeastLabs.html",  []),
             ("Career Resources", "http://wiki.yeastgenome.org/index.php/Career_Resources",  []),
             ("Future", "http://wiki.yeastgenome.org/index.php/Meetings#Upcoming_Conferences_.26_Courses",  []),
             ("Yeast Genetics", "http://wiki.yeastgenome.org/index.php/Meetings#Past_Yeast_Meetings",  []),
             ("Submit a Gene Registration", "/cgi-bin/registry/geneRegistry",  []),
             ("Gene Registry", "/help/community/gene-registry",  []),
             ("Nomenclature Conventions", "/help/community/nomenclature-conventions",  []),
             ("Global Gene Hunter", "/cgi-bin/geneHunter",  []),
             ("Strains and Constructs", "http://wiki.yeastgenome.org/index.php/Strains",  []),
             ("Reagents", "http://wiki.yeastgenome.org/index.php/Reagents",  []),
             ("Protocols and Methods", "http://wiki.yeastgenome.org/index.php/Methods",  []),
             ("Physical & Genetic Maps", "http://wiki.yeastgenome.org/index.php/Combined_Physical_and_Genetic_Maps_of_S._cerevisiae",  []),
             ("Genetic Maps", "http://wiki.yeastgenome.org/index.php/Yeast_Mortimer_Maps_-_Edition_12",  []),
             ("Sequence", "http://wiki.yeastgenome.org/index.php/Historical_Systematic_Sequence_Information",  []),
             ("Wiki", "http://wiki.yeastgenome.org/index.php/Main_Page",  'wiki'),
             ("Resources", "http://wiki.yeastgenome.org/index.php/External_Links",  [])]

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

    print("Indexing " + str(len(colleagues)) + " colleagues")

    bulk_data = []
    for c in colleagues:
        description_fields = []
        for field in [c.institution, c.country]:
            if field:
                description_fields.append(field)
        description = ", ".join(description_fields)

        position = "Lab Member"
        if c.is_pi == 1:
            position = "Head of Lab"

        locus = set()
        locus_ids = DBSession.query(ColleagueLocus.locus_id).filter(ColleagueLocus.colleague_id == c.colleague_id).all()
        if len(locus_ids) > 0:
            ids_query = [k[0] for k in locus_ids]
            locus_names = DBSession.query(Locusdbentity.gene_name, Locusdbentity.systematic_name).filter(Locusdbentity.dbentity_id.in_(ids_query)).all()
            for l in locus_names:
                if l[0]:
                    locus.add(l[0])
                if l[1]:
                    locus.add(l[1])

        obj = {
            'name': c.last_name + ", " + c.first_name,
            'category': 'colleague',
            'href': '/colleague/' + c.format_name,
            'description': description,

            'first_name': c.first_name,
            'last_name': c.last_name,
            'institution': c.institution,
            'position': position,
            'country': c.country,
            'state': c.state,
            'colleague_loci': sorted(list(locus))
        }

        c.to_dict() # adds 'keywords' to obj

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': c.format_name
            }
        })

        bulk_data.append(obj)

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
    gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    # add some non S288C genes
    not_s288c = DBSession.query(Locusdbentity.dbentity_id).filter(Locusdbentity.not_in_s288c==True).all()
    for id in not_s288c:
        dbentity_ids.add(id[0])
        # assume non S288C features to be ORFs
        dbentity_ids_to_so[id[0]] = 263757
    all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids))).all()

    # make list of merged/deleted genes so they don't redirect when they show up as an alias
    merged_deleted_r = DBSession.query(Locusdbentity.format_name).filter(Locusdbentity.dbentity_status.in_(['Merged', 'Deleted'])).all()
    merged_deleted = [d[0] for d in merged_deleted_r]

    feature_types_db = DBSession.query(So.so_id, So.display_name).filter(So.so_id.in_(list(so_ids))).all()
    feature_types = {}
    for ft in feature_types_db:
        feature_types[ft[0]] = ft[1]

    tc_numbers_db = DBSession.query(LocusAlias).filter_by(alias_type="TC number").all()
    tc_numbers = {}
    for tc in tc_numbers_db:
        if tc.locus_id in tc_numbers:
            tc_numbers[tc.locus_id].append(tc.display_name)
        else:
            tc_numbers[tc.locus_id] = [tc.display_name]

    ec_numbers_db = DBSession.query(LocusAlias).filter_by(alias_type="EC number").all()
    ec_numbers = {}
    for ec in ec_numbers_db:
        if ec.locus_id in ec_numbers:
            ec_numbers[ec.locus_id].append(ec.display_name)
        else:
            ec_numbers[ec.locus_id] = [ec.display_name]

    secondary_db = DBSession.query(LocusAlias).filter_by(alias_type="SGDID Secondary").all()
    secondary_sgdids = {}

    for sid in secondary_db:
        if sid.locus_id in secondary_sgdids:
            secondary_sgdids[sid.locus_id].append(sid.display_name)
        else:
            secondary_sgdids[sid.locus_id] = [sid.display_name]

    bulk_data = []

    print('Indexing ' + str(len(all_genes)) + ' genes')
    for gene in all_genes:
        if gene.gene_name:
            _name = gene.gene_name
            if gene.systematic_name and gene.gene_name != gene.systematic_name:
                _name += " / " + gene.systematic_name
        else:
            _name = gene.systematic_name

        summary = DBSession.query(Locussummary.text).filter_by(locus_id=gene.dbentity_id).all()
        protein = DBSession.query(LocusAlias.display_name).filter_by(locus_id=gene.dbentity_id, alias_type="NCBI protein name").one_or_none()
        if protein:
            protein = protein[0]

        # TEMP don't index due to schema schange
        # sequence_history = DBSession.query(Locusnoteannotation.note).filter_by(dbentity_id=gene.dbentity_id, note_type="Sequence").all()
        # gene_history = DBSession.query(Locusnoteannotation.note).filter_by(dbentity_id=gene.dbentity_id, note_type="Locus").all()

        phenotype_ids = DBSession.query(Phenotypeannotation.phenotype_id).filter_by(dbentity_id=gene.dbentity_id).all()
        if phenotype_ids:
            phenotype_ids = [p[0] for p in phenotype_ids]
            phenotypes = DBSession.query(Phenotype.display_name).filter(Phenotype.phenotype_id.in_(phenotype_ids)).all()
        else:
            phenotypes = []

        go_ids = DBSession.query(Goannotation.go_id).filter(and_(Goannotation.go_qualifier != 'NOT', Goannotation.dbentity_id == gene.dbentity_id)).all()
        go_annotations = {'cellular component': set([]), 'molecular function': set([]), 'biological process': set([])}
        if len(go_ids) > 0:
            go_ids = [g[0] for g in go_ids]
            go = DBSession.query(Go.display_name, Go.go_namespace).filter(Go.go_id.in_(go_ids)).all()
            for g in go:
                go_annotations[g[1]].add(g[0] + ' (direct)')
        go_slim_ids = DBSession.query(Goslimannotation.goslim_id).filter(Goslimannotation.dbentity_id == gene.dbentity_id).all()
        if len(go_slim_ids) > 0:
            go_slim_ids = [g[0] for g in go_slim_ids]
            go_slim = DBSession.query(Goslim.go_id, Goslim.display_name).filter(Goslim.goslim_id.in_(go_slim_ids)).all()
            go_ids = [g[0] for g in go_slim]
            go = DBSession.query(Go.go_id, Go.go_namespace).filter(Go.go_id.in_(go_ids)).all()
            for g in go:
                for gs in go_slim:
                    if (gs[0] == g[0]):
                        go_annotations[g[1]].add(gs[1])

        # add "quick direct" keys such as aliases, SGD, UniProt ID and format aliases
        aliases_raw = DBSession.query(LocusAlias.display_name, LocusAlias.alias_type).filter(and_(LocusAlias.locus_id==gene.dbentity_id, LocusAlias.alias_type.in_(["Uniform", "Non-uniform", "Retired name", "UniProtKB ID"]))).all()
        alias_quick_direct_keys = []
        aliases = []
        for d in aliases_raw:
            name = d[0]
            if name not in merged_deleted:
                alias_quick_direct_keys.append(name)
            if d[1] != "UniProtKB ID":
                aliases.append(name)
        # make everything in keys lowercase to ignore case
        keys = []
        _keys = [gene.gene_name, gene.systematic_name, gene.sgdid] + alias_quick_direct_keys
        for k in _keys:
            if k:
                keys.append(k.lower())
        obj = {
            'name': _name,
            'href': gene.obj_url,
            'description': gene.description,
            'category': 'locus',
            'feature_type': feature_types[dbentity_ids_to_so[gene.dbentity_id]],
            'name_description': gene.name_description,
            'summary': [s[0] for s in summary],
            'phenotypes': [p[0] for p in phenotypes],
            'aliases': aliases,
            'cellular_component': list(go_annotations["cellular component"] - set(["cellular component", "cellular component (direct)", "cellular_component", "cellular_component (direct)"])),
            'biological_process': list(go_annotations["biological process"] - set(["biological process (direct)", "biological process", "biological_process (direct)", "biological_process"])),
            'molecular_function': list(go_annotations["molecular function"] - set(["molecular function (direct)", "molecular function", "molecular_function (direct)", "molecular_function"])),
            'ec_number': ec_numbers.get(gene.dbentity_id),
            'protein': protein,
            'tc_number': tc_numbers.get(gene.dbentity_id),
            'secondary_sgdid': secondary_sgdids.get(gene.dbentity_id),
            'status': gene.dbentity_status,
            # TEMP don't index due to schema change
            # 'sequence_history': [s[0] for s in sequence_history],
            # 'gene_history': [g[0] for g in gene_history],
            'bioentity_id': gene.dbentity_id,
            'keys': list(keys)
        }
        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': gene.sgdid
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 1000:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_phenotypes():
    phenotypes = DBSession.query(Phenotype).all()

    bulk_data = []

    print("Indexing " + str(len(phenotypes)) + " phenotypes")

    for phenotype in phenotypes:
        annotations = DBSession.query(Phenotypeannotation).filter_by(phenotype_id=phenotype.phenotype_id).all()

        references = set([])
        loci = set([])
        chemicals = set([])
        mutant = set([])
        for annotation in annotations:
            references.add(annotation.reference.display_name)
            loci.add(annotation.dbentity.display_name)
            mutant.add(annotation.mutant.display_name)

            annotation_conds = DBSession.query(PhenotypeannotationCond).filter_by(annotation_id=annotation.annotation_id, condition_class="chemical").all()
            for annotation_cond in annotation_conds:
                chemicals.add(annotation_cond.condition_name)

        qualifier = None
        if phenotype.qualifier:
            qualifier = phenotype.qualifier.display_name

        obj = {
            'name': phenotype.display_name,
            'href': phenotype.obj_url,
            'description': phenotype.description,

            'observable': phenotype.observable.display_name,
            'qualifier': qualifier,

            'references': list(references),
            'phenotype_loci': list(loci),
            'number_annotations': len(list(loci)),
            'chemical': list(chemicals),
            'mutant_type': list(mutant),

            'category': 'phenotype',
            'keys': []
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': phenotype.format_name
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 500:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_observables():
    observables = DBSession.query(Apo).filter_by(apo_namespace="observable").all()

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
                '_id': 'observable_' + str(observable.apo_id)
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
        key_values = [strain.display_name, strain.format_name, strain.genbank_id]

        keys = set([])
        for k in key_values:
            if k is not None:
                keys.add(k.lower())

        paragraph = DBSession.query(Strainsummary.text).filter_by(strain_id=strain.dbentity_id).one_or_none()
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

        es.index(index=INDEX_NAME, doc_type=DOC_TYPE, body=obj, id="strain_" + str(strain.dbentity_id))


def index_reserved_names():
    reserved_names = DBSession.query(Reservedname).all()

    print("Indexing " + str(len(reserved_names)) + " reserved names")
    for reserved_name in reserved_names:
        obj = {
            "name": reserved_name.display_name,
            "href": reserved_name.obj_url,
            "description": reserved_name.description,
            "category": "reserved_name",
            "keys": [reserved_name.display_name.lower()]
        }
        es.index(index=INDEX_NAME, doc_type=DOC_TYPE, body=obj, id="reserved_" + reserved_name.format_name)


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

        synonyms = DBSession.query(GoAlias.display_name).filter_by(go_id=go.go_id).all()

        references = set([])
        go_loci = set([])
        annotations = DBSession.query(Goannotation).filter_by(go_id=go.go_id).all()
        for annotation in annotations:
            if annotation.go_qualifier != 'NOT':
                go_loci.add(annotation.dbentity.display_name)
            references.add(annotation.reference.display_name)

        numerical_id = go.goid.split(':')[1]
        key_values = [go.goid, 'GO:' + str(int(numerical_id)), numerical_id, str(int(numerical_id))]

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
                '_id': go.goid
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 800:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_references():
    #_references = dict((x.dbentity_id, x) for x in DBSession.query(Referencedbentity).all())
   
    #_references = DBSession.query(Referencedbentity,Referenceauthor,Referencedocument,ReferenceAlias).join(Referencedbentity).join(Referenceauthor).join(Referencedocument).join()
    #ref_authors = DBSession.query(Referencedbentity,Referenceauthor).join(Referencedbentity).join(Referenceauthor).filter(Referencedbentity.dbentity_id == Referenceauthor.reference_id)

    _authors = dict(
        (str(x.referenceauthor_id) + "-" + str(x.reference_id), x)
        for x in DBSession.query(Referenceauthor.reference_id,
                                 Referenceauthor.display_name,
                                 Referenceauthor.referenceauthor_id).all())
    pdb.set_trace()
    _abstracts = DBSession.query(Referencedocument.reference_id, Referencedocument.text).all()
    _aliases = DBSession.query(ReferenceAlias.reference_id,
                               ReferenceAlias.display_name).filter_by(
                                   alias_type="Secondary SGDID").all()
    pdb.set_trace()
    bulk_data = []
    print('Indexing ' + str(len(_references)) + ' references')
    count = 0
    for reference in pbar(_references):
        count += 1
        print count
        abstract = get_reference_document(reference.dbentity_id, _abstracts) #loop --> n^4

        if abstract:
            abstract = abstract[0]
        authors = get_reference_author(reference.dbentity_id, _authors) #loop
        sec_sgdids = get_reference_alias(reference.dbentity_id, _aliases) #loop
        sec_sgdid = None
        if len(sec_sgdids):
            sec_sgdid = sec_sgdids[0][0]

        journal = reference.journal
        if journal:
            journal = journal.display_name
        key_values = [reference.pmcid, reference.pmid, "pmid: " + str(reference.pmid), "pmid:" + str(reference.pmid), "pmid " + str(reference.pmid), reference.sgdid]

        keys = set([])
        for k in key_values:
            if k is not None:
                keys.add(str(k).lower())

        obj = {
            'name': reference.citation,
            'href': reference.obj_url,
            'description': abstract,

            'author': [a[0] for a in authors],
            'journal': journal,
            'year': reference.year,
            # TEMP don't index
            # 'reference_loci': reference_loci,
            'secondary_sgdid': sec_sgdid,

            'category': 'reference',
            'keys': list(keys)
        }
        bulk_data.append(obj)
    '''for reference in references:
        #TODO: query one
        abstract = DBSession.query(Referencedocument.text).filter_by(reference_id=reference.dbentity_id, document_type="Abstract").one_or_none()
        if abstract:
            abstract = abstract[0]
        #TODO: query two
        authors = DBSession.query(Referenceauthor.display_name).filter_by(reference_id=reference.dbentity_id).all()

        # reference_loci_db = DBSession.query(Locusnoteannotation).filter_by(reference_id=reference.dbentity_id).all()

        # reference_loci = []
        # if len(reference_loci_db) > 0:
        #     reference_loci = [r.dbentity.display_name for r in reference_loci_db]

        #TODO: query three
        sec_sgdids = DBSession.query(ReferenceAlias.display_name).filter_by(reference_id=reference.dbentity_id, alias_type="Secondary SGDID").all()
        sec_sgdid = None
        if len(sec_sgdids):
            sec_sgdid = sec_sgdids[0][0]

        journal = reference.journal
        if journal:
            journal = journal.display_name

        key_values = [reference.pmcid, reference.pmid, "pmid: " + str(reference.pmid), "pmid:" + str(reference.pmid), "pmid " + str(reference.pmid), reference.sgdid]

        keys = set([])
        for k in key_values:
            if k is not None:
                keys.add(str(k).lower())

        obj = {
            'name': reference.citation,
            'href': reference.obj_url,
            'description': abstract,

            'author': [a[0] for a in authors],
            'journal': journal,
            'year': reference.year,
            # TEMP don't index
            # 'reference_loci': reference_loci,
            'secondary_sgdid': sec_sgdid,

            'category': 'reference',
            'keys': list(keys)
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': reference.sgdid
            }
        })

        bulk_data.append(obj)

        if len(bulk_data) == 600:
            es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)
            bulk_data = []'''

    if len(bulk_data) > 0:
        pdb.set_trace()
        print 'name'
        #es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)


def index_chemicals():
    all_chebi_data = DBSession.query(Chebi).all()
    print("Indexing " + str(len(all_chebi_data)) + " chemicals")
    bulk_data = []

    for chemical in all_chebi_data:
        # count annotations and ignore if none
        conditions = DBSession.query(PhenotypeannotationCond.annotation_id).filter_by(condition_name=chemical.display_name).all()
        phenotype_annotations_count = DBSession.query(Phenotypeannotation).filter(Phenotypeannotation.annotation_id.in_(conditions)).count()
        if phenotype_annotations_count == 0:
            continue
        obj = {
            "name": chemical.display_name,
            "href": chemical.obj_url,
            "description": chemical.description,
            "category": "chemical",
            "keys": []
        }

        bulk_data.append({
            'index': {
                '_index': INDEX_NAME,
                '_type': DOC_TYPE,
                '_id': 'chemical_' + str(chemical.chebi_id)
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
    indices=es.indices.get_aliases().keys()
    index_exists = INDEX_NAME in indices
    if not index_exists:
        put_mapping()

def index_part_1():
    index_genes()
    index_strains()
    index_colleagues()
    index_phenotypes()
    index_chemicals()

def index_part_2():
    index_reserved_names()
    index_toolbar_links()
    index_observables()
    index_go_terms()
    index_references()


def memory_usage(where):
    mem_summary = summary.summarize(muppy.get_objects())
    print "Memory summary:", where
    summary.print_(mem_summary, limit=2)
    print "VM: %.2fMb" % (get_virtual_memory_usage_kb() / 1024.0)


def get_virtual_memory_usage_kb():
    return float(psutil.Process().memory_info_ex().vms) / 1024.0



def run_metrics():
    graphviz = GraphvizOutput()
    graphviz.output_file = './pycall_graph_images/refs.png'
    graphviz.output_type = 'png'
    with PyCallGraph(output=graphviz):
        get_refs()

    graphviz.output_file = './pycall_graph_images/authors.png'
    with PyCallGraph(output=graphviz):
        get_authors()

    graphviz.output_file = './pycall_graph_images/abstracts.png'
    with PyCallGraph(output=graphviz):
        get_abstracts()

    graphviz.output_file = './pycall_graph_images/aliases.png'
    with PyCallGraph(output=graphviz):
        get_refs_aliases()


def run_metrics_memory_profile():

    memory_usage("1 - before query")
    references = DBSession.query(Referencedbentity).yield_per(5).all()
    memory_usage("2 - after query")
    DBSession.query(Referencedocument.text)

    '''graphviz = GraphvizOutput()
    graphviz.output_file = './pycall_graph_images/output.png'
    graphviz.output_type = 'png'
    with PyCallGraph(output=graphviz):
        memory_usage("1 - before query")
        references = DBSession.query(Referencedbentity).yield_per(100).all()
        memory_usage("2 - after query")
        print len(references)
        memory_usage("3 - after length call")

        references = DBSession.query(
            Referencedbentity.journal, Referencedbentity.dbentity_id,
            Referencedbentity.sgdid, Referencedbentity.pmcid,
            Referencedbentity.citation, Referencedbentity.obj_url,
            Referencedbentity.pmid, Referencedbentity.year).all()'''


def get_reference_dbentity():
    references = set(DBSession.query(Referencedbentity).all())
    # items = dict([(x.dbentity_id, x) for x in references])
    return references


def get_reference_document(id, lst):
    # items = dict([(x.reference_id, x) for x in abtracts])
    temp = [x.text for x in lst if x.reference_id == id]
    return temp


def get_reference_author(id, lst):
    items = [x.display_name for x in lst if x.reference_id == id]
    return items


def get_reference_alias(id, lst):
    # items = dict([(x.reference_id, x) for x in aliases])
    temp = [x.display_name for x in lst if x.reference_id == id]
    return temp




if __name__ == '__main__':
<<<<<<< HEAD
<<<<<<< HEAD
    run_metrics()
=======
>>>>>>> minor changes
=======
    with PyCallGraph(output=GraphvizOutput()):
        index_references()
>>>>>>> refs issue
    '''setup()
    t1 = Thread(target=index_part_1)
    t2 = Thread(target=index_part_2)
    t1.start()
<<<<<<< HEAD
    t2.start()
    with PyCallGraph(output=GraphvizOutput()):
        index_references()'''
=======
    t2.start()'''
    index_references()
>>>>>>> minor changes
