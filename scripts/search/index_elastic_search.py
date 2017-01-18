from src.models import DBSession, Base, Colleague, ColleagueLocus, Locusdbentity, LocusAlias, Dnasequenceannotation, So, Locussummary, Locusnoteannotation, Phenotypeannotation, PhenotypeannotationCond, Phenotype, Goannotation, Go, Goslimannotation, Goslim, Apo, Straindbentity, Strainsummary, Reservedname, GoAlias, Goannotation, Referencedbentity, Referencedocument, Referenceauthor, ReferenceAlias
from sqlalchemy import create_engine, and_
from elasticsearch import Elasticsearch
from mapping import mapping
import os
import requests

from threading import Thread

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)
Base.metadata.bind = engine

INDEX_NAME = 'searchable_items_aws'
DOC_TYPE = 'searchable_item'
es = Elasticsearch(os.environ['ES_URI'], retry_on_timeout=True)

def delete_mapping():
    print "Deleting mapping..."
    response = requests.delete(os.environ['ES_URI'] + INDEX_NAME + "/")
    if response.status_code != 200:
        print "ERROR: " + str(response.json())
    else:
        print "SUCCESS"        

def put_mapping():
    print "Putting mapping... "
    response = requests.put(os.environ['ES_URI'] + INDEX_NAME + "/", json=mapping)
    if response.status_code != 200:
        print "ERROR: " + str(response.json())
    else:
        print "SUCCESS"

def index_toolbar_links():
    links = [("Gene List", "http://yeastmine.yeastgenome.org/yeastmine/bag.do",  []),
             ("Yeastmine", "http://yeastmine.yeastgenome.org",  'yeastmine'),
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
             ("Download Genome", "http://downloads.yeastgenome.org/sequence/S288C_reference/genome_releases/",  'download'),
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
             ("GO Slim Mapping File", "http://downloads.yeastgenome.org/curation/literature/go_slim_mapping.tab",  'go'),
             ("Expression", "http://spell.yeastgenome.org/#",  []),
             ("Biochemical Pathways", "http://pathway.yeastgenome.org/",  []),
             ("Browse All Phenotypes", "/ontology/phenotype/ypo/overview",  []),
             ("Interactions", "/interaction_search",  []),
             ("YeastGFP", "http://yeastgfp.yeastgenome.org/",  'yeastgfp'),
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
             ("Gene Summary Paragraphs", "/cache/geneSummarytable.html",  []),
             ("Wiki", "http://wiki.yeastgenome.org/index.php/Main_Page",  'wiki'),
             ("Resources", "http://wiki.yeastgenome.org/index.php/External_Links",  [])]

    print 'Indexing ' + str(len(links)) + ' toolbar links'

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

    print "Indexing " + str(len(colleagues)) + " colleagues"
    
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
            'href': '/colleague/' + c.format_name + '/overview',
            'description': description,
            
            'first_name': c.first_name,
            'last_name': c.last_name,
            'institution': c.institution,
            'position': position,
            'country': c.country,
            'state': c.state,
            'colleague_loci': sorted(list(locus))
        }

        c._include_keywords_to_dict(obj) # adds 'keywords' to obj

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
            bulk_data = [];

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
        
    all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').all()

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

    print 'Indexing ' + str(len(all_genes)) + ' genes'

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

        sequence_history = DBSession.query(Locusnoteannotation.note).filter_by(dbentity_id=gene.dbentity_id, note_type="Sequence").all()
        gene_history = DBSession.query(Locusnoteannotation.note).filter_by(dbentity_id=gene.dbentity_id, note_type="Locus").all()

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
            
        uniprotids = DBSession.query(LocusAlias.display_name).filter_by(locus_id=gene.dbentity_id, alias_type="UniProtKB ID").all()

        uniprotid = [u[0] for u in uniprotids]
            
        key_values = [gene.gene_name, gene.systematic_name, gene.sgdid] + uniprotid
        keys = set([])
        for k in key_values:
            if k:
                keys.add(k.lower())
            
        obj = {
            'name': _name,
            'href': gene.obj_url,
            'description': gene.description,
            'category': 'locus',
            
            'feature_type': feature_types[dbentity_ids_to_so[gene.dbentity_id]],

            'name_description': gene.name_description,
            'summary': [s[0] for s in summary],
                
            'phenotypes': [p[0] for p in phenotypes],
            
            'cellular_component': list(go_annotations["cellular component"] - set(["cellular component", "cellular component (direct)", "cellular_component", "cellular_component (direct)"])),
            'biological_process': list(go_annotations["biological process"] - set(["biological process (direct)", "biological process", "biological_process (direct)", "biological_process"])),
            'molecular_function': list(go_annotations["molecular function"] - set(["molecular function (direct)", "molecular function", "molecular_function (direct)", "molecular_function"])),

            'ec_number': ec_numbers.get(gene.dbentity_id),
            'protein': protein,
            'tc_number': tc_numbers.get(gene.dbentity_id),
            'secondary_sgdid': secondary_sgdids.get(gene.dbentity_id),
            
            'sequence_history': [s[0] for s in sequence_history],
            'gene_history': [g[0] for g in gene_history],

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

    print "Indexing " + str(len(phenotypes)) + " phenotypes"
    
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

    print "Indexing " + str(len(observables)) + " observables"
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

    print "Indexing " + str(len(strains)) + " strains"
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

    print "Indexing " + str(len(reserved_names)) + " reserved names"
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
    go_id_blacklist = load_go_id_blacklist('scripts/go_id_blacklist.lst')
    
    gos = DBSession.query(Go).all()

    print "Indexing " + str(len(gos) - len(go_id_blacklist)) + " GO terms"
    
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
    references = DBSession.query(Referencedbentity).all()

    bulk_data = []
    print 'Indexing ' + str(len(references)) + ' references'
    for reference in references:
        abstract = DBSession.query(Referencedocument.text).filter_by(reference_id=reference.dbentity_id, document_type="Abstract").one_or_none()
        if abstract:
            abstract = abstract[0]

        authors = DBSession.query(Referenceauthor.display_name).filter_by(reference_id=reference.dbentity_id).all()

        reference_loci_db = DBSession.query(Locusnoteannotation).filter_by(reference_id=reference.dbentity_id).all()

        reference_loci = []
        if len(reference_loci_db) > 0:
            reference_loci = [r.dbentity.display_name for r in reference_loci_db]

        sec_sgdid = DBSession.query(ReferenceAlias.display_name).filter_by(reference_id=reference.dbentity_id, alias_type="Secondary SGDID").one_or_none()
        if sec_sgdid:
            sec_sgdid = sec_sgdid[0]

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
            'reference_loci': reference_loci,
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
            bulk_data = []

    if len(bulk_data) > 0:
        es.bulk(index=INDEX_NAME, body=bulk_data, refresh=True)

        
#delete_mapping()
#put_mapping()

def index_part_1():
#    index_reserved_names()
#    index_toolbar_links()
    index_strains()
#    index_genes()
#    index_phenotypes()

def index_part_2():
    pass
#    index_observables()
#    index_colleagues()
#    index_go_terms()
#    index_references()

t1 = Thread(target=index_part_1)
t2 = Thread(target=index_part_2)

t1.start()
t2.start()


