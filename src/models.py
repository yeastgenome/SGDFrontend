from sqlalchemy import Column, BigInteger, UniqueConstraint, Float, Boolean, SmallInteger, Integer, DateTime, ForeignKey, Index, Numeric, String, Text, text, FetchedValue, func, or_, and_, distinct
from sqlalchemy.orm import scoped_session, sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from zope.sqlalchemy import ZopeTransactionExtension
from elasticsearch import Elasticsearch
import os
from math import floor, log
import json
import copy
import requests

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
ESearch = Elasticsearch(os.environ['ES_URI'], retry_on_timeout=True)

QUERY_LIMIT = 25000

# get list of URLs to visit from comma-separated ENV variable cache_urls 'url1, url2'
cache_urls = None
if 'CACHE_URLS' in os.environ.keys():
    cache_urls = os.environ['CACHE_URLS'].split(',')
else:
    cache_urls = ['http://localhost:6545']

class CacheBase(object):
    def get_base_url(self):
        url_segment = '/locus/'
        if self.__url_segment__:
            url_segment = self.__url_segment__
        return url_segment + self.sgdid

    # list all dependent urls to ping, like secondary requests
    def get_secondary_cache_urls(self):
        return []

    def refresh_cache(self):
        base_target_url = self.get_base_url()
        target_urls = [base_target_url]
        details_urls = self.get_secondary_cache_urls()
        target_urls = target_urls + details_urls
        for relative_url in target_urls:
            for base_url in cache_urls:
                url = base_url + relative_url
                try:
                    # purge
                    requests.request('PURGE', url)
                    # prime
                    response = requests.get(url)
                    if (response.status_code != 200):
                        raise('Error fetching ')
                except Exception, e:
                    print 'error fetching ' + self.display_name

Base = declarative_base(cls=CacheBase)

class Allele(Base):
    __tablename__ = 'allele'
    __table_args__ = {u'schema': 'nex'}

    allele_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class Apo(Base):
    __tablename__ = 'apo'
    __table_args__ = {u'schema': 'nex'}

    apo_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    apoid = Column(String(20), nullable=False, unique=True)
    apo_namespace = Column(String(20), nullable=False)
    namespace_group = Column(String(40))
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')

    db_cache = {}

    ROOT_ID = 169833

    @staticmethod
    def get_apo_by_id(apo_id):
        if apo_id in Apo.db_cache:
            return Apo.db_cache[apo_id]
        else:
            apo = DBSession.query(Apo).filter_by(apo_id=apo_id).one_or_none()
            Apo.db_cache[apo_id] = apo
            return apo

    @staticmethod
    def root_to_dict():
        return {
            "display_name": "Yeast Phenotype Ontology",
            "description": "Features of Saccharomyces cerevisiae cells, cultures, or colonies that can be detected, observed, measured, or monitored.",
            "id": Apo.ROOT_ID
        }

    def to_dict(self):
        phenotypes = DBSession.query(Phenotype.obj_url, Phenotype.qualifier_id, Phenotype.phenotype_id).filter_by(observable_id=self.apo_id).all()

        annotations_count = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([p[2] for p in phenotypes])).group_by(Phenotypeannotation.dbentity_id).count()

        children_relation = DBSession.query(ApoRelation).filter_by(parent_id=self.apo_id).all()
        if len(children_relation) > 0:
            children_phenotype_ids = DBSession.query(Phenotype.phenotype_id).filter(Phenotype.observable_id.in_([c.child_id for c in children_relation])).all()
            children_annotation_count = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([i[0] for i in children_phenotype_ids])).group_by(Phenotypeannotation.dbentity_id).count()
        else:
            children_annotation_count = 0

        qualifiers = []
        for phenotype in phenotypes:
            qualifier_name = DBSession.query(Apo.display_name).filter_by(apo_id=phenotype[1]).one_or_none()
            if qualifier_name:
                qualifiers.append({
                    "link": phenotype[0],
                    "qualifier":qualifier_name[0]
                })
            
        return {
            "id": self.apo_id,
            "display_name": self.display_name,
            "description": self.description,
            "phenotypes": qualifiers,
            "overview": Phenotypeannotation.create_count_overview([p[2] for p in phenotypes]),
            "locus_count": annotations_count,
            "descendant_locus_count": annotations_count + children_annotation_count
        }

    def annotations_to_dict(self):
        phenotypes = DBSession.query(Phenotype).filter_by(observable_id=self.apo_id).all()

        obj = []

        for phenotype in phenotypes:
            obj += phenotype.annotations_to_dict()

        return obj

    def annotations_and_children_to_dict(self):        
        phenotypes = DBSession.query(Phenotype).filter_by(observable_id=self.apo_id).all()

        children_relation = DBSession.query(ApoRelation).filter_by(parent_id=self.apo_id).all()
        if len(children_relation) > 0:
            children_phenotypes = DBSession.query(Phenotype).filter(Phenotype.observable_id.in_([c.child_id for c in children_relation])).all()
            phenotypes += children_phenotypes

        obj = []

        for phenotype in phenotypes:
            annotations = DBSession.query(Phenotypeannotation).filter_by(phenotype_id=phenotype.phenotype_id).all()

            for a in annotations:
                obj += a.to_dict(phenotype=phenotype)

        return obj

    def ontology_graph(self):
        phenotypes = DBSession.query(Phenotype).filter_by(observable_id=self.apo_id).all()

        annotations = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([p.phenotype_id for p in phenotypes])).group_by(Phenotypeannotation.dbentity_id).count()

        if self.apo_id == Apo.ROOT_ID:
            nodes = [{
                "data": {
                    "link": "/ontology/phenotype/ypo",
                    "sub_type": "FOCUS",
                    "name": "Yeast Phenotype Ontology",
                    "id": str(self.apo_id)
                }
            }]
        else:
            nodes = [{
                "data": {
                    "link": self.obj_url,
                    "sub_type": "FOCUS",
                    "name": self.display_name + " (" + str(annotations) + ")",
                    "id": str(self.apo_id)
                }
            }]

        edges = []
        all_children = []

        children_relation = DBSession.query(ApoRelation).filter_by(parent_id=self.apo_id).all()

        add_parent_type = False
        children_level = 0
        if self.apo_id == Apo.ROOT_ID:
            children_level = len(children_relation)
            add_parent_type = True
        level = 0
        
        for child_relation in children_relation:
            child_node = child_relation.to_graph(nodes, edges, add_child=True, add_parent_type=add_parent_type)
            all_children.append({
                "display_name": child_node.display_name,
                "link": child_node.obj_url
            })

            if level < children_level:
                children_relation += DBSession.query(ApoRelation).filter_by(parent_id=child_node.apo_id).all()
                level += 1

        level = 0
        parent_level = 3
        parents_relation = DBSession.query(ApoRelation).filter_by(child_id=self.apo_id).all()
        for parent_relation in parents_relation:
            parent_relation.to_graph(nodes, edges, add_parent=True)

            if level < parent_level:
                parents_relation += DBSession.query(ApoRelation).filter_by(child_id=parent_relation.parent.apo_id).all()
                level += 1

        
        graph = {
            "edges": edges,
            "nodes": nodes,
            "all_children": all_children
        }

        if self.apo_id == Apo.ROOT_ID:
            graph["full_ontology"] = Apo.get_full_ontology()
        
        return graph

    @staticmethod
    def get_full_ontology():
        node_ids = [Apo.ROOT_ID]

        root = Apo.get_apo_by_id(Apo.ROOT_ID)
        
        ontology = {
            "child_to_parent": {},
            "elements": [{
                "display_name": "Yeast Phenotype Ontology",
                "id": root.apo_id,
                "link": root.obj_url
            }]
        }

        apos = DBSession.query(Apo).all()
        relations = DBSession.query(ApoRelation).all()

        for apo in apos:
            if apo.apo_id != Apo.ROOT_ID:
                if apo.obj_url.split("/")[1] == "observable":
                    ontology["elements"].append({
                        "display_name": apo.display_name,
                        "id": apo.apo_id,
                        "link": apo.obj_url
                    })
        
        for relation in relations:
            ontology["child_to_parent"][relation.child_id] = relation.parent_id
  
        return ontology

    def get_base_url(self):
        return '/observable/' + self.format_name

    def get_secondary_cache_urls(self):
        base_url = self.get_base_url()
        url1 = '/backend' + base_url + '/' + str(self.apo_id) + '/locus_details'
        return [url1]

class ApoAlia(Base):
    __tablename__ = 'apo_alias'
    __table_args__ = (
        UniqueConstraint('apo_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    apo_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    apo = relationship(u'Apo')
    source = relationship(u'Source')


class ApoRelation(Base):
    __tablename__ = 'apo_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Apo', primaryjoin='ApoRelation.child_id == Apo.apo_id')
    parent = relationship(u'Apo', primaryjoin='ApoRelation.parent_id == Apo.apo_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')

    def to_graph(self, nodes, edges, add_parent=False, add_child=False, add_parent_type=False):
        parent = Apo.get_apo_by_id(self.parent_id)

        adding_nodes = []
        if add_parent:
            adding_nodes.append(parent)

        if add_child:
            child = Apo.get_apo_by_id(self.child_id)
            adding_nodes.append(child)

        for node in adding_nodes:
            if node.display_name == "observable":
                type = "observable"
                name = "Yeast Phenotype Ontology"
            else:
                phenotypes = DBSession.query(Phenotype).filter_by(observable_id=node.apo_id).all()

                annotations = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([p.phenotype_id for p in phenotypes])).group_by(Phenotypeannotation.dbentity_id).count()

                if add_parent_type:
                    type = parent.display_name
                    if type == "observable":
                        type = node.display_name
                else:
                    type = "development"
                name = node.display_name + " (" + str(annotations) + ")"
                
            nodes.append({
                "data": {
                    "link": node.obj_url,
                    "sub_type": type,
                    "name": name,
                    "id": str(node.apo_id)
                }
            })
        
        edges.append({
            "data": {
                "name": self.ro.display_name,
                "target": str(self.child_id),
                "source": str(self.parent_id)
            }
        })

        return self.child
        

class ApoUrl(Base):
    __tablename__ = 'apo_url'
    __table_args__ = (
        UniqueConstraint('apo_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    apo_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    apo = relationship(u'Apo')
    source = relationship(u'Source')


class ArchContig(Base):
    __tablename__ = 'arch_contig'
    __table_args__ = {u'schema': 'nex'}

    contig_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(BigInteger, nullable=False, index=True)
    taxonomy_id = Column(BigInteger, nullable=False, index=True)
    so_id = Column(BigInteger, nullable=False, index=True)
    centromere_start = Column(Integer)
    centromere_end = Column(Integer)
    genbank_accession = Column(String(40))
    gi_number = Column(String(40))
    refseq_id = Column(String(40))
    reference_chromosome_id = Column(BigInteger)
    reference_start = Column(Integer)
    reference_end = Column(Integer)
    reference_percent_identity = Column(Float(53))
    reference_alignment_length = Column(Integer)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(BigInteger, index=True)
    file_header = Column(String(200))
    download_filename = Column(String(200))
    file_id = Column(BigInteger, index=True)
    description = Column(String(500))
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))


class ArchContigchange(Base):
    __tablename__ = 'arch_contigchange'
    __table_args__ = (
        UniqueConstraint('contig_id', 'genomerelease_id', 'change_type', 'change_min_coord', 'change_max_coord'),
        {u'schema': 'nex'}
    )

    archive_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.archive_seq'::regclass)"))
    contig_id = Column(ForeignKey(u'nex.arch_contig.contig_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(BigInteger, nullable=False)
    bud_id = Column(BigInteger)
    genomerelease_id = Column(BigInteger, nullable=False, index=True)
    change_type = Column(String(40), nullable=False)
    change_min_coord = Column(Integer, nullable=False)
    change_max_coord = Column(Integer, nullable=False)
    old_value = Column(String(1000))
    new_value = Column(String(1000))
    date_changed = Column(DateTime, nullable=False)
    changed_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))

    contig = relationship(u'ArchContig')


class ArchDnasequenceannotation(Base):
    __tablename__ = 'arch_dnasequenceannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'taxonomy_id', 'contig_id', 'genomerelease_id', 'so_id', 'dna_type'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(BigInteger, nullable=False)
    source_id = Column(BigInteger, nullable=False, index=True)
    taxonomy_id = Column(BigInteger, nullable=False, index=True)
    reference_id = Column(BigInteger, index=True)
    bud_id = Column(BigInteger)
    so_id = Column(BigInteger, nullable=False, index=True)
    dna_type = Column(String(50), nullable=False)
    contig_id = Column(ForeignKey(u'nex.arch_contig.contig_id', ondelete=u'CASCADE'), index=True)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(BigInteger, index=True)
    start_index = Column(Integer)
    end_index = Column(Integer)
    strand = Column(String(1), nullable=False)
    file_header = Column(String(200))
    download_filename = Column(String(200))
    file_id = Column(BigInteger, index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))

    contig = relationship(u'ArchContig')


class ArchDnasubsequence(Base):
    __tablename__ = 'arch_dnasubsequence'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'dbentity_id', 'genomerelease_id', 'relative_start_index', 'relative_end_index'),
        {u'schema': 'nex'}
    )

    dnasubsequence_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.detail_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.arch_dnasequenceannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    dbentity_id = Column(BigInteger, nullable=False, index=True)
    display_name = Column(String(500), nullable=False)
    bud_id = Column(BigInteger)
    so_id = Column(BigInteger, nullable=False, index=True)
    relative_start_index = Column(Integer, nullable=False)
    relative_end_index = Column(Integer, nullable=False)
    contig_start_index = Column(Integer, nullable=False)
    contig_end_index = Column(Integer, nullable=False)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(BigInteger, index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(BigInteger, index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))

    annotation = relationship(u'ArchDnasequenceannotation')


class ArchLiteratureannotation(Base):
    __tablename__ = 'arch_literatureannotation'
    __table_args__ = (
        UniqueConstraint('reference_id', 'topic', 'locus_id'),
        {u'schema': 'nex'}
    )

    archive_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.archive_seq'::regclass)"))
    reference_id = Column(BigInteger, nullable=False)
    source_id = Column(BigInteger, nullable=False)
    taxonomy_id = Column(BigInteger, nullable=False)
    locus_id = Column(BigInteger)
    bud_id = Column(BigInteger)
    topic = Column(String(42), nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))


class ArchLocuschange(Base):
    __tablename__ = 'arch_locuschange'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'change_type', 'old_value', 'new_value', 'date_changed'),
        {u'schema': 'nex'}
    )

    archive_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.archive_seq'::regclass)"))
    dbentity_id = Column(BigInteger, nullable=False)
    source_id = Column(BigInteger, nullable=False)
    bud_id = Column(BigInteger)
    change_type = Column(String(100), nullable=False)
    old_value = Column(String(40))
    new_value = Column(String(40))
    date_changed = Column(DateTime, nullable=False)
    changed_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))


class ArchProteinsequenceannotation(Base):
    __tablename__ = 'arch_proteinsequenceannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'taxonomy_id', 'contig_id', 'genomerelease_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(BigInteger, nullable=False)
    source_id = Column(BigInteger, nullable=False, index=True)
    taxonomy_id = Column(BigInteger, nullable=False, index=True)
    reference_id = Column(BigInteger, index=True)
    bud_id = Column(BigInteger)
    contig_id = Column(ForeignKey(u'nex.arch_contig.contig_id', ondelete=u'CASCADE'), nullable=False, index=True)
    seq_version = Column(DateTime)
    genomerelease_id = Column(BigInteger, index=True)
    file_header = Column(String(200))
    download_filename = Column(String(200))
    file_id = Column(BigInteger, index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))

    contig = relationship(u'ArchContig')


class Authorresponse(Base):
    __tablename__ = 'authorresponse'
    __table_args__ = {u'schema': 'nex'}

    curation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.curation_seq'::regclass)"))
    reference_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, unique=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), index=True)
    author_email = Column(String(100), nullable=False)
    has_novel_research = Column(Boolean, nullable=False)
    has_large_scale_data = Column(Boolean, nullable=False)
    has_fast_track_tag = Column(Boolean, nullable=False)
    curator_checked_datasets = Column(Boolean, nullable=False)
    curator_checked_genelist = Column(Boolean, nullable=False)
    no_action_required = Column(Boolean, nullable=False)
    research_results = Column(Text)
    gene_list = Column(String(4000))
    dataset_description = Column(String(4000))
    other_description = Column(String(4000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    reference = relationship(u'Dbentity', uselist=False)
    source = relationship(u'Source')


class Bindingmotifannotation(Base):
    __tablename__ = 'bindingmotifannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'motif_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    obj_url = Column(String(500), nullable=False)
    motif_id = Column(BigInteger, nullable=False)
    logo_url = Column(String(500), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Book(Base):
    __tablename__ = 'book'
    __table_args__ = (
        UniqueConstraint('title', 'volume_title'),
        {u'schema': 'nex'}
    )

    book_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    title = Column(String(200), nullable=False)
    volume_title = Column(String(200))
    isbn = Column(String(20))
    total_pages = Column(Integer)
    publisher = Column(String(100))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class Chebi(Base):
    __tablename__ = 'chebi'
    __table_args__ = {u'schema': 'nex'}

    chebi_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    chebiid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')

    def to_dict(self):
        urls = DBSession.query(ChebiUrl).filter_by(chebi_id=self.chebi_id).all()
        
        obj = {
            "id": self.chebi_id,
            "display_name": self.display_name,
            "chebi_id": self.chebiid,
            "urls": [url.to_dict() for url in urls]
        }

        return obj

    def phenotype_to_dict(self):
        conditions = DBSession.query(PhenotypeannotationCond.annotation_id).filter_by(condition_name=self.display_name).all()

        phenotype_annotations = DBSession.query(Phenotypeannotation).filter(Phenotypeannotation.annotation_id.in_(conditions)).all()

        obj = []
        
        for annotation in phenotype_annotations:
            obj += annotation.to_dict(chemical=self)

        return obj

class ChebiAlia(Base):
    __tablename__ = 'chebi_alias'
    __table_args__ = (
        UniqueConstraint('chebi_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    chebi_id = Column(ForeignKey(u'nex.chebi.chebi_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    chebi = relationship(u'Chebi')
    source = relationship(u'Source')


class ChebiUrl(Base):
    __tablename__ = 'chebi_url'
    __table_args__ = (
        UniqueConstraint('chebi_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    chebi_id = Column(ForeignKey(u'nex.chebi.chebi_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    chebi = relationship(u'Chebi')
    source = relationship(u'Source')

    def to_dict(self):
        return {
            "link": self.obj_url
        }
    
class Colleague(Base):
    __tablename__ = 'colleague'
    __table_args__ = {u'schema': 'nex'}

    colleague_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    orcid = Column(String(20), unique=True)
    first_name = Column(String(40), nullable=False)
    middle_name = Column(String(20))
    last_name = Column(String(40), nullable=False)
    suffix = Column(String(4))
    other_last_name = Column(String(40))
    profession = Column(String(100))
    job_title = Column(String(100))
    institution = Column(String(100))
    address1 = Column(String(100))
    address2 = Column(String(100))
    address3 = Column(String(100))
    city = Column(String(50))
    state = Column(String(50))
    country = Column(String(40))
    postal_code = Column(String(40))
    work_phone = Column(String(40))
    other_phone = Column(String(40))
    email = Column(String(100))
    is_pi = Column(Boolean, nullable=False)
    is_contact = Column(Boolean, nullable=False)
    is_beta_tester = Column(Boolean, nullable=False)
    display_email = Column(Boolean, nullable=False)
    date_last_modified = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    colleague_note = Column(String(1000))
    research_interest = Column(String(4000))

    source = relationship(u'Source')

    def _include_keywords_to_dict(self, colleague_dict):
        keyword_ids = DBSession.query(ColleagueKeyword.keyword_id).filter(ColleagueKeyword.colleague_id == self.colleague_id).all()
        if len(keyword_ids) > 0:
            ids_query = [k[0] for k in keyword_ids]
            keywords = DBSession.query(Keyword).filter(Keyword.keyword_id.in_(ids_query)).all()
            colleague_dict['keywords'] = [{'id': k.keyword_id, 'name': k.display_name} for k in keywords]
    

class ColleagueKeyword(Base):
    __tablename__ = 'colleague_keyword'
    __table_args__ = (
        UniqueConstraint('keyword_id', 'colleague_id'),
        {u'schema': 'nex'}
    )

    colleague_keyword_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False, index=True)
    keyword_id = Column(ForeignKey(u'nex.keyword.keyword_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')


class ColleagueLocus(Base):
    __tablename__ = 'colleague_locus'
    __table_args__ = (
        UniqueConstraint('colleague_id', 'locus_id'),
        {u'schema': 'nex'}
    )

    colleague_locus_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class ColleagueReference(Base):
    __tablename__ = 'colleague_reference'
    __table_args__ = (
        UniqueConstraint('colleague_id', 'reference_id'),
        {u'schema': 'nex'}
    )

    colleague_reference_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class ColleagueRelation(Base):
    __tablename__ = 'colleague_relation'
    __table_args__ = (
        UniqueConstraint('colleague_id', 'associate_id', 'association_type'),
        {u'schema': 'nex'}
    )

    colleague_relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False)
    associate_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False, index=True)
    association_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    associate = relationship(u'Colleague', primaryjoin='ColleagueRelation.associate_id == Colleague.colleague_id')
    colleague = relationship(u'Colleague', primaryjoin='ColleagueRelation.colleague_id == Colleague.colleague_id')
    source = relationship(u'Source')


class ColleagueUrl(Base):
    __tablename__ = 'colleague_url'
    __table_args__ = (
        UniqueConstraint('colleague_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    source = relationship(u'Source')


class Colleaguetriage(Base):
    __tablename__ = 'colleaguetriage'
    __table_args__ = {u'schema': 'nex'}

    curation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.curation_seq'::regclass)"))
    triage_type = Column(String(10), nullable=False)
    colleague_id = Column(BigInteger)
    colleague_data = Column(Text, nullable=False)
    curator_comment = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)


class Contig(Base):
    __tablename__ = 'contig'
    __table_args__ = {u'schema': 'nex'}

    contig_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    so_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False, index=True)
    centromere_start = Column(Integer)
    centromere_end = Column(Integer)
    genbank_accession = Column(String(40), nullable=False)
    gi_number = Column(String(40))
    refseq_id = Column(String(40))
    reference_chromosome_id = Column(BigInteger)
    reference_start = Column(Integer)
    reference_end = Column(Integer)
    reference_percent_identity = Column(Float(53))
    reference_alignment_length = Column(Integer)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'nex.genomerelease.genomerelease_id', ondelete=u'CASCADE'), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    file = relationship(u'Filedbentity')
    genomerelease = relationship(u'Genomerelease')
    so = relationship(u'So')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict_sequence_widget(self):        
        return {
            "display_name": self.display_name,
            "format_name": self.format_name,
            "is_chromosome": self.so_id == 264265 # soid = SO:0000340 = Chromosome
        }
    
    def to_dict(self, chromosome_cache):
        obj = {
            "display_name": self.display_name,
            "format_name": self.format_name,
            "genbank_accession": self.genbank_accession,
            "link": self.obj_url,
            "reference_alignment": None,
            "centromere_end": self.centromere_end,
            "centromere_start": self.centromere_start,
            "length": self.reference_alignment_length,
            "id": self.contig_id,
            "refseq_id": self.refseq_id
        }

        if self.reference_chromosome_id != None:
            if chromosome_cache.get(self.reference_chromosome_id):
                chromosome = chromosome_cache.get(self.reference_chromosome_id)
            else:
                chromosome = DBSession.query(Contig.format_name, Contig.obj_url).filter_by(contig_id=self.reference_chromosome_id).one_or_none()
                chromosome_cache[self.reference_chromosome_id] = chromosome
            
            if chromosome:
                obj['reference_alignment'] = {
                    "percent_identity": self.reference_percent_identity,
                    "start": self.reference_start,
                    "end": self.reference_end,
                    "alignment_length": self.reference_alignment_length,
                    "chromosome": {
                        "format_name": chromosome[0],
                        "link": chromosome[1]
                    }
                }

        return obj


class ContigUrl(Base):
    __tablename__ = 'contig_url'
    __table_args__ = (
        UniqueConstraint('contig_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    contig_id = Column(ForeignKey(u'nex.contig.contig_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    contig = relationship(u'Contig')
    source = relationship(u'Source')


class Contignoteannotation(Base):
    __tablename__ = 'contignoteannotation'
    __table_args__ = (
        UniqueConstraint('contig_id', 'note_type', 'display_name', 'note'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    contig_id = Column(ForeignKey(u'nex.contig.contig_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    bud_id = Column(Integer)
    note_type = Column(String(40), nullable=False)
    display_name = Column(String(500), nullable=False)
    note = Column(String(2000), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    contig = relationship(u'Contig')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class CurationLocus(Base):
    __tablename__ = 'curation_locus'
    __table_args__ = (
        UniqueConstraint('curation_tag', 'locus_id'),
        {u'schema': 'nex'}
    )

    curation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.curation_seq'::regclass)"))
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    curation_tag = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    curator_comment = Column(String(2000))
    json = Column(Text)

    locus = relationship(u'Locusdbentity', foreign_keys=[locus_id])
    source = relationship(u'Source')

    acceptable_tags = {
        'go_needs_review': 'GO needs review',
        'headline_reviewed': 'Headline reviewed',
        'paragraph_not_needed': 'Paragraph not needed',
        'phenotype_uncuratable': 'Phenotype uncuratable'
    }

    @staticmethod
    def factory(tag, gene_id_list, comment, created_by, source_id=824, json=None):
        if tag not in acceptable_tags:
            return None
        
        obj = []
        for dbentity_id in gene_id_list:
            obj.append(
                CurationLocus(
                    locus_id=dbentity_id,
                    source_id=source_id,
                    curation_tag=acceptable_tags[tag],
                    created_by=created_by,
                    json=json
                )
            )
        return obj


class CurationReference(Base):
    __tablename__ = 'curation_reference'
    __table_args__ = (
        UniqueConstraint('reference_id', 'curation_tag', 'locus_id'),
        {u'schema': 'nex'}
    )

    curation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.curation_seq'::regclass)"))
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    curation_tag = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    curator_comment = Column(String(2000))
    json = Column(Text)

    locus = relationship(u'Locusdbentity', foreign_keys=[locus_id])
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')

    acceptable_tags = {
        'high_priority': 'High Priority',
        'delay': 'Delay',
        'homology_disease': 'Homology/Disease',
        'go': 'GO information',
        'classical_phenotype': 'Classical phenotype information',
        'headline_information': 'Headline information',
        'gene_model': 'Gene model',
        'headline_needs_review': 'Headline needs review',
        'not_yet_curated': 'Not yet curated',
        'paragraph_needs_review': 'Paragraph needs review',
        'pathways': 'Pathways',
        'phenotype_needs_review': 'Phenotype needs review',
        'ptm': 'Post-translational modifications',
        'regulation_information': 'Regulation information',
        'fast_track': 'Fast Track'
    }
    
    @staticmethod
    def factory(reference_id, tag, comment, dbentity_id, created_by, source_id=824, json=None):
        if tag not in CurationReference.acceptable_tags:
            return None

        return CurationReference(
            reference_id=reference_id,
            source_id=source_id,
            locus_id=dbentity_id,
            curation_tag=CurationReference.acceptable_tags[tag],
            created_by=created_by,
            curator_comment=comment,
            json=json
        )

    def to_dict(self):
        obj = {
            "tag": self.curation_tag,
            "locus": None,
            "comment": self.curator_comment
        }

        if self.locus:
            obj['locus'] = {
                "display_name": self.locus.display_name,
                "link": self.locus.obj_url
            }

        return obj

class Dataset(Base):
    __tablename__ = 'dataset'
    __table_args__ = {u'schema': 'nex'}

    dataset_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    dbxref_id = Column(String(40))
    dbxref_type = Column(String(40))
    date_public = Column(DateTime)
    parent_dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), index=True)
    assay_id = Column(ForeignKey(u'nex.obi.obi_id', ondelete=u'CASCADE'), nullable=False, index=True)
    channel_count = Column(SmallInteger)
    sample_count = Column(Integer, nullable=False)
    is_in_spell = Column(Boolean, nullable=False)
    is_in_browser = Column(Boolean, nullable=False)
    description = Column(String(4000))
    date_created = Column(DateTime, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    assay = relationship(u'Obi')
    parent_dataset = relationship(u'Dataset', remote_side=[dataset_id])
    source = relationship(u'Source')

    def to_dict(self, reference=None, dataset_keywords=None, add_conditions=False, add_resources=False):
        keywords = DBSession.query(DatasetKeyword).filter_by(dataset_id=self.dataset_id).all()

        tags = [keyword.to_dict() for keyword in keywords]

        obj = {
            "id": self.dataset_id,
            "display_name": self.display_name,
            "link": self.obj_url,
            "short_description": self.description,
            "condition_count": self.sample_count,
            "channel_count": self.channel_count,
            "geo_id": self.dbxref_id,
            "tags": tags
        }

        if reference:
            obj["reference"] = {
                "display_name": reference.display_name,
                "link": reference.obj_url,
                "pubmed_id": reference.pmid,
                "id": reference.dbentity_id
            }
        else:
            references = DBSession.query(DatasetReference).filter_by(dataset_id=self.dataset_id).all()

            if len(references) < 1:
                obj["reference"] = {}

            else:
                reference = references[0].reference

                obj["reference"] = {
                    "display_name": reference.display_name,
                    "link": reference.obj_url,
                    "pubmed_id": reference.pmid,
                    "id": reference.dbentity_id
                }
            
                abstract = DBSession.query(Referencedocument.html).filter_by(reference_id=reference.dbentity_id, document_type="Abstract").one_or_none()
                if abstract:
                    obj["reference"]["abstract"] = {
                        "text": abstract[0]
                    }

        if add_conditions:
            conditions = DBSession.query(Datasetsample).filter_by(dataset_id=self.dataset_id).all()

            obj["datasetcolumns"] = []
            for condition in conditions:
                obj["datasetcolumns"].append({
                    "display_name": condition.display_name,
                    "geo_id": condition.dbxref_id,
                    "link": condition.dbxref_url
                })

        if add_resources:
            urls = DBSession.query(DatasetUrl).filter_by(dataset_id=self.dataset_id).all()

            obj["urls"] = []

            files = DBSession.query(DatasetFile).filter_by(dataset_id=self.dataset_id).all()
            for f in files:
                obj["urls"].append({
                    "link": f.file.s3_url,
                    "display_name": "Download data"
                })
            
            for url in urls:
                url_obj = {
                    "link": url.obj_url,
                    "display_name": url.display_name
                }

                if url.url_type == "GEO":
                    url_obj["category"] = "External"
                
                obj["urls"].append(url_obj)

        return obj


class DatasetFile(Base):
    __tablename__ = 'dataset_file'
    __table_args__ = (
        UniqueConstraint('dataset_id', 'file_id'),
        {u'schema': 'nex'}
    )

    dataset_file_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False)
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dataset = relationship(u'Dataset')
    file = relationship(u'Filedbentity', primaryjoin='Filedbentity.dbentity_id == DatasetFile.file_id')
    source = relationship(u'Source')


class DatasetKeyword(Base):
    __tablename__ = 'dataset_keyword'
    __table_args__ = (
        UniqueConstraint('keyword_id', 'dataset_id'),
        {u'schema': 'nex'}
    )

    dataset_keyword_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    keyword_id = Column(ForeignKey(u'nex.keyword.keyword_id', ondelete=u'CASCADE'), nullable=False)
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dataset = relationship(u'Dataset')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')

    def to_dict(self):
        return {
            "display_name": self.keyword.display_name,
            "link": self.keyword.obj_url
        }


class DatasetReference(Base):
    __tablename__ = 'dataset_reference'
    __table_args__ = (
        UniqueConstraint('reference_id', 'dataset_id'),
        {u'schema': 'nex'}
    )

    dataset_reference_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dataset = relationship(u'Dataset')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class DatasetUrl(Base):
    __tablename__ = 'dataset_url'
    __table_args__ = (
        UniqueConstraint('dataset_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dataset = relationship(u'Dataset')
    source = relationship(u'Source')


class Datasetlab(Base):
    __tablename__ = 'datasetlab'
    __table_args__ = (
        UniqueConstraint('lab_name', 'dataset_id'),
        {u'schema': 'nex'}
    )

    datasetlab_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(BigInteger, nullable=False)
    lab_name = Column(String(40), nullable=False)
    lab_location = Column(String(100), nullable=False)
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    dataset = relationship(u'Dataset')


class Datasetsample(Base):
    __tablename__ = 'datasetsample'
    __table_args__ = {u'schema': 'nex'}

    datasetsample_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), index=True)
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False, index=True)
    sample_order = Column(Integer, nullable=False)
    dbxref_id = Column(String(40))
    dbxref_type = Column(String(40))
    biosample = Column(String(500))
    strain_name = Column(String(500))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    dbxref_url = Column(String(12), nullable=False)

    dataset = relationship(u'Dataset')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Datasettrack(Base):
    __tablename__ = 'datasettrack'
    __table_args__ = {u'schema': 'nex'}

    datasettrack_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    dataset_id = Column(ForeignKey(u'nex.dataset.dataset_id', ondelete=u'CASCADE'), nullable=False, index=True)
    track_order = Column(BigInteger, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dataset = relationship(u'Dataset')
    source = relationship(u'Source')


class Dbentity(Base):
    __tablename__ = 'dbentity'
    __table_args__ = (
        UniqueConstraint('format_name', 'subclass'),
        {u'schema': 'nex'}
    )

    dbentity_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id'), nullable=False, index=True)
    bud_id = Column(Integer)
    sgdid = Column(String(20), nullable=False, unique=True)
    subclass = Column(String(40), nullable=False)
    dbentity_status = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')

class Pathwaydbentity(Dbentity):
    __tablename__ = 'pathwaydbentity'
    __table_args__ = {u'schema': 'nex'}

    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    biocyc_id = Column(String(40))


class Referencedbentity(Dbentity):
    __tablename__ = 'referencedbentity'
    __table_args__ = {u'schema': 'nex'}
    __url_segment__ = '/reference/'

    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    method_obtained = Column(String(40), nullable=False)
    publication_status = Column(String(40), nullable=False)
    fulltext_status = Column(String(40), nullable=False)
    citation = Column(String(500), nullable=False, unique=True)
    year = Column(SmallInteger, nullable=False)
    pmid = Column(BigInteger, unique=True)
    pmcid = Column(String(20), unique=True)
    date_published = Column(String(40))
    date_revised = Column(DateTime)
    issue = Column(String(100))
    page = Column(String(40))
    volume = Column(String(40))
    title = Column(String(400))
    doi = Column(String(100))
    journal_id = Column(ForeignKey(u'nex.journal.journal_id', ondelete=u'SET NULL'), index=True)
    book_id = Column(ForeignKey(u'nex.book.book_id', ondelete=u'SET NULL'), index=True)

    book = relationship(u'Book')
    journal = relationship(u'Journal')

    go_blacklist = None

    @staticmethod
    def get_go_blacklist_ids():
        if Referencedbentity.go_blacklist is None:
            Referencedbentity.go_blacklist = DBSession.query(ReferenceAlias.reference_id).filter_by(alias_type="GO reference ID").all()

        return Referencedbentity.go_blacklist

    def to_dict_citation(self):
        obj = {
            "id": self.dbentity_id,
            "display_name": self.display_name,
            "citation": self.citation,
            "pubmed_id": self.pmid,
            "link": self.obj_url,
            "year": self.year,
            "urls": []
        }

        ref_urls = DBSession.query(ReferenceUrl).filter_by(reference_id=self.dbentity_id).all()
        for url in ref_urls:
            obj["urls"].append({
                "display_name": url.display_name,
                "link": url.obj_url,
            })

        return obj
    
    def to_dict_reference_related(self):
        obj = {
            "id": self.dbentity_id,
            "display_name": self.display_name,
            "link": self.obj_url,
            "citation": self.citation,
            "pubmed_id": self.pmid,
            "abstract": None,
            "year": self.year,
            "reftypes": [],
            "urls": []
        }

        ref_urls = DBSession.query(ReferenceUrl).filter_by(reference_id=self.dbentity_id).all()
        for url in ref_urls:
            obj["urls"].append({
                "display_name": url.display_name,
                "link": url.obj_url,                            
            })

        abstract = DBSession.query(Referencedocument.html).filter_by(reference_id=self.dbentity_id, document_type="Abstract").one_or_none()
        if abstract:
            obj["abstract"] = {
                "text": abstract[0]
            }

        reftypes = DBSession.query(Referencetype.display_name).filter_by(reference_id=self.dbentity_id).all()
        for ref in reftypes:
            obj["reftypes"].append({
                "display_name": ref[0]
            })

        return obj
    
    def to_dict(self):
        obj = {
            "display_name": self.display_name,
            "citation": self.citation,
            "abstract": None,
            "link": self.obj_url,
            "pubmed_id": self.pmid,
            "journal": None,
            "sgdid": self.sgdid,
            "year": self.year,
            "id": self.dbentity_id,

            "related_references": [],
            "expression_datasets": []
        }

        if self.pmid != None:
            obj["journal"] = {
                "med_abbr": self.journal.med_abbr
            }

        datasets = DBSession.query(DatasetReference).filter_by(reference_id=self.dbentity_id).all()
        obj["expression_datasets"] = [data.dataset.to_dict(self) for data in datasets]
        
        abstract = DBSession.query(Referencedocument.html).filter_by(reference_id=self.dbentity_id, document_type="Abstract").one_or_none()
        if abstract:
            obj["abstract"] = {
                "text": abstract[0]
            }

        ref_urls = DBSession.query(ReferenceUrl).filter_by(reference_id=self.dbentity_id).all()
        ref_urls_obj = []
        for url in ref_urls:
            ref_urls_obj.append({
                "display_name": url.display_name,
                "link": url.obj_url,                            
            })
        obj["urls"] = ref_urls_obj

        reference_types = DBSession.query(Referencetype.display_name).filter_by(reference_id=self.dbentity_id).all()
        obj["reftypes"] = []
        for typ in reference_types:
            obj["reftypes"].append({
                "display_name": typ[0]
            })
        authors = DBSession.query(Referenceauthor.display_name, Referenceauthor.obj_url).filter_by(reference_id=self.dbentity_id).order_by(Referenceauthor.author_order).all()
        obj["authors"] = []
        for author in authors:
            obj["authors"].append({
                "display_name": author[0],
                "link": author[1]
            })

        reference_relation_parent = DBSession.query(ReferenceRelation).filter_by(parent_id=self.dbentity_id).all()
        for ref in reference_relation_parent:
            obj["related_references"].append(ref.child.to_dict_reference_related())

        reference_relation_child = DBSession.query(ReferenceRelation).filter_by(child_id=self.dbentity_id).all()
        for ref in reference_relation_child:
            obj["related_references"].append(ref.parent.to_dict_reference_related())

        obj["counts"] = {
            "interaction": DBSession.query(Physinteractionannotation).filter_by(reference_id=self.dbentity_id).count() + DBSession.query(Geninteractionannotation).filter_by(reference_id=self.dbentity_id).count(),
            "go": DBSession.query(Goannotation).filter_by(reference_id=self.dbentity_id).count(),
            "phenotype": DBSession.query(Phenotypeannotation).filter_by(reference_id=self.dbentity_id).count(),
            "regulation": DBSession.query(Regulationannotation).filter_by(reference_id=self.dbentity_id).count()
        }

        return obj

    def annotations_to_dict(self):
        obj = []

        annotations = DBSession.query(Literatureannotation).filter_by(reference_id=self.dbentity_id).all()

        for annotation in annotations:
            annotation_dict = annotation.to_dict()
            if annotation_dict["locus"] is not None:
                obj.append(annotation.to_dict())
        
        return obj

    def interactions_to_dict(self):
        obj = []

        interactions = DBSession.query(Physinteractionannotation).filter_by(reference_id=self.dbentity_id).all() + DBSession.query(Geninteractionannotation).filter_by(reference_id=self.dbentity_id).all()

        return [interaction.to_dict(self) for interaction in interactions]

    def go_to_dict(self):
        obj = []

        gos = DBSession.query(Goannotation).filter_by(reference_id=self.dbentity_id).all()

        for go in gos:
            obj += go.to_dict()
            
        return obj

    def phenotype_to_dict(self):
        phenotypes = DBSession.query(Phenotypeannotation).filter_by(reference_id=self.dbentity_id).all()

        obj = []
        for phenotype in phenotypes:
            obj += phenotype.to_dict(reference=self)
        return obj

    def regulation_to_dict(self):
        obj = []

        regulations = DBSession.query(Regulationannotation).filter_by(reference_id=self.dbentity_id).all()
        
        return [regulation.to_dict(self) for regulation in regulations]

    def get_secondary_cache_urls(self):
        base_url = self.get_base_url()
        url1 = base_url + '/literature_details'
        return [url1]
    
class Filedbentity(Dbentity):
    __tablename__ = 'filedbentity'
    __table_args__ = {u'schema': 'nex'}

    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    topic_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False, index=True)
    data_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False, index=True)
    format_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False, index=True)
    file_extension = Column(String(10), nullable=False)
    file_date = Column(DateTime, nullable=False)
    is_public = Column(Boolean, nullable=False)
    is_in_spell = Column(Boolean, nullable=False)
    is_in_browser = Column(Boolean, nullable=False)
    md5sum = Column(String(32), index=True)
    readme_file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    previous_file_name = Column(String(100))
    s3_url = Column(String(500))
    description = Column(String(4000))
    json = Column(Text)
    year = Column(SmallInteger, nullable=False)

    data = relationship(u'Edam', primaryjoin='Filedbentity.data_id == Edam.edam_id')
    format = relationship(u'Edam', primaryjoin='Filedbentity.format_id == Edam.edam_id')
    readme_file = relationship(u'Filedbentity', foreign_keys=[dbentity_id])
    topic = relationship(u'Edam', primaryjoin='Filedbentity.topic_id == Edam.edam_id')


class Locusdbentity(Dbentity):
    __tablename__ = 'locusdbentity'
    __table_args__ = {u'schema': 'nex'}
    __url_segment__ = '/locus/'

    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    systematic_name = Column(String(40), nullable=False, unique=True)
    gene_name = Column(String(20))
    qualifier = Column(String(40))
    genetic_position = Column(Float)
    name_description = Column(String(100))
    headline = Column(String(70))
    description = Column(String(500))
    has_summary = Column(Boolean, nullable=False)
    has_sequence = Column(Boolean, nullable=False)
    has_history = Column(Boolean, nullable=False)
    has_literature = Column(Boolean, nullable=False)
    has_go = Column(Boolean, nullable=False)
    has_phenotype = Column(Boolean, nullable=False)
    has_interaction = Column(Boolean, nullable=False)
    has_expression = Column(Boolean, nullable=False)
    has_regulation = Column(Boolean, nullable=False)
    has_protein = Column(Boolean, nullable=False)
    has_sequence_section = Column(Boolean, nullable=False)

    def sequence_details(self):
        dnas = DBSession.query(Dnasequenceannotation).filter_by(dbentity_id=self.dbentity_id).all()

        obj = {
            "genomic_dna": [],
            "coding_dna": [],
            "protein": [],
            "1kb": []
        }

        for dna in dnas:
            dna_dict = dna.to_dict()

            if dna_dict:
                if dna.dna_type == "GENOMIC":
                    obj["genomic_dna"].append(dna_dict)
                elif dna.dna_type == "CODING":
                    obj["coding_dna"].append(dna_dict)
                elif dna.dna_type == "1KB":
                    obj["1kb"].append(dna_dict)

        protein_dnas = DBSession.query(Proteinsequenceannotation).filter_by(dbentity_id=self.dbentity_id).all()
        for protein_dna in protein_dnas:
            protein_dna_dict = protein_dna.to_dict()
            if protein_dna_dict:
                obj["protein"].append(protein_dna_dict)

        return obj
    
    def neighbor_sequence_details(self):
        dnas = DBSession.query(Dnasequenceannotation).filter_by(dbentity_id=self.dbentity_id).all()

        obj = {}
        
        for dna in dnas:
            strain = Straindbentity.get_strains_by_taxon_id(dna.taxonomy_id)

            if len(strain) < 1:
                continue

            start = dna.start_index
            end = dna.end_index
            
            midpoint = int(round((start + (end - start)/2)/1000))*1000
            start = max(1, midpoint - 5000)
            end = min(len(dna.contig.residues), start + 10000)

            neighbors = DBSession.query(Dnasequenceannotation).filter_by(dna_type='GENOMIC').filter_by(contig_id=dna.contig_id).filter(Dnasequenceannotation.end_index >= start).filter(Dnasequenceannotation.start_index <= end).all()

            obj[strain[0].display_name] = {
                "start": start,
                "end": end,
                "neighbors": [n.to_dict() for n in neighbors]
            }

        return obj

    def expression_to_dict(self):
        expression_annotations = DBSession.query(Expressionannotation).filter_by(dbentity_id=self.dbentity_id).all()

        dataset_expression_values = {}
        
        reference_ids = {}
        dataset_ids = set()

        histogram_expression_value = {}
        min_expression_value = 0
        max_expression_value = 0
        
        for annotation in expression_annotations:
            dataset = annotation.datasetsample.dataset
            
            dataset_ids.add(dataset.dataset_id)
            reference_ids[dataset.dataset_id] = annotation.reference_id

            if dataset.channel_count == 1:
                try:
                    value = log(annotation.expression_value, 2)
                except ValueError:
                    value = float(annotation.expression_value) # THIS EXCEPTION SHOULD'T HAPPEN!
            else:
                value = float(annotation.expression_value)

            rounded = floor(value)
            if value - rounded >= .5:
                rounded += .5

            if rounded < min_expression_value:
                min_expression_value = rounded
            if rounded > max_expression_value:
                max_expression_value = rounded

            rounded = max(-5.5, min(5, rounded))
            if rounded in histogram_expression_value:
                histogram_expression_value[rounded] += 1
            else:
                histogram_expression_value[rounded] = 1

            if annotation.datasetsample.dataset_id in dataset_expression_values:
                dataset_expression_values[dataset.dataset_id].add(rounded)
            else:
                dataset_expression_values[dataset.dataset_id] = set([rounded])
    
        datasets = DBSession.query(Dataset).filter(Dataset.dataset_id.in_(list(dataset_ids))).all()

        obj = {
            "min_value": min_expression_value,
            "max_value": max_expression_value,
            "overview": histogram_expression_value,
            "datasets": []
        }
        
        for dataset in datasets:
            dataset_dict = dataset.to_dict(DBSession.query(Referencedbentity).filter_by(dbentity_id=reference_ids[dataset.dataset_id]).one_or_none())
            dataset_dict["hist_values"] = sorted(dataset_expression_values[dataset.dataset_id])
            obj["datasets"].append(dataset_dict)

        return obj
    
    def interactions_to_dict(self):
        physical_interactions = DBSession.query(Physinteractionannotation).filter(or_(Physinteractionannotation.dbentity1_id == self.dbentity_id, Physinteractionannotation.dbentity2_id == self.dbentity_id)).all()

        genetic_interactions = DBSession.query(Geninteractionannotation).filter(or_(Geninteractionannotation.dbentity1_id == self.dbentity_id, Geninteractionannotation.dbentity2_id == self.dbentity_id)).all()

        obj = []
        for interaction in physical_interactions + genetic_interactions:
            obj.append(interaction.to_dict())
        
        return obj
    
    def go_to_dict(self):
        go_annotations = DBSession.query(Goannotation).filter_by(dbentity_id=self.dbentity_id).all()

        obj = []

        for go_annotation in go_annotations:
            for annotation in go_annotation.to_dict():
                if annotation not in obj:
                    obj.append(annotation)

        return obj
    
    def literature_graph(self):
        main_gene_lit_annotations = DBSession.query(Literatureannotation).filter((Literatureannotation.dbentity_id==self.dbentity_id) & (Literatureannotation.topic == "Primary Literature")).all()
        main_gene_reference_ids = [a.reference_id for a in main_gene_lit_annotations]

        genes_sharing_references = DBSession.query(Literatureannotation).filter((Literatureannotation.reference_id.in_(main_gene_reference_ids)) & (Literatureannotation.dbentity_id != self.dbentity_id)).all()
        genes_to_references = {}
        for annotation in genes_sharing_references:
            gene = annotation.dbentity_id
            reference = annotation.reference_id
            if gene in genes_to_references:
                genes_to_references[gene].add(reference)
            else:
                genes_to_references[gene] = set([reference])
        
        list_genes_to_references = sorted([(g, genes_to_references[g]) for g in genes_to_references], key=lambda x: len(x[1]), reverse=True)
        
        edges = []
        nodes = {}

        nodes[self.format_name] = {
            "data": {
                "name": self.display_name,
                "id": self.format_name,
                "link": self.obj_url,
                "type": "BIOENTITY",
                "sub_type": "FOCUS",
            }
        }

        edges_added = set([])

        min_cutoff = 99999999
        max_cutoff = 0

        i = 0
        while i < len(list_genes_to_references) and len(nodes) <= 20 and len(edges) <= 50:
            dbentity = DBSession.query(Dbentity.display_name, Dbentity.format_name, Dbentity.obj_url).filter_by(dbentity_id=list_genes_to_references[i][0]).one_or_none()
            reference_ids = list_genes_to_references[i][1]

            if len(reference_ids) > max_cutoff:
                max_cutoff = len(reference_ids)

            if len(reference_ids) < min_cutoff:
                min_cutoff = len(reference_ids)
            
            if dbentity[1] not in nodes:
                nodes[dbentity[1]] = {
                    "data": {
                        "name": dbentity[0],
                        "id": dbentity[1],
                        "link": dbentity[2],
                        "type": "BIOENTITY",
                        "gene_count": len(reference_ids)
                    }
                }                    

            for reference_id in list(reference_ids)[:2]:
                reference = DBSession.query(Referencedbentity).filter_by(dbentity_id=reference_id).one_or_none()

                if reference.format_name not in nodes:
                    nodes[reference.format_name] = {
                        "data": {
                            "name": reference.display_name,
                            "id": reference.format_name,
                            "type": "REFERENCE",
                            "gene_count": len(reference_ids)
                        }
                    }
                
                if (reference.format_name + " " + dbentity[1]) not in edges_added:
                    edges.append({
                        "data": {
                            "source": reference.format_name,
                            "target": dbentity[1]
                        }
                    })
                    edges_added.add(reference.format_name + " " + dbentity[1])

                if (reference.format_name + " " + self.format_name) not in edges_added:
                    edges.append({
                        "data": {
                            "source": reference.format_name,
                            "target": self.format_name
                        }
                    })
                    edges_added.add(reference.format_name + " " + self.format_name)

            i += 1

        nodes[self.format_name]["data"]["gene_count"] = max_cutoff

        if len(list_genes_to_references) == 0:
            min_cutoff = max_cutoff
            
        return {
            "min_cutoff": min_cutoff,
            "max_cutoff": max_cutoff,
            "nodes": [nodes[n] for n in nodes],
            "edges": edges
        }
    
    def literature_to_dict(self):
        obj = {
            "interaction": [],
            "additional": [],
            "review": [],
            "primary": [],
            "regulation": [],
            "phenotype": [],
            "go": []
        }
        
        primary_ids = DBSession.query(Literatureannotation.reference_id).filter((Literatureannotation.dbentity_id == self.dbentity_id) & (Literatureannotation.topic == "Primary Literature")).all()
        primary_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(primary_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()

        for lit in primary_lit:
            obj["primary"].append(lit.to_dict_citation())

        additional_ids = DBSession.query(Literatureannotation.reference_id).filter((Literatureannotation.dbentity_id == self.dbentity_id) & (Literatureannotation.topic == "Additional Literature")).all()
        additional_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(additional_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()
        
        for lit in additional_lit:
            obj["additional"].append(lit.to_dict_citation())

        reviews_ids = DBSession.query(Literatureannotation.reference_id).filter((Literatureannotation.dbentity_id == self.dbentity_id) & (Literatureannotation.topic == "Reviews")).all()
        reviews_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reviews_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()

        for lit in reviews_lit:
            obj["review"].append(lit.to_dict_citation())

        interaction_ids = DBSession.query(Geninteractionannotation.reference_id).filter(or_(Geninteractionannotation.dbentity1_id == self.dbentity_id, Geninteractionannotation.dbentity2_id == self.dbentity_id)).all() + DBSession.query(Physinteractionannotation.reference_id).filter(or_(Physinteractionannotation.dbentity1_id == self.dbentity_id, Physinteractionannotation.dbentity2_id == self.dbentity_id)).all()
        interaction_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(interaction_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()

        for lit in interaction_lit:
            obj["interaction"].append(lit.to_dict_citation())

        regulation_ids = DBSession.query(Regulationannotation.reference_id).filter(or_(Regulationannotation.target_id == self.dbentity_id, Regulationannotation.regulator_id == self.dbentity_id)).all()
        regulation_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(regulation_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()

        for lit in regulation_lit:
            obj["regulation"].append(lit.to_dict_citation())

        apo_ids = DBSession.query(Apo.apo_id).filter_by(namespace_group="classical genetics").all()
        phenotype_ids = DBSession.query(Phenotypeannotation.reference_id).filter(and_(Phenotypeannotation.dbentity_id == self.dbentity_id, Phenotypeannotation.experiment_id.in_(apo_ids))).all()
        phenotype_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(phenotype_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()

        for lit in phenotype_lit:
            obj["phenotype"].append(lit.to_dict_citation())

        go_ids = DBSession.query(Goannotation.reference_id).filter(and_(Goannotation.dbentity_id == self.dbentity_id, Goannotation.annotation_type != "high-throughput")).all()
        go_ids = set(go_ids) - set(Referencedbentity.get_go_blacklist_ids())
        go_lit = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(go_ids)).order_by(Referencedbentity.year.desc(), Referencedbentity.citation.asc()).all()

        for lit in go_lit:
            obj["go"].append(lit.to_dict_citation())

        return obj

    def go_graph(self):
        main_gene_go_annotations = DBSession.query(Goannotation).filter_by(dbentity_id=self.dbentity_id).all()
        main_gene_go_ids = [a.go_id for a in main_gene_go_annotations]

        genes_sharing_go = DBSession.query(Goannotation).filter((Goannotation.go_id.in_(main_gene_go_ids)) & (Goannotation.dbentity_id != self.dbentity_id)).all()
        genes_to_go = {}
        for annotation in genes_sharing_go:
            gene = annotation.dbentity_id
            go = annotation.go_id
            if gene in genes_to_go:
                genes_to_go[gene].add(go)
            else:
                genes_to_go[gene] = set([go])
        
        list_genes_to_go = sorted([(g, genes_to_go[g]) for g in genes_to_go], key=lambda x: len(x[1]), reverse=True)
        
        edges = []
        nodes = {}

        edges_added = set([])

        nodes[self.format_name] = {
            "data": {
                "name": self.display_name,
                "id": self.format_name,
                "link": self.obj_url,
                "type": "BIOENTITY",
                "sub_type": "FOCUS"
            }
        }
        
        min_cutoff = 99999999
        max_cutoff = 0
        
        i = 0
        while i < len(list_genes_to_go) and len(nodes) <= 20 and len(edges) <= 50:
            dbentity = DBSession.query(Dbentity.display_name, Dbentity.format_name, Dbentity.obj_url).filter_by(dbentity_id=list_genes_to_go[i][0]).one_or_none()

            go_ids = list_genes_to_go[i][1]

            if len(go_ids) > max_cutoff:
                max_cutoff = len(go_ids)

            if len(go_ids) < min_cutoff:
                min_cutoff = len(go_ids)
            
            if dbentity[1] not in nodes:
                nodes[dbentity[1]] = {
                    "data": {
                        "name": dbentity[0],
                        "id": dbentity[1],
                        "link": dbentity[2],
                        "type": "BIOENTITY",
                        "gene_count": len(go_ids)
                    }
                }                    
                
            for go_id in go_ids:
                go = DBSession.query(Go).filter_by(go_id=go_id).one_or_none()

                if go.format_name not in nodes:
                    nodes[go.format_name] = {
                        "data": {
                            "name": go.display_name,
                            "id": go.format_name,
                            "type": "GO",
                            "gene_count": len(go_ids)
                        }
                    }
                
                if (go.format_name + " " + dbentity[1]) not in edges_added:
                    edges.append({
                        "data": {
                            "source": go.format_name,
                            "target": dbentity[1]
                        }
                    })
                    edges_added.add(go.format_name + " " + dbentity[1])

                if (go.format_name + " " + self.format_name) not in edges_added:
                    edges.append({
                        "data": {
                            "source": go.format_name,
                            "target": self.format_name
                        }
                    })
                    edges_added.add(go.format_name + " " + self.format_name)

            i += 1

        nodes[self.format_name]["data"]["gene_count"] = max_cutoff

        if len(list_genes_to_go) == 0:
            min_cutoff = max_cutoff
            
        return {
            "min_cutoff": min_cutoff,
            "max_cutoff": max_cutoff,
            "nodes": [nodes[n] for n in nodes],
            "edges": edges
        }

    def interaction_graph_secondary_edges(self, Interaction, edge_type, nodes, edges):
        secondary_nodes = set(nodes.keys()) - set([self.dbentity_id])

        interactions = DBSession.query(Interaction).filter(and_(Interaction.dbentity1_id.in_(secondary_nodes), Interaction.dbentity2_id.in_(secondary_nodes))).all()

        edges_to_annotations = {}
        for annotation in interactions:
            if annotation.dbentity1_id < annotation.dbentity2_id:
                add = str(annotation.dbentity1_id) + "_" + str(annotation.dbentity2_id)
            else:
                add = str(annotation.dbentity2_id) + "_" + str(annotation.dbentity1_id)

            if add in edges_to_annotations:
                edges_to_annotations[add].add(annotation)
            else:
                edges_to_annotations[add] = set([annotation])

        edges_added = set([])

        i = 0
        while i < len(interactions) and len(edges_added) <= 50:
            dbentity1_id = interactions[i].dbentity1_id
            dbentity2_id = interactions[i].dbentity2_id
            
            source = nodes[dbentity1_id]["data"]["id"]
            target = nodes[dbentity2_id]["data"]["id"]

            if dbentity1_id < dbentity2_id:
                key = str(dbentity1_id) + "_" + str(dbentity2_id)
            else:
                key = str(dbentity2_id) + "_" + str(dbentity1_id)
            
            if (source + " " + target) not in edges_added and (target + " " + source) not in edges_added:
                edges.append({
                    "data": {
                        "source": source,
                        "target": target,
                        "class_type": edge_type,
                        "evidence": len(edges_to_annotations[key])
                    }
                })
                edges_added.add(source + " " + target)
            i += 1
    
    def interaction_graph(self):
        phys_graph = self.interaction_graph_builder(Physinteractionannotation, "PHYSICAL")
        gen_graph = self.interaction_graph_builder(Geninteractionannotation, "GENETIC")

        nodes = {}

        for node in phys_graph["nodes"]:
            nodes[node] = phys_graph["nodes"][node]
            nodes[node]["data"]["physical"] = phys_graph["nodes"][node]["data"]["evidence"]

        for node in gen_graph["nodes"]:
            if node not in nodes:
                nodes[node] = gen_graph["nodes"][node]
                nodes[node]["data"]["genetic"] = gen_graph["nodes"][node]["data"]["evidence"]
            else:
                nodes[node]["data"]["genetic"] = gen_graph["nodes"][node]["data"]["evidence"]
                nodes[node]["data"]["evidence"] = max(nodes[node]["data"]["genetic"], nodes[node]["data"]["physical"])

        edges = phys_graph["edges"] + gen_graph["edges"]

        self.interaction_graph_secondary_edges(Physinteractionannotation, "PHYSICAL", nodes, edges)
        self.interaction_graph_secondary_edges(Geninteractionannotation, "GENETIC", nodes, edges)

        # limiting cutoffs by 10. The interface converts > 10 to '+10' to save space

        return {
            "nodes": [nodes[n] for n in nodes],
            "edges": edges,
            "max_phys_cutoff": min(phys_graph["max_evidence_cutoff"], 10),
            "max_gen_cutoff": min(gen_graph["max_evidence_cutoff"], 10),
            "min_evidence_cutoff": min(min(phys_graph["min_evidence_cutoff"], gen_graph["min_evidence_cutoff"]), 10),
            "max_evidence_cutoff": min(max(phys_graph["max_evidence_cutoff"], gen_graph["max_evidence_cutoff"]), 10),
        }
        
    def interaction_graph_builder(self, Interaction, edge_type):
        main_gene_annotations = DBSession.query(Interaction).filter(or_(Interaction.dbentity1_id == self.dbentity_id, Interaction.dbentity2_id == self.dbentity_id)).all()

        genes_to_interactions = {}
        for annotation in main_gene_annotations:
            if annotation.dbentity1_id == self.dbentity_id:
                add = annotation.dbentity2_id
            else:
                add = annotation.dbentity1_id

            if add in genes_to_interactions:
                genes_to_interactions[add].add(annotation.reference_id)
            else:
                genes_to_interactions[add] = set([annotation.reference_id])

        list_genes_to_interactions = sorted([(g, genes_to_interactions[g]) for g in genes_to_interactions], key=lambda x: len(x[1]), reverse=True)

        nodes = {}
        edges = []

        edges_added = set([])

        nodes[self.dbentity_id] = {
            "data": {
                "name": self.display_name,
                "id": self.format_name,
                "link": self.obj_url,
                "type": "BIOENTITY",
                "sub_type": "FOCUS",
                "evidence": 0
            }
        }

        min_cutoff = 99999999
        max_cutoff = 0

        genes_cache_query = DBSession.query(Dbentity.dbentity_id, Dbentity.display_name, Dbentity.format_name, Dbentity.obj_url).filter(Dbentity.dbentity_id.in_(genes_to_interactions.keys())).all()
        genes_cache = {}
        for gene in genes_cache_query:
            genes_cache[gene.dbentity_id] = gene
        
        i = 0
        while i < len(list_genes_to_interactions) and len(nodes) <= 20:
            dbentity_id = list_genes_to_interactions[i][0]
            dbentity = genes_cache[dbentity_id]

            if len(list_genes_to_interactions[i][1]) > max_cutoff:
                max_cutoff = len(list_genes_to_interactions[i][1])

            if len(list_genes_to_interactions[i][1]) < min_cutoff:
                min_cutoff = len(list_genes_to_interactions[i][1])

            if dbentity_id not in nodes:
                nodes[dbentity_id] = {
                    "data": {
                        "name": dbentity.display_name,
                        "id": dbentity.format_name,
                        "link": dbentity.obj_url,
                        "type": "BIOENTITY",
                        "evidence": len(list_genes_to_interactions[i][1])
                    }
                }

            if (self.format_name + " " + dbentity.format_name) not in edges_added or (dbentity.format_name + " " + self.format_name) not in edges_added:
                edges.append({
                    "data": {
                        "source": self.format_name,
                        "target": dbentity.format_name,
                        "class_type": edge_type,
                        "evidence": len(list_genes_to_interactions[i][1])
                    }
                })
                edges_added.add(self.format_name + " " + dbentity.format_name)

            i += 1

        nodes[self.dbentity_id]["data"]["gene_count"] = max_cutoff

        return {
            "nodes": nodes,
            "edges": edges,
            "min_evidence_cutoff": min_cutoff,
            "max_evidence_cutoff": max_cutoff
        }        

    def regulation_graph(self):
        main_gene_annotations = DBSession.query(Regulationannotation).filter(and_((Regulationannotation.direction != None), or_(Regulationannotation.target_id == self.dbentity_id, Regulationannotation.regulator_id == self.dbentity_id))).all()

        genes_to_regulations = {}
        for annotation in main_gene_annotations:
            if annotation.target_id == self.dbentity_id:
                add = annotation.regulator_id
            else:
                add = annotation.target_id

            if add in genes_to_regulations:
                genes_to_regulations[add].append(annotation)
            else:
                genes_to_regulations[add] = [annotation]

        list_genes_to_regulations = sorted([(g, genes_to_regulations[g]) for g in genes_to_regulations], key=lambda x: len(x[1]), reverse=True)

        nodes = {}
        edges = []

        edges_added = set([])

        nodes[self.dbentity_id] = {
            "data": {
                "name": self.display_name,
                "id": self.format_name,
                "link": self.obj_url,
                "type": "BIOENTITY",
                "sub_type": "FOCUS"
            }
        }

        min_cutoff = 99999999

        genes_cache_query = DBSession.query(Dbentity.dbentity_id, Dbentity.display_name, Dbentity.format_name, Dbentity.obj_url).filter(Dbentity.dbentity_id.in_(genes_to_regulations.keys())).all()
        genes_cache = {}
        for gene in genes_cache_query:
            genes_cache[gene.dbentity_id] = gene

        i = 0
        while i < len(list_genes_to_regulations) and len(nodes) <= 20 and len(edges) <= 50:
            dbentity_id = list_genes_to_regulations[i][0]
            dbentity = genes_cache[dbentity_id]

            evidences = set([])
            for annotation in list_genes_to_regulations[i][1]:
                evidences.add(annotation.reference_id)

            min_cutoff = min(min_cutoff, len(evidences))

            sub_type = "TARGET"
            if dbentity_id == list_genes_to_regulations[i][1][0].regulator_id:
                sub_type = "REGULATOR"
            
            if dbentity_id not in nodes:                
                nodes[dbentity_id] = {
                    "data": {
                        "name": dbentity.display_name,
                        "id": dbentity.format_name,
                        "link": dbentity.obj_url,
                        "type": "BIOENTITY",
                        "sub_type": sub_type,
                        "evidence": len(evidences)
                    }
                }

                action = "expression repressed"
                if list_genes_to_regulations[i][1][0].direction == "positive":
                    action = "expression activated"
                
                edges.append({
                    "data": {
                        "action": action,
                        "source": self.format_name,
                        "target": dbentity.format_name,
                        "evidence": len(evidences)
                    }
                })
                edges_added.add(self.format_name + " " + dbentity.format_name)

            i += 1

        reference_ids = set([a.reference_id for a in main_gene_annotations])
        other_regulations = DBSession.query(Regulationannotation).filter(and_(Regulationannotation.reference_id.in_(reference_ids), and_(Regulationannotation.target_id != self.dbentity_id, Regulationannotation.regulator_id != self.dbentity_id))).all()

        other_valid_regulations = []
        for regulation in other_regulations:
            if regulation.target_id in nodes and regulation.regulator_id in nodes:
                other_valid_regulations.append(regulation)

        i = 0
        while i < len(other_valid_regulations) and len(edges) <= 50:
            source = nodes[other_valid_regulations[i].regulator_id]["data"]["id"]
            target = nodes[other_valid_regulations[i].target_id]["data"]["id"]
            evidence = nodes[other_valid_regulations[i].target_id]["data"]["evidence"]
            if nodes[other_valid_regulations[i].regulator_id]["data"]["evidence"] > evidence:
                evidence = nodes[other_valid_regulations[i].regulator_id]["data"]["evidence"]
                
            if (source + " " + target) not in edges_added and (target + " " + source) not in edges_added:
                action = "expression repressed"
                if other_valid_regulations[i].direction == "positive":
                    action = "expression activated"
                
                edges.append({
                    "data": {
                        "action": action,
                        "source": source,
                        "target": target,
                        "evidence": evidence
                    }
                })
                edges_added.add(source + " " + target)
            i += 1

        return {
            "nodes": [nodes[n] for n in nodes],
            "edges": edges,
            "min_evidence_count": min_cutoff
        }

    def expression_graph(self):
        main_gene_expression_annotations = DBSession.query(Expressionannotation).filter_by(dbentity_id=self.dbentity_id).all()
        main_gene_datasetsample_ids = [a.datasetsample_id for a in main_gene_expression_annotations]
        main_genes_dataset_ids = DBSession.query(Datasetsample.datset_id).filter(Datasetsample.datasetsample_id.in_(main_gene_datasetsample_ids)).all()

        # QUESTION: genes sharing datasets via same datasetsample or any datasetsample within the same dataset is valid?

        ##########################################
        
        genes_sharing_datasets = DBSession.query(Goannotation).filter((Goannotation.go_id.in_(main_gene_go_ids)) & (Goannotation.dbentity_id != self.dbentity_id)).all()
        genes_to_go = {}
        for annotation in genes_sharing_go:
            gene = annotation.dbentity_id
            go = annotation.go_id
            if gene in genes_to_go:
                genes_to_go[gene].add(go)
            else:
                genes_to_go[gene] = set([go])
        
        list_genes_to_go = sorted([(g, genes_to_go[g]) for g in genes_to_go], key=lambda x: len(x[1]), reverse=True)
        
        edges = []
        nodes = {}

        edges_added = set([])

        nodes[self.format_name] = {
            "data": {
                "name": self.display_name,
                "id": self.format_name,
                "link": self.obj_url,
                "type": "BIOENTITY",
                "sub_type": "FOCUS"
            }
        }
        
        min_cutoff = 99999999
        max_cutoff = 0
        
        i = 0
        while i < len(list_genes_to_go) and len(nodes) <= 20 and len(edges) <= 50:
            dbentity = DBSession.query(Dbentity.display_name, Dbentity.format_name, Dbentity.obj_url).filter_by(dbentity_id=list_genes_to_go[i][0]).one_or_none()

            go_ids = list_genes_to_go[i][1]

            if len(go_ids) > max_cutoff:
                max_cutoff = len(go_ids)

            if len(go_ids) < min_cutoff:
                min_cutoff = len(go_ids)
            
            if dbentity[1] not in nodes:
                nodes[dbentity[1]] = {
                    "data": {
                        "name": dbentity[0],
                        "id": dbentity[1],
                        "link": dbentity[2],
                        "type": "BIOENTITY",
                        "gene_count": len(go_ids)
                    }
                }                    
                
            for go_id in go_ids:
                go = DBSession.query(Go).filter_by(go_id=go_id).one_or_none()

                if go.format_name not in nodes:
                    nodes[go.format_name] = {
                        "data": {
                            "name": go.display_name,
                            "id": go.format_name,
                            "type": "GO",
                            "gene_count": len(go_ids)
                        }
                    }
                
                if (go.format_name + " " + dbentity[1]) not in edges_added:
                    edges.append({
                        "data": {
                            "source": go.format_name,
                            "target": dbentity[1]
                        }
                    })
                    edges_added.add(go.format_name + " " + dbentity[1])

                if (go.format_name + " " + self.format_name) not in edges_added:
                    edges.append({
                        "data": {
                            "source": go.format_name,
                            "target": self.format_name
                        }
                    })
                    edges_added.add(go.format_name + " " + self.format_name)

            i += 1

        nodes[self.format_name]["data"]["gene_count"] = max_cutoff

        if len(list_genes_to_go) == 0:
            min_cutoff = max_cutoff
            
        return {
            "min_cutoff": min_cutoff,
            "max_cutoff": max_cutoff,
            "nodes": [nodes[n] for n in nodes],
            "edges": edges
        }

    
    def phenotype_graph(self):
        main_gene_phenotype_annotations = DBSession.query(Phenotypeannotation).filter_by(dbentity_id=self.dbentity_id).all()
        main_gene_phenotype_ids = [a.phenotype_id for a in main_gene_phenotype_annotations]

        genes_sharing_phenotypes = DBSession.query(Phenotypeannotation).filter((Phenotypeannotation.phenotype_id.in_(main_gene_phenotype_ids)) & (Phenotypeannotation.dbentity_id != self.dbentity_id)).all()
        genes_to_phenotypes = {}
        for annotation in genes_sharing_phenotypes:
            gene = annotation.dbentity_id
            phenotype = annotation.phenotype_id
            if gene in genes_to_phenotypes:
                genes_to_phenotypes[gene].add(phenotype)
            else:
                genes_to_phenotypes[gene] = set([phenotype])
        
        list_genes_to_phenotypes = sorted([(g, genes_to_phenotypes[g]) for g in genes_to_phenotypes], key=lambda x: len(x[1]), reverse=True)
        
        edges = []
        nodes = {}

        edges_added = set([])

        nodes[self.format_name] = {
            "data": {
                "name": self.display_name,
                "id": self.format_name,
                "link": self.obj_url,
                "type": "BIOENTITY",
                "sub_type": "FOCUS"
            }
        }
        
        min_cutoff = 99999999
        max_cutoff = 0
        
        i = 0
        while i < len(list_genes_to_phenotypes) and len(nodes) <= 20 and len(edges) <= 50:
            dbentity = DBSession.query(Dbentity.display_name, Dbentity.format_name, Dbentity.obj_url).filter_by(dbentity_id=list_genes_to_phenotypes[i][0]).one_or_none()

            observable_ids = DBSession.query(distinct(Phenotype.observable_id)).filter(Phenotype.phenotype_id.in_(list_genes_to_phenotypes[i][1])).all()

            if len(observable_ids) > max_cutoff:
                max_cutoff = len(observable_ids)

            if len(observable_ids) < min_cutoff:
                min_cutoff = len(observable_ids)
            
            if dbentity[1] not in nodes:
                nodes[dbentity[1]] = {
                    "data": {
                        "name": dbentity[0],
                        "id": dbentity[1],
                        "link": dbentity[2],
                        "type": "BIOENTITY",
                        "gene_count": len(observable_ids)
                    }
                }                    
                
            for observable_id in observable_ids:
                observable = Apo.get_apo_by_id(observable_id[0])

                if observable.format_name not in nodes:
                    nodes[observable.format_name] = {
                        "data": {
                            "name": observable.display_name,
                            "id": observable.format_name,
                            "type": "OBSERVABLE",
                            "gene_count": len(observable_ids)
                        }
                    }
                
                if (observable.format_name + " " + dbentity[1]) not in edges_added:
                    edges.append({
                        "data": {
                            "source": observable.format_name,
                            "target": dbentity[1]
                        }
                    })
                    edges_added.add(observable.format_name + " " + dbentity[1])

                if (observable.format_name + " " + self.format_name) not in edges_added:
                    edges.append({
                        "data": {
                            "source": observable.format_name,
                            "target": self.format_name
                        }
                    })
                    edges_added.add(observable.format_name + " " + self.format_name)

            i += 1

        nodes[self.format_name]["data"]["gene_count"] = max_cutoff

        if len(list_genes_to_phenotypes) == 0:
            min_cutoff = max_cutoff
            
        return {
            "min_cutoff": min_cutoff,
            "max_cutoff": max_cutoff,
            "nodes": [nodes[n] for n in nodes],
            "edges": edges
        }
    
    def phenotype_to_dict(self):
        phenotype_annotations = DBSession.query(Phenotypeannotation).filter_by(dbentity_id=self.dbentity_id).all()

        conditions = DBSession.query(PhenotypeannotationCond).filter(PhenotypeannotationCond.annotation_id.in_([p.annotation_id for p in phenotype_annotations])).all()
        condition_names = set([c.condition_name for c in conditions])

        conditions_dict = {}
        for condition in conditions:
            if condition.annotation_id in conditions_dict:
                conditions_dict[condition.annotation_id].append(condition)
            else:
                conditions_dict[condition.annotation_id] = [condition]

        urls = DBSession.query(Chebi.display_name, Chebi.obj_url).filter(Chebi.display_name.in_(list(condition_names))).all()
        chebi_urls = {}
        for url in urls:
            chebi_urls[url[0]] = url[1]
        
        obj = []
        for annotation in phenotype_annotations:
            obj += annotation.to_dict(locus=self, conditions=conditions_dict.get(annotation.annotation_id, []), chebi_urls=chebi_urls)
        return obj

    def to_dict_analyze(self):
        return {
            "id": self.dbentity_id,
            "display_name": self.display_name,
            "link": self.obj_url,
            "description": self.description,
            "format_name": self.format_name
        }

    def to_dict_sequence_widget(self):
        obj = {
            "id": self.dbentity_id,
            "display_name": self.display_name,
            "format_name": self.format_name,
            "headline": self.headline,
            "link": self.obj_url
        }
        
        sos = DBSession.query(Dnasequenceannotation.so_id).filter_by(dbentity_id=self.dbentity_id).group_by(Dnasequenceannotation.so_id).all()
        locus_type = DBSession.query(So.display_name).filter(So.so_id.in_([so[0] for so in sos])).all()
        obj["locus_type"] = ",".join([l[0] for l in locus_type])

        return obj
        
    
    def to_dict(self):
        obj = {
            "id": self.dbentity_id,
            "display_name": self.display_name,
            "format_name": self.format_name,
            "link": self.obj_url,
            "sgdid": self.sgdid,
            "qualities": {
                "gene_name": {
                    "references": []
                },
                "feature_type": {
                    "references": []
                },
                "qualifier": {
                    "references": []
                },
                "description": {
                    "references": []
                },
                "name_description": {
                    "references": []
                }
            },
            "aliases": [],
            "references": [],
            "locus_type": None,
            "qualifier": self.qualifier,
            "bioent_status": self.dbentity_status,
            "description": self.description,
            "name_description": self.name_description,
            "paralogs": [],
            "urls": [],
            "protein_overview": self.protein_overview_to_dict(),
            "go_overview": self.go_overview_to_dict(),
            "pathways": [],
            "phenotype_overview": self.phenotype_overview_to_dict(),
            "interaction_overview": self.interaction_overview_to_dict(),
            "regulation_overview": self.regulation_overview_to_dict(),
            "paragraph": {
                "date_edited": None
            },
            "literature_overview": self.literature_overview_to_dict()
        }

        aliases = DBSession.query(LocusAlias.display_name, LocusAlias.alias_type).filter(LocusAlias.locus_id == self.dbentity_id, LocusAlias.alias_type.in_(["Uniform", "Non-uniform", "NCBI protein name"])).all()
        for alias in aliases:
            category = ""
            
            if alias[1] == "Uniform" or alias[1] == "Non-uniform":
                category = "Alias"
            elif alias[1] == "NCBI protein name":
                category = "Gene product"
                
            obj["aliases"].append({
                "display_name": alias[0],
                "category": category,
                "references": []
            })

        sos = DBSession.query(Dnasequenceannotation.so_id).filter_by(dbentity_id=self.dbentity_id).group_by(Dnasequenceannotation.so_id).all()
        locus_type = DBSession.query(So.display_name).filter(So.so_id.in_([so[0] for so in sos])).all()
        obj["locus_type"] = ",".join([l[0] for l in locus_type])
        
        summary = DBSession.query(Locussummary.summary_id, Locussummary.html, Locussummary.date_created).filter_by(locus_id=self.dbentity_id, summary_type="Gene").all()
        if len(summary) > 0:
            text = ""
            for s in summary:
                text += s[1]
            obj["paragraph"] = {
                "text": text,
                "date_edited": summary[-1][2].strftime("%Y-%m-%d")
            }

        summary_references = DBSession.query(LocussummaryReference).filter(LocussummaryReference.summary_id.in_([s[0] for s in summary])).order_by(LocussummaryReference.reference_order).all()
        obj["references"] = [s.reference.to_dict_citation() for s in summary_references]
        
        urls = DBSession.query(LocusUrl).filter_by(locus_id=self.dbentity_id).all()
        obj["urls"] = [u.to_dict() for u in urls]

        locus_notes = DBSession.query(Locusnoteannotation).filter_by(dbentity_id=self.dbentity_id).all()
        if len(locus_notes) > 0:
            obj["history"] = []
        for note in locus_notes:
            obj["history"].append({
                "note": note.note,
                "date_created": note.date_created.strftime("%Y-%m-%d"),
#                "references": [{
#                    "display_name": note.reference.display_name,
#                    "link": note.reference.obj_url,
#                    "pubmed_id": note.reference.pmid
#                }]
            })
        
        return obj

    def regulation_overview_to_dict(self):
        return {
            "regulator_count": DBSession.query(Regulationannotation).filter_by(target_id=self.dbentity_id).count(),
            "target_count": DBSession.query(Regulationannotation).filter_by(regulator_id=self.dbentity_id).count()
        }

    def protein_overview_to_dict(self):
        obj = {
            "length": 0,
            "molecular_weight": None,
            "pi": None
        }

        protein = DBSession.query(Proteinsequenceannotation).filter_by(dbentity_id=self.dbentity_id, taxonomy_id=274901).one_or_none()
        if protein:
            protein_sequence = DBSession.query(ProteinsequenceDetail).filter_by(annotation_id=protein.annotation_id).one_or_none()
            if protein_sequence:
                obj = protein_sequence.to_dict_lsp()
            else:
                obj["length"] = len(protein.residues) - 1

        return obj

    def phenotype_overview_to_dict(self):
        obj = {
            "paragraph": None,
            "classical_phenotypes": {},
            "large_scale_phenotypes": {}
        }

        phenotype_summary = DBSession.query(Locussummary.html).filter_by(locus_id=self.dbentity_id, summary_type="Phenotype").one_or_none()
        if phenotype_summary:
            obj["paragraph"] = phenotype_summary[0]

        phenotype_annotations = DBSession.query(Phenotypeannotation).filter_by(dbentity_id=self.dbentity_id).all()

        for annotation in phenotype_annotations:
            json = annotation.to_dict_lsp()
            
            if json["mutant"] in obj[json["experiment_category"]]:
                if json["phenotype"]["display_name"] not in [p["display_name"] for p in obj[json["experiment_category"]][json["mutant"]]]:
                    obj[json["experiment_category"]][json["mutant"]].append(json["phenotype"])
            else:
                obj[json["experiment_category"]][json["mutant"]] = [json["phenotype"]]

        counts = Phenotypeannotation.create_count_overview(None, phenotype_annotations=phenotype_annotations)
        obj["strains"] = counts["strains"]
        obj["experiment_categories"] = counts["experiment_categories"]

        return obj

    def literature_overview_to_dict(self):
        obj = {
            "primary_count": 0,
            "additional_count": 0,
            "review_count": 0,
            "total_count": 0
        }

        literature_counts = DBSession.query(Literatureannotation.topic, func.count(Literatureannotation.annotation_id)).filter_by(dbentity_id=self.dbentity_id).group_by(Literatureannotation.topic).all()

        for lit_count in literature_counts:
            if lit_count[0] == "Additional Literature":
                obj["additional_count"] = lit_count[1]
            elif lit_count[0] == "Reviews":
                obj["review_count"] = lit_count[1]
            elif lit_count[0] == "Primary Literature":
                obj["primary_count"] = lit_count[1]

        literature_ids = DBSession.query(Literatureannotation.reference_id).filter_by(dbentity_id=self.dbentity_id).all()

        interaction_ids = DBSession.query(Geninteractionannotation.reference_id).filter(or_(Geninteractionannotation.dbentity1_id == self.dbentity_id, Geninteractionannotation.dbentity2_id == self.dbentity_id)).all() + DBSession.query(Physinteractionannotation.reference_id).filter(or_(Physinteractionannotation.dbentity1_id == self.dbentity_id, Physinteractionannotation.dbentity2_id == self.dbentity_id)).all()

        regulation_ids = DBSession.query(Regulationannotation.reference_id).filter(or_(Regulationannotation.target_id == self.dbentity_id, Regulationannotation.regulator_id == self.dbentity_id)).all()

        phenotype_ids = DBSession.query(Phenotypeannotation.reference_id).filter_by(dbentity_id= self.dbentity_id).all()
        
        go_ids = DBSession.query(Goannotation.reference_id).filter_by(dbentity_id=self.dbentity_id).all()
        go_ids = set(go_ids) - set(Referencedbentity.get_go_blacklist_ids())
            
        obj["total_count"] = len(set(literature_ids + interaction_ids + regulation_ids + phenotype_ids + list(go_ids)))

        return obj
    
    def interaction_overview_to_dict(self):
        from .helpers import calc_venn_measurements
        
        obj = {
            "total_interactions": 0,
            "total_interactors": 0,
            "num_phys_interactors": 0,
            "num_gen_interactors": 0,
            "num_both_interactors": 0,
            "physical_experiments": {},
            "genetic_experiments": {},
            "total_interactions": 0,
            "gen_circle_size": 0,
            "phys_circle_size": 0,
            "circle_distance": 0
        }

        physical_interactions = DBSession.query(Physinteractionannotation.biogrid_experimental_system, func.count(Physinteractionannotation.annotation_id)).filter(or_(Physinteractionannotation.dbentity1_id == self.dbentity_id, Physinteractionannotation.dbentity2_id == self.dbentity_id)).group_by(Physinteractionannotation.biogrid_experimental_system).all()

        genetic_interactions = DBSession.query(Geninteractionannotation.biogrid_experimental_system, func.count(Geninteractionannotation.annotation_id)).filter(or_(Geninteractionannotation.dbentity1_id == self.dbentity_id, Geninteractionannotation.dbentity2_id == self.dbentity_id)).group_by(Geninteractionannotation.biogrid_experimental_system).all()
        
        physical_interactors_1 = DBSession.query(Physinteractionannotation.dbentity2_id).distinct(Physinteractionannotation.dbentity2_id).filter_by(dbentity1_id=self.dbentity_id).all()
        physical_interactors_2 = DBSession.query(Physinteractionannotation.dbentity1_id).distinct(Physinteractionannotation.dbentity1_id).filter_by(dbentity2_id=self.dbentity_id).all()
        genetic_interactors_1 = DBSession.query(Geninteractionannotation.dbentity2_id).distinct(Geninteractionannotation.dbentity2_id).filter(Geninteractionannotation.dbentity1_id==self.dbentity_id).all()
        genetic_interactors_2 = DBSession.query(Geninteractionannotation.dbentity1_id).distinct(Geninteractionannotation.dbentity1_id).filter(Geninteractionannotation.dbentity2_id==self.dbentity_id).all()
        
        for interaction in physical_interactions:
            obj["physical_experiments"][interaction[0]] = interaction[1]
            obj["total_interactions"] += interaction[1]

        for interaction in genetic_interactions:
            obj["genetic_experiments"][interaction[0]] = interaction[1]
            obj["total_interactions"] += interaction[1]

        physical_interactors = set(physical_interactors_1 + physical_interactors_2)
        genetic_interactors = set(genetic_interactors_1 + genetic_interactors_2)

        obj["num_both_interactors"] = len(physical_interactors.intersection(genetic_interactors))
        obj["num_phys_interactors"] = len(physical_interactors)
        obj["num_gen_interactors"] = len(genetic_interactors)
        obj["total_interactors"] =  obj["num_phys_interactors"] + obj["num_gen_interactors"] - obj["num_both_interactors"]

        x, y, z = calc_venn_measurements(obj["num_gen_interactors"], obj["num_phys_interactors"], obj["num_both_interactors"])
        obj["gen_circle_size"], obj["phys_circle_size"], obj["circle_distance"] = x, y, z
        
        return obj

    def go_overview_to_dict(self):
        obj = {
            "manual_molecular_function_terms": [],
            "manual_biological_process_terms": [],
            "manual_cellular_component_terms": [],
            "htp_molecular_function_terms": [],
            "htp_biological_process_terms": [],
            "htp_cellular_component_terms": [], 
            "computational_annotation_count": 0,
            "go_slim": [],
            "date_last_reviewed": None
        }

        go_slims = DBSession.query(Goslimannotation).filter_by(dbentity_id=self.dbentity_id).all()
        for go_slim in go_slims:
            go_slim_dict = go_slim.to_dict()
            if go_slim_dict:
                obj["go_slim"].append(go_slim_dict)
        
        go = {
            "cellular component": {},
            "molecular function": {},
            "biological process": {}
        }

        go_annotations_mc = DBSession.query(Goannotation).filter_by(dbentity_id=self.dbentity_id, annotation_type="manually curated").all()
        for annotation in go_annotations_mc:
            if obj["date_last_reviewed"] is None or annotation.date_assigned.strftime("%Y-%m-%d") > obj["date_last_reviewed"]:
                obj["date_last_reviewed"] = annotation.date_assigned.strftime("%Y-%m-%d")
            
            json = annotation.to_dict_lsp()
            
            namespace = json["namespace"]
            term = json["term"]["display_name"]

            if term in go[namespace]:
                for ec in json["evidence_codes"]:
                    if ec["display_name"] not in [e["display_name"] for e in go[namespace][term]["evidence_codes"]]:
                        go[namespace][term]["evidence_codes"].append(ec)
            else:
                go[namespace][term] = json

        for namespace in go.keys():
            terms = sorted(go[namespace].keys(), key=lambda k : k.lower())
            
            if namespace == "cellular component":
                obj["manual_cellular_component_terms"] = [go[namespace][term] for term in terms]
            elif namespace == "molecular function":
                obj["manual_molecular_function_terms"] = [go[namespace][term] for term in terms]
            elif namespace == "biological process":
                obj["manual_biological_process_terms"] = [go[namespace][term] for term in terms]
        
        obj["computational_annotation_count"] = DBSession.query(Goannotation).filter_by(dbentity_id=self.dbentity_id, annotation_type="computational").count()

        go = {
            "cellular component": {},
            "molecular function": {},
            "biological process": {}
        }

        go_annotations_htp = DBSession.query(Goannotation).filter_by(dbentity_id=self.dbentity_id, annotation_type="high-throughput").all()
        for annotation in go_annotations_htp:
            json = annotation.to_dict_lsp()
            
            namespace = json["namespace"]
            term = json["term"]["display_name"]

            if term in go[namespace]:
                for ec in json["evidence_codes"]:
                    if ec["display_name"] not in [e["display_name"] for e in go[namespace][term]["evidence_codes"]]:
                        go[namespace][term]["evidence_codes"].append(ec)
            else:
                go[namespace][term] = json

        for namespace in go.keys():
            terms = sorted(go[namespace].keys(), key=lambda k : k.lower())
            
            if namespace == "cellular component":
                obj["htp_cellular_component_terms"] = [go[namespace][term] for term in terms]
            elif namespace == "molecular function":
                obj["htp_molecular_function_terms"] = [go[namespace][term] for term in terms]
            elif namespace == "biological process":
                obj["htp_biological_process_terms"] = [go[namespace][term] for term in terms]

        go_summary = DBSession.query(Locussummary.html).filter_by(locus_id=self.dbentity_id, summary_type="Function").one_or_none()
        if go_summary:
            obj["paragraph"] = go_summary[0]

        return obj
    
    def tabs(self):
        return {
            "id": self.dbentity_id,
            "protein_tab": self.has_protein,
            "interaction_tab": self.has_interaction,
            "summary_tab": self.has_summary,
            "go_tab": self.has_go,
            "sequence_section": self.has_sequence_section,
            "expression_tab": self.has_expression,
            "phenotype_tab": self.has_phenotype,
            "literature_tab": self.has_literature,
            "wiki_tab": False,
            "regulation_tab": self.has_regulation,
            "sequence_tab": self.has_sequence,
            "history_tab": self.has_history,
            "protein_tab": self.has_protein
        }

    # clears the URLs for all tabbed pages and secondary XHR requests on tabbed pages
    def refresh_tabbed_page_cache(self):
        backend_urls_by_tab = {
            'protein_tab': ['sequence_details', 'posttranslational_details', 'ecnumber_details', 'protein_experiment_details', 'protein_domain_details', 'protein_domain_details'],
            'interaction_tab': ['interaction_details', 'interaction_graph'],
            'summary_tab': ['expression_details'],
            'go_tab': ['go_details', 'go_graph'],
            'sequence_section': ['neighbor_sequence_details', 'sequence_details'],
            'expression_tab': ['expression_details', 'expression_graph'],
            'phenotype_tab': ['phenotype_details', 'phenotype_graph'],
            'literature_tab': ['literature_details', 'literature_graph'],
            'regulation_tab': ['regulation_details', 'regulation_graph'],
            'sequence_tab': ['neighbor_sequence_details', 'sequence_details'],
            'history_tab':[],
        }
        base_url = self.get_base_url() + '/'
        backend_base_segment = '/backend/locus/' + str(self.dbentity_id) + '/'
        urls = []
        tabs = self.tabs()
        # get all the urls
        for key in tabs:
            if key is 'sequence_section' or key is 'id':
                continue
            # if the tab is present, append all the needed urls to urls
            if tabs[key]:
                tab_name = key.replace('_tab', '')
                tab_url = base_url + tab_name
                urls.append(tab_url)
                for d in backend_urls_by_tab[key]:
                    secondary_url = backend_base_segment + d
                    urls.append(secondary_url)
        target_urls = list(set(urls))
        for relative_url in target_urls:
            for base_url in cache_urls:
                url = base_url + relative_url
                try:
                    # purge
                    requests.request('PURGE', url)
                    # prime
                    response = requests.get(url)
                except Exception, e:
                    print 'error fetching ' + self.display_name

class Straindbentity(Dbentity):
    __tablename__ = 'straindbentity'
    __table_args__ = {u'schema': 'nex'}
    __url_segment__ = '/strain/'

    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    strain_type = Column(String(40), nullable=False)
    genotype = Column(String(500))
    genbank_id = Column(String(40))
    assembly_size = Column(Integer)
    fold_coverage = Column(SmallInteger)
    scaffold_number = Column(Integer)
    longest_scaffold = Column(Integer)
    scaffold_nfifty = Column(Integer)
    feature_count = Column(Integer)
    headline = Column(String(70), nullable=False)

    taxonomy = relationship(u'Taxonomy')

    db_cache = {}

    @staticmethod
    def get_strains_by_taxon_id(taxon_id):
        if taxon_id in Straindbentity.db_cache:
            return Straindbentity.db_cache[taxon_id]
        else:
            strain = DBSession.query(Straindbentity).filter_by(taxonomy_id=taxon_id).all()
            Straindbentity.db_cache[taxon_id] = strain
            return strain
    
    def to_dict(self):
        obj = {
            "display_name": self.display_name,
            "urls": [],
            "status": self.strain_type,
            "genotype": self.genotype,
            "description": self.headline,
            "assembly_size": self.assembly_size,
            "genbank_id": self.genbank_id,
            "fold_coverage": self.fold_coverage,
            "scaffold_number": self.scaffold_number,
            "longest_scaffold": self.longest_scaffold,
            "scaffold_n50": self.scaffold_nfifty,
            "feature_count": self.feature_count,
            "paragraph": None
        }

        if obj["genotype"] == '':
            obj["genotype"] = None
        elif (len(obj["genotype"]) > 1 and obj["genotype"][0] == "\"" and obj["genotype"][-1] == "\""):
            obj["genotype"] = obj["genotype"][1:len(obj["genotype"])-1]

        urls = DBSession.query(StrainUrl.display_name, StrainUrl.url_type, StrainUrl.obj_url).filter_by(strain_id=self.dbentity_id).all()

        for u in urls:
            category = u[1].lower()
            if category == "external id":
                category = "source"

            obj["urls"].append({
                "display_name": u[0],
                "category": category,
                "link": u[2]
            })

        paragraph = DBSession.query(Strainsummary.summary_id, Strainsummary.html).filter_by(strain_id=self.dbentity_id).one_or_none()
        if paragraph:
            reference_ids = DBSession.query(StrainsummaryReference.reference_id).filter_by(summary_id=paragraph[0]).order_by(StrainsummaryReference.reference_order).all()

            references = []
            if len(reference_ids):
                reference_ids = [r[0] for r in reference_ids]
                references = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reference_ids)).order_by(Referencedbentity.year.desc()).all()
                
            obj["paragraph"] = {
                "text": paragraph[1],
                "references": [r.to_dict_citation() for r in references]
            }

        contigs = DBSession.query(Contig).filter_by(taxonomy_id=self.taxonomy_id).all()
        obj["contigs"] = []
        
        chromosome_cache = {}
        for co in contigs:
            if co.display_name != "2-micron plasmid":
                obj["contigs"].append(co.to_dict(chromosome_cache))

        return obj


class Dbuser(Base):
    __tablename__ = 'dbuser'
    __table_args__ = {u'schema': 'nex'}

    dbuser_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    username = Column(String(12), nullable=False, unique=True)
    first_name = Column(String(40), nullable=False)
    last_name = Column(String(40), nullable=False)
    status = Column(String(40), nullable=False)
    is_curator = Column(Boolean, nullable=False)
    email = Column(String(100), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))


class Deletelog(Base):
    __tablename__ = 'deletelog'
    __table_args__ = {u'schema': 'nex'}

    deletelog_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.deletelog_seq'::regclass)"))
    bud_id = Column(Integer)
    tab_name = Column(String(60), nullable=False)
    primary_key = Column(BigInteger, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    deleted_row = Column(Text, nullable=False)


class Disease(Base):
    __tablename__ = 'disease'
    __table_args__ = {u'schema': 'nex'}

    disease_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    doid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class DiseaseAlia(Base):
    __tablename__ = 'disease_alias'
    __table_args__ = (
        UniqueConstraint('disease_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    disease_id = Column(ForeignKey(u'nex.disease.disease_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    disease = relationship(u'Disease')
    source = relationship(u'Source')


class DiseaseRelation(Base):
    __tablename__ = 'disease_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.disease.disease_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.disease.disease_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Disease', primaryjoin='DiseaseRelation.child_id == Disease.disease_id')
    parent = relationship(u'Disease', primaryjoin='DiseaseRelation.parent_id == Disease.disease_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class DiseaseUrl(Base):
    __tablename__ = 'disease_url'
    __table_args__ = (
        UniqueConstraint('disease_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    disease_id = Column(ForeignKey(u'nex.disease.disease_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    disease = relationship(u'Disease')
    source = relationship(u'Source')


class Diseaseannotation(Base):
    __tablename__ = 'diseaseannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'disease_id', 'eco_id', 'reference_id', 'annotation_type', 'disease_qualifier', 'source_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    disease_id = Column(ForeignKey(u'nex.disease.disease_id', ondelete=u'CASCADE'), nullable=False, index=True)
    eco_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False, index=True)
    annotation_type = Column(String(40), nullable=False)
    disease_qualifier = Column(String(40), nullable=False)
    date_assigned = Column(DateTime, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    disease = relationship(u'Disease')
    eco = relationship(u'Eco')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Diseasesubset(Base):
    __tablename__ = 'diseasesubset'
    __table_args__ = {u'schema': 'nex'}

    diseasesubset_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    disease_id = Column(ForeignKey(u'nex.disease.disease_id', ondelete=u'CASCADE'), nullable=False, index=True)
    subset_name = Column(String(50), nullable=False)
    genome_count = Column(Integer, nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    disease = relationship(u'Disease')
    source = relationship(u'Source')


class Diseasesubsetannotation(Base):
    __tablename__ = 'diseasesubsetannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'diseasesubset_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    diseasesubset_id = Column(ForeignKey(u'nex.diseasesubset.diseasesubset_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    diseasesubset = relationship(u'Diseasesubset')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Diseasesupportingevidence(Base):
    __tablename__ = 'diseasesupportingevidence'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'dbxref_id', 'group_id', 'evidence_type'),
        {u'schema': 'nex'}
    )

    diseasesupportingevidence_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.detail_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.diseaseannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    group_id = Column(BigInteger, nullable=False)
    dbxref_id = Column(String(40), nullable=False)
    obj_url = Column(String(500), nullable=False)
    evidence_type = Column(String(10), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    annotation = relationship(u'Diseaseannotation')


class Dnasequenceannotation(Base):
    __tablename__ = 'dnasequenceannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'taxonomy_id', 'contig_id', 'so_id', 'dna_type'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    bud_id = Column(Integer)
    so_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False, index=True)
    dna_type = Column(String(50), nullable=False)
    contig_id = Column(ForeignKey(u'nex.contig.contig_id', ondelete=u'CASCADE'), nullable=False, index=True)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'nex.genomerelease.genomerelease_id', ondelete=u'CASCADE'), index=True)
    start_index = Column(Integer, nullable=False)
    end_index = Column(Integer, nullable=False)
    strand = Column(String(1), nullable=False)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    contig = relationship(u'Contig')
    dbentity = relationship(u'Dbentity')
    file = relationship(u'Filedbentity', foreign_keys=[file_id])
    genomerelease = relationship(u'Genomerelease')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    so = relationship(u'So')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self):
        strains = Straindbentity.get_strains_by_taxon_id(self.contig.taxonomy_id)

        if len(strains) == 0:
            return None

        locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=self.dbentity_id).one_or_none()

        tags = DBSession.query(Dnasubsequence).filter_by(annotation_id=self.annotation_id).all()

        return {
            "start": self.start_index,
            "end": self.end_index,
            "residues": self.residues,
            "contig": self.contig.to_dict_sequence_widget(),
            "tags": [t.to_dict() for t in tags],
            "strain": {
                "display_name": strains[0].display_name,
                "status": strains[0].strain_type,
                "format_name": strains[0].format_name
            },
            "locus": locus.to_dict_sequence_widget(),
            "strand": self.strand,
            "dna_type": self.dna_type
        }

class Dnasubsequence(Base):
    __tablename__ = 'dnasubsequence'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'dbentity_id', 'relative_start_index', 'relative_end_index'),
        {u'schema': 'nex'}
    )

    dnasubsequence_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.detail_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.dnasequenceannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    dbentity_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    display_name = Column(String(500), nullable=False)
    bud_id = Column(Integer)
    so_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False, index=True)
    relative_start_index = Column(Integer, nullable=False)
    relative_end_index = Column(Integer, nullable=False)
    contig_start_index = Column(Integer, nullable=False)
    contig_end_index = Column(Integer, nullable=False)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'nex.genomerelease.genomerelease_id', ondelete=u'CASCADE'), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    annotation = relationship(u'Dnasequenceannotation')
    dbentity = relationship(u'Locusdbentity')
    file = relationship(u'Filedbentity')
    genomerelease = relationship(u'Genomerelease')
    so = relationship(u'So')

    def to_dict(self):
        seq_version = self.seq_version
        if seq_version:
            seq_version = seq_version.strftime("%Y-%m-%d")
        
        return {
            "relative_end": self.relative_end_index,
            "relative_start": self.relative_start_index,
            "display_name": self.display_name,
            "chromosomal_start": self.contig_start_index,
            "chromosomal_end": self.contig_end_index,
            "seq_version": seq_version,
            "class_type": self.display_name.upper()
        }


class Ec(Base):
    __tablename__ = 'ec'
    __table_args__ = {u'schema': 'nex'}

    ec_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ecid = Column(String(20), nullable=False, unique=True)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class EcAlia(Base):
    __tablename__ = 'ec_alias'
    __table_args__ = (
        UniqueConstraint('ec_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ec_id = Column(ForeignKey(u'nex.ec.ec_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    ec = relationship(u'Ec')
    source = relationship(u'Source')


class EcUrl(Base):
    __tablename__ = 'ec_url'
    __table_args__ = (
        UniqueConstraint('ec_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ec_id = Column(ForeignKey(u'nex.ec.ec_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    ec = relationship(u'Ec')
    source = relationship(u'Source')


class Eco(Base):
    __tablename__ = 'eco'
    __table_args__ = {u'schema': 'nex'}

    eco_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ecoid = Column(String(20), nullable=False, unique=True)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class EcoAlias(Base):
    __tablename__ = 'eco_alias'
    __table_args__ = (
        UniqueConstraint('eco_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    eco_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    eco = relationship(u'Eco')
    source = relationship(u'Source')


class EcoRelation(Base):
    __tablename__ = 'eco_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Eco', primaryjoin='EcoRelation.child_id == Eco.eco_id')
    parent = relationship(u'Eco', primaryjoin='EcoRelation.parent_id == Eco.eco_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class EcoUrl(Base):
    __tablename__ = 'eco_url'
    __table_args__ = (
        UniqueConstraint('eco_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    eco_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    eco = relationship(u'Eco')
    source = relationship(u'Source')


class Edam(Base):
    __tablename__ = 'edam'
    __table_args__ = {u'schema': 'nex'}

    edam_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    edamid = Column(String(20), nullable=False, unique=True)
    edam_namespace = Column(String(20), nullable=False)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')

    def to_dict(self):
        return {
            "id": self.edam_id,
            "name": self.format_name
        }


class EdamAlia(Base):
    __tablename__ = 'edam_alias'
    __table_args__ = (
        UniqueConstraint('edam_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    edam_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    edam = relationship(u'Edam')
    source = relationship(u'Source')


class EdamRelation(Base):
    __tablename__ = 'edam_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Edam', primaryjoin='EdamRelation.child_id == Edam.edam_id')
    parent = relationship(u'Edam', primaryjoin='EdamRelation.parent_id == Edam.edam_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class EdamUrl(Base):
    __tablename__ = 'edam_url'
    __table_args__ = (
        UniqueConstraint('edam_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    edam_id = Column(ForeignKey(u'nex.edam.edam_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    edam = relationship(u'Edam')
    source = relationship(u'Source')


class Enzymeannotation(Base):
    __tablename__ = 'enzymeannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'ec_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    ec_id = Column(ForeignKey(u'nex.ec.ec_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    ec = relationship(u'Ec')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Expressionannotation(Base):
    __tablename__ = 'expressionannotation'
    __table_args__ = (
        UniqueConstraint('datasetsample_id', 'dbentity_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    datasetsample_id = Column(ForeignKey(u'nex.datasetsample.datasetsample_id', ondelete=u'CASCADE'), nullable=False)
    expression_value = Column(Float(53), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    datasetsample = relationship(u'Datasetsample')
    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self):
        return self.datasetsample.dataset.to_dict(self.reference)


class FileKeyword(Base):
    __tablename__ = 'file_keyword'
    __table_args__ = (
        UniqueConstraint('file_id', 'keyword_id'),
        {u'schema': 'nex'}
    )

    file_keyword_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    keyword_id = Column(ForeignKey(u'nex.keyword.keyword_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    file = relationship(u'Filedbentity')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')


class Filepath(Base):
    __tablename__ = 'filepath'
    __table_args__ = {u'schema': 'nex'}

    filepath_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    filepath = Column(String(500), nullable=False, unique=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class Geninteractionannotation(Base):
    __tablename__ = 'geninteractionannotation'
    __table_args__ = (
        UniqueConstraint('dbentity1_id', 'dbentity2_id', 'bait_hit', 'biogrid_experimental_system', 'reference_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity1_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    dbentity2_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    phenotype_id = Column(ForeignKey(u'nex.phenotype.phenotype_id', ondelete=u'CASCADE'), index=True)
    biogrid_experimental_system = Column(String(100), nullable=False)
    annotation_type = Column(String(20), nullable=False)
    bait_hit = Column(String(10), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity1 = relationship(u'Dbentity', primaryjoin='Geninteractionannotation.dbentity1_id == Dbentity.dbentity_id')
    dbentity2 = relationship(u'Dbentity', primaryjoin='Geninteractionannotation.dbentity2_id == Dbentity.dbentity_id')
    phenotype = relationship(u'Phenotype')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self, reference=None):
        dbentity1 = self.dbentity1
        dbentity2 = self.dbentity2
        phenotype = self.phenotype

        if reference is None:
            reference = self.reference

        obj = {
            "id": self.annotation_id,
            "note": self.description,
            "bait_hit": self.bait_hit,
            "locus1": {
                "id": self.dbentity1_id,
                "display_name": dbentity1.display_name,
                "link": dbentity1.obj_url,
                "format_name": dbentity1.format_name
            },
            "locus2": {
                "id": self.dbentity2_id,
                "display_name": dbentity2.display_name,
                "link": dbentity2.obj_url,
                "format_name": dbentity2.format_name
            },
            "experiment": {
                "display_name": self.biogrid_experimental_system,
                "link": None
            },
            "phenotype": None,
            "mutant_type": "unspecified", # This column exists in NEX, but doesn't in NEX2. In NEX they are "unspecified" for the whole table. It was asked to removed it.
            "interaction_type": "Genetic",
            "annotation_type": self.annotation_type,
            "source": {
                "display_name": self.source.display_name
            },
            "reference": {
                "display_name": reference.display_name,
                "pubmed_id": reference.pmid,
                "link": reference.obj_url
            }
        }

        if phenotype:
            obj["phenotype"] = {
                "display_name": phenotype.display_name,
                "link": phenotype.obj_url
            }

        return obj


class Genomerelease(Base):
    __tablename__ = 'genomerelease'
    __table_args__ = {u'schema': 'nex'}

    genomerelease_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    sequence_release = Column(SmallInteger, nullable=False)
    annotation_release = Column(SmallInteger, nullable=False)
    curation_release = Column(SmallInteger, nullable=False)
    release_date = Column(DateTime, nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    file = relationship(u'Filedbentity')
    source = relationship(u'Source')


class Go(Base):
    __tablename__ = 'go'
    __table_args__ = {u'schema': 'nex'}

    go_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    goid = Column(String(20), nullable=False, unique=True)
    go_namespace = Column(String(20), nullable=False)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')

    # Allowed relationships (ro_ids) for graphs
    # 169782 'is_a', 169466 'regulates', 169299 'part of', 169468 'positively regulates', 169467 'negatively regulates'
    allowed_relationships = (169782, 169466, 169299, 169468, 169467)

    def to_dict(self):
        annotations_count = DBSession.query(Goannotation.dbentity_id, func.count(Goannotation.dbentity_id)).filter_by(go_id=self.go_id).group_by(Goannotation.dbentity_id).count()

        children_relation = DBSession.query(GoRelation).filter_by(parent_id=self.go_id).all()
        if len(children_relation) > 0:
            children_annotations = len(set([c.child_id for c in children_relation]))
        else:
            children_annotations = 0
        
        obj = {
            "display_name": self.display_name,
            "urls": [],
            "go_id": self.goid,
            "go_aspect": self.go_namespace,
            "description": self.description,
            "aliases": [],
            "id": self.go_id,
            "link": self.obj_url,
            "descendant_locus_count": 0,
            "locus_count": annotations_count,
            "descendant_locus_count": annotations_count + children_annotations
        }

        urls = DBSession.query(GoUrl).filter_by(go_id=self.go_id).all()
        for url in urls:
            obj["urls"].append({
                "display_name": url.display_name,
                "link": url.obj_url,
                "category": url.url_type
            })

        synonyms = DBSession.query(GoAlias).filter_by(go_id=self.go_id).all()
        for synonym in synonyms:
            obj["aliases"].append(synonym.display_name)
            
        obj["locus_count"] = DBSession.query(Goannotation.dbentity_id, func.count(Goannotation.dbentity_id)).filter_by(go_id=self.go_id).group_by(Goannotation.dbentity_id).count()

        return obj

    def ontology_graph(self):
        annotations = DBSession.query(Goannotation.dbentity_id, func.count(Goannotation.dbentity_id)).filter_by(go_id=self.go_id).group_by(Goannotation.dbentity_id).count()

        nodes = [{
            "data": {
                "link": self.obj_url,
                "sub_type": "FOCUS",
                "name": self.display_name + " (" + str(annotations) + ")",
                "id": str(self.go_id)
            }
        }]

        edges = []
        all_children = []

        children_relation = DBSession.query(GoRelation).filter(and_(GoRelation.parent_id == self.go_id, GoRelation.ro_id.in_(Go.allowed_relationships))).all()
        
        for child_relation in children_relation[:6]:
            child_node = child_relation.to_graph(nodes, edges, add_child=True)
            all_children.append({
                "display_name": child_node.display_name,
                "link": child_node.obj_url
            })

        for child_relation in children_relation[7:]:
            child_node = child_relation.child
            all_children.append({
                "display_name": child_node.display_name,
                "link": child_node.obj_url
            })

        if len(children_relation) - 7 > 0:
            nodes.append({
                "data": {
                    "name": str(len(children_relation) - 7) + " more children",
                    "sub_type": "",
                    "link": None,
                    "id": "NodeMoreChildren"
                }
            })
            edges.append({
                "data": {
                    "name": "",
                    "target": "NodeMoreChildren",
                    "source": str(self.go_id)
                }
            })

        parent_relations = self.parent_tree()
        for relation in parent_relations:
            relation.to_graph(nodes, edges, add_parent=True)
        
        graph = {
            "edges": edges,
            "nodes": nodes,
            "all_children": sorted(all_children, key=lambda f: str(f["display_name"]).lower())
        }
        
        return graph

    def parent_tree(self, max_level=3):
        relations = []
        
        level = 0
        parents_relation = DBSession.query(GoRelation).filter(and_(GoRelation.child_id == self.go_id, GoRelation.ro_id.in_(Go.allowed_relationships))).all()
        
        # breath-first-search stopping at level 3
        parents_at_level = len(parents_relation)
        while len(parents_relation) > 0:
            parent_relation = parents_relation[0]
            relations.append(parent_relation)

            del parents_relation[0]

            if level < max_level:
                new_parents = DBSession.query(GoRelation).filter(and_(GoRelation.child_id == parent_relation.parent.go_id, GoRelation.ro_id.in_(Go.allowed_relationships))).all()
                
                parents_relation_ids = [p.relation_id for p in parents_relation]
                for p in new_parents:
                    if p.relation_id not in parents_relation_ids:
                        parents_relation.append(p)

                parents_at_level -= 1
                if parents_at_level == 0:
                    level += 1
                    parents_at_level = len(parents_relation)

        return relations


    def annotations_to_dict(self):
        annotations = DBSession.query(Goannotation).filter_by(go_id=self.go_id).all()

        annotations_dict = []
        for a in annotations:
            annotations_dict += a.to_dict(go=self)

        return annotations_dict

    def annotations_and_children_to_dict(self):
        annotations_dict = []
        
        annotations = DBSession.query(Goannotation).filter_by(go_id=self.go_id).all()
        for a in annotations:
            annotations_dict += a.to_dict(go=self)

        children_relation = DBSession.query(GoRelation).filter(and_(GoRelation.parent_id == self.go_id, GoRelation.ro_id.in_(Go.allowed_relationships))).all()
        children = [c.child for c in children_relation]
        children_ids = [c.child_id for c in children_relation]

        for child in children:
            annotations = DBSession.query(Goannotation).filter_by(go_id=child.go_id).all()

            for a in annotations:
                annotations_dict += a.to_dict(go=child)

            children_relation = DBSession.query(GoRelation).filter(and_(GoRelation.parent_id == child.go_id, GoRelation.ro_id.in_(Go.allowed_relationships))).all()
            for c in children_relation:
                if c.child_id not in children_ids:
                    children.append(c.child)
                    children_ids.append(c.child_id)

        return annotations_dict

    def get_base_url(self):
        return self.obj_url

    def get_secondary_cache_urls(self):
        base_url = self.get_base_url()
        url1 = '/backend' + base_url + '/' + str(self.go_id) + '/locus_details'
        return [url1]

class GoAlias(Base):
    __tablename__ = 'go_alias'
    __table_args__ = (
        UniqueConstraint('go_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    go_id = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    go = relationship(u'Go')
    source = relationship(u'Source')


class GoRelation(Base):
    __tablename__ = 'go_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Go', primaryjoin='GoRelation.child_id == Go.go_id')
    parent = relationship(u'Go', primaryjoin='GoRelation.parent_id == Go.go_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')

    def to_graph(self, nodes, edges, add_parent=False, add_child=False):
        adding_nodes = []
        if add_parent:
            adding_nodes.append(self.parent)

        if add_child:
            adding_nodes.append(self.child)

        for node in adding_nodes:
            annotations = DBSession.query(Goannotation.dbentity_id, func.count(Goannotation.dbentity_id)).filter_by(go_id=node.go_id).group_by(Goannotation.dbentity_id).count()

            type = "development"
            name = node.display_name + " (" + str(annotations) + ")"

            nodes.append({
                "data": {
                    "link": node.obj_url,
                    "sub_type": type,
                    "name": name,
                    "id": str(node.go_id)
                }
            })
        
        edges.append({
            "data": {
                "name": self.ro.display_name,
                "target": str(self.child.go_id),
                "source": str(self.parent.go_id)
            }
        })

        return self.child


class GoUrl(Base):
    __tablename__ = 'go_url'
    __table_args__ = (
        UniqueConstraint('go_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    go_id = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    go = relationship(u'Go')
    source = relationship(u'Source')


class Goannotation(Base):
    __tablename__ = 'goannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'go_id', 'eco_id', 'reference_id', 'annotation_type', 'go_qualifier', 'source_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    go_id = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), nullable=False, index=True)
    eco_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False, index=True)
    annotation_type = Column(String(40), nullable=False)
    go_qualifier = Column(String(40), nullable=False)
    date_assigned = Column(DateTime, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    eco = relationship(u'Eco')
    go = relationship(u'Go')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict_lsp(self):
        obj = {
            "namespace": self.go.go_namespace,
            "qualifiers": [self.go_qualifier.replace("_", " ")],
            "term":{
                "link": self.go.obj_url,
                "display_name": self.go.display_name
            },
            "evidence_codes": []
        }

        alias = DBSession.query(EcoAlias).filter_by(eco_id=self.eco_id).all()

        experiment_name = alias[0].display_name
        for alia in alias:
            if len(experiment_name) > len(alia.display_name):
                experiment_name = alia.display_name

        alias_url = DBSession.query(EcoUrl).filter_by(eco_id=self.eco_id).all()

        experiment_url = None
        for url in alias_url:
            if url.display_name == "OntoBee":
                experiment_url = url.obj_url
                break
        if experiment_url == None and len(alias_url) > 0:
            experiment_url = alias_url[0].obj_url

        obj["evidence_codes"] = [{
            "display_name": experiment_name,
            "link": experiment_url
        }]
        
        return obj

    # a Go annotation can be duplicated based on the Gosupportingevidence group id
    # so its to_dict method must return an array of dictionaries
    def to_dict(self, go=None):
        if go == None:
            go = self.go

        alias = DBSession.query(EcoAlias).filter_by(eco_id=self.eco_id).all()
        experiment_name = alias[0].display_name

        for alia in alias:
            if len(experiment_name) > len(alia.display_name):
                experiment_name = alia.display_name

        alias_url = DBSession.query(EcoUrl).filter_by(eco_id=self.eco_id).all()
        
        experiment_url = None
        for url in alias_url:
            if url.display_name == "OntoBee":
                experiment_url = url.obj_url
                break
        if experiment_url == None and len(alias_url) > 0:
            experiment_url = alias_url[0].obj_url

        go_obj = {
            "id": self.annotation_id,
            "annotation_type": self.annotation_type,
            "date_created": self.date_created.strftime("%Y-%m-%d"),
            "qualifier": self.go_qualifier.replace("_", " "),
            "locus": {
                "display_name": self.dbentity.display_name,
                "link": self.dbentity.obj_url,
                "id": self.dbentity.dbentity_id,
                "format_name": self.dbentity.format_name
            },
            "go": {
                "display_name": go.display_name.replace("_", " "),
                "link": go.obj_url,
                "go_id": go.goid,
                "go_aspect": go.go_namespace,
                "id": go.go_id
            },
            "reference": {
                "display_name": self.reference.display_name,
                "link": self.reference.obj_url,
                "pubmed_id": self.reference.pmid
            },
            "source": {
                "display_name": self.source.display_name
            },
            "experiment": {
                "display_name": experiment_name,
                "link": experiment_url
            },
            "properties": []
        }
            
        properties = []
        
        extensions = DBSession.query(Goextension).filter_by(annotation_id=self.annotation_id).all()
        extension_groups = {}
        for extension in extensions:
            extension_dict = extension.to_dict()
            if extension_dict:
                if extension.group_id not in extension_groups:
                    extension_groups[extension.group_id] = [extension_dict]
                else:
                    extension_groups[extension.group_id].append(extension_dict)

        supporting_evidences = DBSession.query(Gosupportingevidence).filter_by(annotation_id=self.annotation_id).all()
        se_groups = {}
        for se in supporting_evidences:
            evidence_dict = se.to_dict()
            if evidence_dict:
                if se.group_id not in se_groups:
                    se_groups[se.group_id] = [evidence_dict]
                else:
                    se_groups[se.group_id].append(evidence_dict)

        go_obj_extensions = []
        for group_id in extension_groups:
            obj = copy.deepcopy(go_obj)
            obj["properties"] = extension_groups[group_id]
            go_obj_extensions.append(obj)

        if len(go_obj_extensions) == 0:
            go_obj_extensions = [go_obj]   
            
        final_obj = []
        for group_id in se_groups:
            for c in go_obj_extensions:
                obj = copy.deepcopy(c)
                obj["properties"] += se_groups[group_id]
                final_obj.append(obj)

        if len(final_obj) == 0:
            if len(go_obj_extensions) == 0:
                final_obj = [go_obj]
            else:
                final_obj = go_obj_extensions

        return final_obj


class Goextension(Base):
    __tablename__ = 'goextension'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'dbxref_id', 'group_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    goextension_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.detail_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.goannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    group_id = Column(BigInteger, nullable=False)
    dbxref_id = Column(String(40), nullable=False)
    obj_url = Column(String(500), nullable=False)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    annotation = relationship(u'Goannotation')
    ro = relationship(u'Ro')

    def to_dict(self):
        source_id = self.dbxref_id.split(":")
        
        if source_id[0] == "SGD":
            sgdid = source_id[1]
            dbentity = DBSession.query(Dbentity).filter_by(sgdid=sgdid).one_or_none()
            return {
                "bioentity": {
                    "display_name": dbentity.display_name,
                    "link": dbentity.obj_url,
                    "class_type": dbentity.subclass
                },
                "role": self.ro.display_name
            }
        elif source_id[0] == "GO":
            go_evidence = DBSession.query(Go).filter_by(goid=self.dbxref_id).one_or_none()
            if go_evidence:
                return {
                    "bioentity": {
                        "display_name": go_evidence.display_name,
                        "link": go_evidence.obj_url
                    },
                    "role": self.ro.display_name
                }
        elif source_id[0] == "CHEBI":
            chebi = DBSession.query(Chebi).filter_by(chebiid=self.dbxref_id).one_or_none()
            if chebi:
                return {
                    "bioentity": {
                        "display_name": chebi.display_name,
                        "link": chebi.obj_url
                    },
                    "role": self.ro.display_name
                }
        else:
            return {
                "bioentity": {
                    "display_name": source_id[1],
                    "link": self.obj_url
                },
                "role": self.ro.display_name
            }
        
        return None


class Goslim(Base):
    __tablename__ = 'goslim'
    __table_args__ = {u'schema': 'nex'}

    goslim_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    go_id = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), nullable=False, index=True)
    slim_name = Column(String(40), nullable=False)
    genome_count = Column(Integer, nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    go = relationship(u'Go')
    source = relationship(u'Source')

    def to_dict(self):
        if self.slim_name == "Yeast GO-Slim":
            return {
                "link": self.obj_url,
                "display_name": self.display_name
            }
        else:
            return None


class Goslimannotation(Base):
    __tablename__ = 'goslimannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'goslim_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    goslim_id = Column(ForeignKey(u'nex.goslim.goslim_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    goslim = relationship(u'Goslim')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self):
        return self.goslim.to_dict()


class Gosupportingevidence(Base):
    __tablename__ = 'gosupportingevidence'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'dbxref_id', 'group_id', 'evidence_type'),
        {u'schema': 'nex'}
    )

    gosupportingevidence_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.detail_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.goannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    group_id = Column(BigInteger, nullable=False)
    dbxref_id = Column(String(40), nullable=False)
    obj_url = Column(String(500), nullable=False)
    evidence_type = Column(String(10), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    annotation = relationship(u'Goannotation')

    def to_dict(self):
        source_id = self.dbxref_id.split(":")

        # the frontend expects a capitalized "role" to place the evidence in the right column of the annotation table
        
        if source_id[0] == "SGD":
            sgdid = source_id[1]
            dbentity = DBSession.query(Dbentity).filter_by(sgdid=sgdid).one_or_none()
            return {
                "bioentity": {
                    "display_name": dbentity.display_name,
                    "link": dbentity.obj_url,
                    "class_type": dbentity.subclass
                },
                "role": self.evidence_type.capitalize()
            }
        elif source_id[0] == "GO":
            go_evidence = DBSession.query(Go).filter_by(goid=self.dbxref_id).one_or_none()
            if go_evidence:
                return {
                    "bioentity": {
                        "display_name": go_evidence.display_name,
                        "link": go_evidence.obj_url
                    },
                    "role": self.evidence_type.capitalize()
                }
        elif source_id[0] == "CHEBI":
            chebi = DBSession.query(Chebi).filter_by(chebiid=self.dbxref_id).one_or_none()
            if chebi:
                return {
                    "bioentity": {
                        "display_name": chebi.display_name,
                        "link": chebi.obj_url
                    },
                    "role": self.evidence_type.capitalize()
                }
        else:
            return {
                "bioentity": {
                    "display_name": source_id[1],
                    "link": self.obj_url
                },
                "role": self.evidence_type.capitalize()
            }
        
        return None

class Journal(Base):
    __tablename__ = 'journal'
    __table_args__ = (
        UniqueConstraint('med_abbr', 'title'),
        {u'schema': 'nex'}
    )

    journal_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    med_abbr = Column(String(100))
    title = Column(String(200))
    issn_print = Column(String(10))
    issn_electronic = Column(String(10))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class Keyword(Base):
    __tablename__ = 'keyword'
    __table_args__ = {u'schema': 'nex'}

    keyword_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False, index=True)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')

    def to_simple_dict(self):
        return {
            "link": self.obj_url,
            "display_name": self.display_name
        }

    def to_dict(self):
        obj = {
            "display_name": self.display_name,
            "description": self.description,
            "bioitems": []
        }

        dataset_keywords = DBSession.query(DatasetKeyword).filter_by(keyword_id=self.keyword_id).all()

        dataset_ids = [d.dataset_id for d in dataset_keywords]
        datasets = DBSession.query(Dataset).filter(Dataset.dataset_id.in_(list(dataset_ids))).all()
        for dataset in datasets:
            obj["bioitems"].append(dataset.to_dict())

        return obj

class Literatureannotation(Base):
    __tablename__ = 'literatureannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'reference_id', 'topic'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    topic = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    acceptable_tags = {
        'htp_phenotype': 'Omics',
        'non_phenotype_htp': 'Omics',
        'other_primary': 'Primary Literature',
        'Reviews': 'Reviews',
        'additional_literature': 'Additional Literature'
    }

    @staticmethod
    def factory(reference_id, tag, dbentity_id, created_by, source_id=824, taxonomy_id=274803):
        if tag not in Literatureannotation.acceptable_tags:
            return None

        return Literatureannotation(
            dbentity_id=dbentity_id,
            source_id=source_id,
            taxonomy_id=taxonomy_id,
            reference_id=reference_id,
            topic=Literatureannotation.acceptable_tags[tag],
            created_by=created_by
        )
    
    def to_dict(self):
        obj = {
            "topic": self.topic,
            "locus": None
        }
        
        entity = self.dbentity

        if entity:
            obj["locus"] = {
                "display_name": entity.display_name,
                "link": entity.obj_url
            }
        
        return obj

class LocusAlias(Base):
    __tablename__ = 'locus_alias'
    __table_args__ = (
        UniqueConstraint('locus_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    has_external_id_section = Column(Boolean, nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class LocusRelation(Base):
    __tablename__ = 'locus_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    parent_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Locusdbentity', primaryjoin='LocusRelation.child_id == Locusdbentity.dbentity_id')
    parent = relationship(u'Locusdbentity', primaryjoin='LocusRelation.parent_id == Locusdbentity.dbentity_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class LocusUrl(Base):
    __tablename__ = 'locus_url'
    __table_args__ = (
        UniqueConstraint('locus_id', 'display_name', 'obj_url', 'placement'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    placement = Column(String(100), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')

    def to_dict(self):
        placement = self.placement
        if placement.endswith('INTERACTION_RESOURCES') or placement.endswith('EXPRESSION_RESOURCES'):
            placement = self.placement.replace("_RESOURCES", "", 1)
        
        return {
            "category": placement,
            "link": self.obj_url,
            "display_name": self.display_name
        }


class Locusnoteannotation(Base):
    __tablename__ = 'locusnoteannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'note_type', 'display_name', 'note'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    bud_id = Column(Integer)
    note_type = Column(String(40), nullable=False)
    display_name = Column(String(500), nullable=False)
    note = Column(String(2000), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Locussummary(Base):
    __tablename__ = 'locussummary'
    __table_args__ = (
        UniqueConstraint('locus_id', 'summary_type', 'summary_order'),
        {u'schema': 'nex'}
    )

    summary_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.summary_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    summary_type = Column(String(40), nullable=False)
    summary_order = Column(SmallInteger, nullable=False, server_default=text("1"))
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False)

    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class LocussummaryReference(Base):
    __tablename__ = 'locussummary_reference'
    __table_args__ = (
        UniqueConstraint('summary_id', 'reference_id'),
        {u'schema': 'nex'}
    )

    summary_reference_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    summary_id = Column(ForeignKey(u'nex.locussummary.summary_id', ondelete=u'CASCADE'), nullable=False)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_order = Column(SmallInteger, nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    summary = relationship(u'Locussummary')


class Obi(Base):
    __tablename__ = 'obi'
    __table_args__ = {u'schema': 'nex'}

    obi_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    obiid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class ObiRelation(Base):
    __tablename__ = 'obi_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.obi.obi_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.obi.obi_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Obi', primaryjoin='ObiRelation.child_id == Obi.obi_id')
    parent = relationship(u'Obi', primaryjoin='ObiRelation.parent_id == Obi.obi_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class ObiUrl(Base):
    __tablename__ = 'obi_url'
    __table_args__ = (
        UniqueConstraint('obi_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    obi_id = Column(ForeignKey(u'nex.obi.obi_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    obi = relationship(u'Obi')
    source = relationship(u'Source')


class PathwayAlia(Base):
    __tablename__ = 'pathway_alias'
    __table_args__ = (
        UniqueConstraint('pathway_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    pathway_id = Column(ForeignKey(u'nex.pathwaydbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    pathway = relationship(u'Pathwaydbentity')
    source = relationship(u'Source')


class PathwayUrl(Base):
    __tablename__ = 'pathway_url'
    __table_args__ = (
        UniqueConstraint('pathway_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    pathway_id = Column(ForeignKey(u'nex.pathwaydbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    pathway = relationship(u'Pathwaydbentity')
    source = relationship(u'Source')


class Pathwayannotation(Base):
    __tablename__ = 'pathwayannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'pathway_id', 'reference_id', 'ec_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    pathway_id = Column(ForeignKey(u'nex.pathwaydbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ec_id = Column(ForeignKey(u'nex.ec.ec_id', ondelete=u'CASCADE'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    ec = relationship(u'Ec')
    pathway = relationship(u'Pathwaydbentity', foreign_keys=[pathway_id])
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Pathwaysummary(Base):
    __tablename__ = 'pathwaysummary'
    __table_args__ = (
        UniqueConstraint('pathway_id', 'summary_type'),
        {u'schema': 'nex'}
    )

    summary_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.summary_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    pathway_id = Column(ForeignKey(u'nex.pathwaydbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    summary_type = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False)

    pathway = relationship(u'Pathwaydbentity')
    source = relationship(u'Source')


class PathwaysummaryReference(Base):
    __tablename__ = 'pathwaysummary_reference'
    __table_args__ = (
        UniqueConstraint('summary_id', 'reference_id'),
        {u'schema': 'nex'}
    )

    summary_reference_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    summary_id = Column(ForeignKey(u'nex.pathwaysummary.summary_id', ondelete=u'CASCADE'), nullable=False)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_order = Column(BigInteger, nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    summary = relationship(u'Pathwaysummary')


class Phenotype(Base):
    __tablename__ = 'phenotype'
    __table_args__ = {u'schema': 'nex'}

    phenotype_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    observable_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False, index=True)
    qualifier_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), index=True)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    observable = relationship(u'Apo', primaryjoin='Phenotype.observable_id == Apo.apo_id')
    qualifier = relationship(u'Apo', primaryjoin='Phenotype.qualifier_id == Apo.apo_id')
    source = relationship(u'Source')

    def to_dict(self):
        obj = {
            "id": self.phenotype_id,
            "display_name": self.display_name,
            "observable": {
                "display_name": self.observable.display_name,
                "link": self.observable.obj_url
            },
            
            "overview": Phenotypeannotation.create_count_overview([self.phenotype_id])
        }

        if self.qualifier:
            obj["qualifier"] = self.qualifier.display_name
        else:
            obj["qualifier"] = "None"

        return obj

    def annotations_to_dict(self):
        phenotype_annotations = DBSession.query(Phenotypeannotation).filter_by(phenotype_id=self.phenotype_id).all()

        conditions = DBSession.query(PhenotypeannotationCond).filter(PhenotypeannotationCond.annotation_id.in_([p.annotation_id for p in phenotype_annotations])).all()
        condition_names = set([c.condition_name for c in conditions])

        conditions_dict = {}
        for condition in conditions:
            if condition.annotation_id in conditions_dict:
                conditions_dict[condition.annotation_id].append(condition)
            else:
                conditions_dict[condition.annotation_id] = [condition]
                
        urls = DBSession.query(Chebi.display_name, Chebi.obj_url).filter(Chebi.display_name.in_(list(condition_names))).all()
        chebi_urls = {}
        for url in urls:
            chebi_urls[url[0]] = url[1]
        
        obj = []
        for annotation in phenotype_annotations:
            obj += annotation.to_dict(phenotype=self, conditions=conditions_dict.get(annotation.annotation_id, []), chebi_urls=chebi_urls)
        return obj

    def get_base_url(self):
        return '/phenotype/' + self.format_name

    def get_secondary_cache_urls(self):
        base_url = self.get_base_url()
        url1 = '/backend' + base_url + '/' + str(self.phenotype_id) + '/locus_details'
        return [url1]

class Phenotypeannotation(Base):
    __tablename__ = 'phenotypeannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'phenotype_id', 'experiment_id', 'mutant_id', 'reference_id', 'taxonomy_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    phenotype_id = Column(ForeignKey(u'nex.phenotype.phenotype_id', ondelete=u'CASCADE'), nullable=False, index=True)
    experiment_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False, index=True)
    mutant_id = Column(ForeignKey(u'nex.apo.apo_id', ondelete=u'CASCADE'), nullable=False, index=True)
    allele_id = Column(ForeignKey(u'nex.allele.allele_id', ondelete=u'CASCADE'), index=True)
    reporter_id = Column(ForeignKey(u'nex.reporter.reporter_id', ondelete=u'CASCADE'), index=True)
    assay_id = Column(ForeignKey(u'nex.obi.obi_id', ondelete=u'CASCADE'), index=True)
    strain_name = Column(String(100))
    details = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    experiment_comment = Column(String(200))
    allele_comment = Column(String(200))
    reporter_comment = Column(String(200))

    allele = relationship(u'Allele')
    assay = relationship(u'Obi')
    dbentity = relationship(u'Dbentity')
    experiment = relationship(u'Apo', primaryjoin='Phenotypeannotation.experiment_id == Apo.apo_id')
    mutant = relationship(u'Apo', primaryjoin='Phenotypeannotation.mutant_id == Apo.apo_id')
    phenotype = relationship(u'Phenotype')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    reporter = relationship(u'Reporter')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    @staticmethod
    def count_strains(phenotype_ids=None, annotations=None):
        strains_result = []

        if annotations is None:
            annotations = DBSession.query(Phenotypeannotation.taxonomy_id, Phenotypeannotation.annotation_id).filter(Phenotypeannotation.phenotype_id.in_(phenotype_ids)).all()

        annotation_ids = [a.annotation_id for a in annotations]

        number_conditions_tuples = DBSession.query(PhenotypeannotationCond.annotation_id, func.count(distinct(PhenotypeannotationCond.group_id))).filter(PhenotypeannotationCond.annotation_id.in_(annotation_ids)).group_by(PhenotypeannotationCond.annotation_id).all()

        number_conditions = {}
        for t in number_conditions_tuples:
            number_conditions[t[0]] = t[1]

        counts_dict = {}
        for annotation in annotations:
            add = 1
                
            if number_conditions.get(annotation.annotation_id, 0) > 1:
                add = number_conditions.get(annotation.annotation_id, 0)
                
            if annotation.taxonomy_id in counts_dict:
                counts_dict[annotation.taxonomy_id] += add
            else:
                counts_dict[annotation.taxonomy_id] = add

        counts = []
        for taxonomy in counts_dict:
            counts.append((taxonomy, counts_dict[taxonomy]))

        for count in counts:
            strains = Straindbentity.get_strains_by_taxon_id(count[0])
            
            if len(strains) > 1:
                strains_result.append(["Other", count[1]])
            elif len(strains) == 1:
                strains_result.append([strains[0].display_name, count[1]])
            else:
                continue

        return sorted(strains_result, key=lambda strain: (-1 * strain[1], strain[0]))

    @staticmethod
    def count_experiment_categories(phenotype_ids=None, annotations=None):
        if annotations is None:
            annotations = DBSession.query(Phenotypeannotation).filter(Phenotypeannotation.phenotype_id.in_(phenotype_ids)).all()

        annotation_ids = [a.annotation_id for a in annotations]

        number_conditions_tuples = DBSession.query(PhenotypeannotationCond.annotation_id, func.count(distinct(PhenotypeannotationCond.group_id))).filter(PhenotypeannotationCond.annotation_id.in_(annotation_ids)).group_by(PhenotypeannotationCond.annotation_id).all()

        number_conditions = {}
        for t in number_conditions_tuples:
            number_conditions[t[0]] = t[1]
            
        mt = {}
        for annotation in annotations:
            if annotation.mutant.display_name not in mt:
                mt[annotation.mutant.display_name] = {
                    "classical genetics": 0,
                    "large-scale survey": 0
                }

            add = 1

            if number_conditions.get(annotation.annotation_id, 0) > 1:
                add = number_conditions.get(annotation.annotation_id, 0)
                
            mt[annotation.mutant.display_name][annotation.experiment.namespace_group] += add
                
        experiment_categories = []
        for key in mt.keys():
            experiment_categories.append([key, mt[key]["classical genetics"], mt[key]["large-scale survey"]])

        return sorted(experiment_categories, key=lambda k: k[1] + k[2], reverse=True)
    
    # method for graphs counting annotations
    @staticmethod
    def create_count_overview(phenotype_ids, phenotype_annotations=None):
        if phenotype_annotations is None:
            return {
                "strains": [["Strain", "Annotations"]] + Phenotypeannotation.count_strains(phenotype_ids=phenotype_ids),
                "experiment_categories": [["Mutant Type", "classical genetics", "large-scale survey"]] +  Phenotypeannotation.count_experiment_categories(phenotype_ids=phenotype_ids)
            }
        else:
            return {
                "strains": [["Strain", "Annotations"]] + Phenotypeannotation.count_strains(annotations=phenotype_annotations),
                "experiment_categories": [["Mutant Type", "classical genetics", "large-scale survey"]] +  Phenotypeannotation.count_experiment_categories(annotations=phenotype_annotations)
            }

    def to_dict_lsp(self):
        if self.experiment.display_name == "classical genetics":
            experiment_category = "classical_phenotypes"
        else:
            experiment_category = "large_scale_phenotypes"
            
        return {
            "experiment_category": experiment_category,
            "mutant": self.mutant.display_name,
            "phenotype": {
                "display_name": self.phenotype.display_name,
                "link": self.phenotype.obj_url,
                "id": self.phenotype.phenotype_id
            }
        }
    
    def to_dict(self, reference=None, chemical=None, phenotype=None, locus=None, conditions=None, chebi_urls=None):
        if reference == None:
            reference = self.reference

        if locus == None:
            locus = self.dbentity

        if phenotype == None:
            phenotype = self.phenotype
        
        properties = []
        
        if self.reporter:
            properties.append({
                "class_type": "BIOITEM",
                "bioitem": {
                    "display_name": self.reporter.display_name
                },
                "note": self.reporter_comment,
                "role": "Reporter"
            })

        if self.allele:
            properties.append({
                "class_type": "BIOITEM",
                "bioitem": {
                    "display_name": self.allele.display_name
                },
                "note": self.allele_comment,
                "role": "Allele"
            })

        strain = Straindbentity.get_strains_by_taxon_id(self.taxonomy_id)
            
        strain_obj = None
        
        if len(strain) == 0 or len(strain) > 1:
            strain_obj = {
                "display_name": "Other",
                "link": "/strain/S000203479"
            }
        else:
            strain_obj = {
                "display_name": strain[0].display_name,
                "link": strain[0].obj_url
            }

        note = None
        if self.details and len(self.details) > 0:
            note = self.details
            
        experiment = Apo.get_apo_by_id(self.experiment_id)
        mutant = Apo.get_apo_by_id(self.mutant_id)
            
        experiment_obj = None
        
        if experiment:
            experiment_obj = {
                "display_name": experiment.display_name,
                "link": None, # self.experiment.obj_url -> no page yet
                "category": experiment.namespace_group,
                "note": self.experiment_comment
            }

        obj = {
            "id": self.annotation_id,
            "mutant_type": mutant.display_name,
            "locus": {
                "display_name": locus.display_name,
                "id": locus.dbentity_id,
                "link": locus.obj_url,
                "format_name": locus.format_name
            },
            "experiment": experiment_obj,
            "experiment_details": self.experiment_comment,
            "strain": strain_obj,
            "properties": properties,
            "note": note,
            "phenotype": {
                "display_name": self.phenotype.display_name,
                "link": self.phenotype.obj_url,
                "id": self.phenotype.phenotype_id
            },
            "reference": {
                "display_name": reference.display_name,
                "link": reference.obj_url,
                "pubmed_id": reference.pmid
            }
        }

        if conditions == None:
            conditions = DBSession.query(PhenotypeannotationCond).filter_by(annotation_id=self.annotation_id).all()
            
        groups = {}
        
        for condition in conditions:
            if condition.condition_class == "chemical":                
                if chemical is not None and (chemical.display_name == condition.condition_name):
                    chebi_url = chemical.obj_url
                else:
                    if chebi_urls == None:
                        chebi_url = DBSession.query(Chebi.obj_url).filter_by(display_name=condition.condition_name).one_or_none()
                    else:
                        chebi_url = chebi_urls.get(condition.condition_name)

                link = None
                if chebi_url:
                    link = chebi_url

                if condition.group_id not in groups:
                    groups[condition.group_id] = []
                    
                groups[condition.group_id].append({
                    "class_type": "CHEMICAL",
                    "concentration": condition.condition_value,
                    "bioitem": {
                        "link": link,
                        "display_name": condition.condition_name
                    },
                    "note": None,
                    "role": "CHEMICAL"
                })
            else:
                note = condition.condition_name
                if condition.condition_value:
                    note += ", " + condition.condition_value
                    if condition.condition_unit:
                        note += " " + condition_unit

                if condition.group_id not in groups:
                    groups[condition.group_id] = []

                groups[condition.group_id].append({
                    "class_type": condition.condition_class,
                    "note": note
                })

        if chemical:
            groups_to_delete = []
            for group_id in groups:
                chemical_present_in_group = False
                for condition in groups[group_id]:
                    if condition["class_type"] == "CHEMICAL" and condition["bioitem"]["display_name"] == chemical.display_name:
                        chemical_present_in_group = True
                if not chemical_present_in_group:
                    groups_to_delete.append(group_id)

            for group_id in groups_to_delete:
                del groups[group_id]

        final_obj = []
        for group_id in groups:
            obj_group = copy.deepcopy(obj)
            obj_group["properties"] += groups[group_id]
            final_obj.append(obj_group)

        if len(final_obj) == 0:
            final_obj = [obj]

        return final_obj


class PhenotypeannotationCond(Base):
    __tablename__ = 'phenotypeannotation_cond'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'condition_class', 'condition_name', 'condition_value'),
        {u'schema': 'nex'}
    )

    condition_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.condition_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.phenotypeannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    condition_class = Column(String(40), nullable=False)
    condition_name = Column(String(500), nullable=False)
    condition_value = Column(String(150))
    condition_unit = Column(String(25))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    group_id = Column(Integer, nullable=False)

    annotation = relationship(u'Phenotypeannotation')


class Physinteractionannotation(Base):
    __tablename__ = 'physinteractionannotation'
    __table_args__ = (
        UniqueConstraint('dbentity1_id', 'dbentity2_id', 'bait_hit', 'biogrid_experimental_system', 'reference_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity1_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    dbentity2_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    psimod_id = Column(ForeignKey(u'nex.psimod.psimod_id', ondelete=u'CASCADE'), index=True)
    biogrid_experimental_system = Column(String(100), nullable=False)
    annotation_type = Column(String(20), nullable=False)
    bait_hit = Column(String(10), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity1 = relationship(u'Dbentity', primaryjoin='Physinteractionannotation.dbentity1_id == Dbentity.dbentity_id')
    dbentity2 = relationship(u'Dbentity', primaryjoin='Physinteractionannotation.dbentity2_id == Dbentity.dbentity_id')
    psimod = relationship(u'Psimod')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self, reference=None):
        dbentity1 = self.dbentity1
        dbentity2 = self.dbentity2

        if reference is None:
            reference = self.reference

        modification = "No Modification"
        if self.psimod:
            modification = self.psimod.display_name
        
        return {
            "id": self.annotation_id,
            "note": self.description,
            "bait_hit": self.bait_hit,
            "locus1": {
                "id": self.dbentity1_id,
                "display_name": dbentity1.display_name,
                "link": dbentity1.obj_url,
                "format_name": dbentity1.format_name
            },
            "locus2": {
                "id": self.dbentity2_id,
                "display_name": dbentity2.display_name,
                "link": dbentity2.obj_url,
                "format_name": dbentity2.format_name
            },
            "experiment": {
                "display_name": self.biogrid_experimental_system,
                "link": None
            },
            "phenotype": None, # None for physical interactions
            "mutant_type": None, # None for physical interactions
            "modification": modification,
            "interaction_type": "Physical",
            "annotation_type": self.annotation_type,
            "source": {
                "display_name": self.source.display_name
            },
            "reference": {
                "display_name": reference.display_name,
                "pubmed_id": reference.pmid,
                "link": reference.obj_url
            }
        }


class Posttranslationannotation(Base):
    __tablename__ = 'posttranslationannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'psimod_id', 'site_residue', 'site_index', 'reference_id', 'modifier_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    site_index = Column(Integer, nullable=False)
    site_residue = Column(String(1), nullable=False)
    psimod_id = Column(ForeignKey(u'nex.psimod.psimod_id', ondelete=u'CASCADE'), nullable=False, index=True)
    modifier_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity', primaryjoin='Posttranslationannotation.dbentity_id == Dbentity.dbentity_id')
    modifier = relationship(u'Dbentity', primaryjoin='Posttranslationannotation.modifier_id == Dbentity.dbentity_id')
    psimod = relationship(u'Psimod')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Proteindomain(Base):
    __tablename__ = 'proteindomain'
    __table_args__ = {u'schema': 'nex'}

    proteindomain_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    interpro_id = Column(String(20))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class ProteindomainUrl(Base):
    __tablename__ = 'proteindomain_url'
    __table_args__ = (
        UniqueConstraint('proteindomain_id', 'display_name', 'url_type'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    proteindomain_id = Column(ForeignKey(u'nex.proteindomain.proteindomain_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    proteindomain = relationship(u'Proteindomain')
    source = relationship(u'Source')


class Proteindomainannotation(Base):
    __tablename__ = 'proteindomainannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'proteindomain_id', 'start_index', 'end_index'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    proteindomain_id = Column(ForeignKey(u'nex.proteindomain.proteindomain_id', ondelete=u'CASCADE'), nullable=False, index=True)
    start_index = Column(Integer, nullable=False)
    end_index = Column(Integer, nullable=False)
    date_of_run = Column(DateTime, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    proteindomain = relationship(u'Proteindomain')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Proteinexptannotation(Base):
    __tablename__ = 'proteinexptannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'reference_id', 'experiment_type'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    experiment_type = Column(String(40), nullable=False)
    data_value = Column(String(25), nullable=False)
    data_unit = Column(String(25), nullable=False)
    assay_id = Column(ForeignKey(u'nex.obi.obi_id', ondelete=u'CASCADE'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    assay = relationship(u'Obi')
    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class ProteinexptannotationCond(Base):
    __tablename__ = 'proteinexptannotation_cond'
    __table_args__ = (
        UniqueConstraint('annotation_id', 'condition_class', 'condition_name', 'condition_value'),
        {u'schema': 'nex'}
    )

    condition_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.condition_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.proteinexptannotation.annotation_id', ondelete=u'CASCADE'), nullable=False)
    condition_class = Column(String(40), nullable=False)
    condition_name = Column(String(500), nullable=False)
    condition_value = Column(String(25))
    condition_unit = Column(String(25))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    annotation = relationship(u'Proteinexptannotation')


class ProteinsequenceDetail(Base):
    __tablename__ = 'proteinsequence_detail'
    __table_args__ = {u'schema': 'nex'}

    detail_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.detail_seq'::regclass)"))
    annotation_id = Column(ForeignKey(u'nex.proteinsequenceannotation.annotation_id', ondelete=u'CASCADE'), nullable=False, unique=True)
    molecular_weight = Column(Numeric, nullable=False)
    protein_length = Column(BigInteger, nullable=False)
    n_term_seq = Column(String(10), nullable=False)
    c_term_seq = Column(String(10), nullable=False)
    pi = Column(Numeric)
    cai = Column(Numeric)
    codon_bias = Column(Numeric)
    fop_score = Column(Numeric)
    gravy_score = Column(Numeric)
    aromaticity_score = Column(Numeric)
    aliphatic_index = Column(Numeric)
    instability_index = Column(Numeric)
    ala = Column(Integer, nullable=False)
    arg = Column(Integer, nullable=False)
    asn = Column(Integer, nullable=False)
    asp = Column(Integer, nullable=False)
    cys = Column(Integer, nullable=False)
    gln = Column(Integer, nullable=False)
    glu = Column(Integer, nullable=False)
    gly = Column(Integer, nullable=False)
    his = Column(Integer, nullable=False)
    ile = Column(Integer, nullable=False)
    leu = Column(Integer, nullable=False)
    lys = Column(Integer, nullable=False)
    met = Column(Integer, nullable=False)
    phe = Column(Integer, nullable=False)
    pro = Column(Integer, nullable=False)
    ser = Column(Integer, nullable=False)
    thr = Column(Integer, nullable=False)
    trp = Column(Integer, nullable=False)
    tyr = Column(Integer, nullable=False)
    val = Column(Integer, nullable=False)
    hydrogen = Column(Integer)
    sulfur = Column(Integer)
    nitrogen = Column(Integer)
    oxygen = Column(Integer)
    carbon = Column(Integer)
    no_cys_ext_coeff = Column(Integer)
    all_cys_ext_coeff = Column(Integer)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    annotation = relationship(u'Proteinsequenceannotation', uselist=False)

    def to_dict_lsp(self):
        return {
            "length": int(self.protein_length),
            "molecular_weight": float(self.molecular_weight),
            "pi": float(self.pi)
        }

class Proteinsequenceannotation(Base):
    __tablename__ = 'proteinsequenceannotation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'taxonomy_id', 'contig_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    bud_id = Column(Integer)
    contig_id = Column(ForeignKey(u'nex.contig.contig_id', ondelete=u'CASCADE'), nullable=False, index=True)
    seq_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'nex.genomerelease.genomerelease_id', ondelete=u'CASCADE'), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(BigInteger)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    contig = relationship(u'Contig')
    dbentity = relationship(u'Dbentity')
    genomerelease = relationship(u'Genomerelease')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self):
        locus = DBSession.query(Locusdbentity).filter_by(dbentity_id=self.dbentity_id).one_or_none()
        strains = Straindbentity.get_strains_by_taxon_id(self.contig.taxonomy_id)

        if len(strains) == 0:
            return None
        
        return {
            "residues": self.residues,
            "locus": locus.to_dict_sequence_widget(),
            "strain": {
                "display_name": strains[0].display_name,
                "status": strains[0].strain_type,
                "format_name": strains[0].format_name
            }
        }

class Psimod(Base):
    __tablename__ = 'psimod'
    __table_args__ = {u'schema': 'nex'}

    psimod_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    psimodid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class PsimodRelation(Base):
    __tablename__ = 'psimod_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.psimod.psimod_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.psimod.psimod_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Psimod', primaryjoin='PsimodRelation.child_id == Psimod.psimod_id')
    parent = relationship(u'Psimod', primaryjoin='PsimodRelation.parent_id == Psimod.psimod_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class PsimodUrl(Base):
    __tablename__ = 'psimod_url'
    __table_args__ = (
        UniqueConstraint('psimod_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    psimod_id = Column(ForeignKey(u'nex.psimod.psimod_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    psimod = relationship(u'Psimod')
    source = relationship(u'Source')


class ReferenceAlias(Base):
    __tablename__ = 'reference_alias'
    __table_args__ = (
        UniqueConstraint('reference_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class ReferenceFile(Base):
    __tablename__ = 'reference_file'
    __table_args__ = (
        UniqueConstraint('reference_id', 'file_id'),
        {u'schema': 'nex'}
    )

    reference_file_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    file = relationship(u'Filedbentity')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class ReferenceRelation(Base):
    __tablename__ = 'reference_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'relation_type'),
        {u'schema': 'nex'}
    )

    reference_relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    child_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    relation_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Referencedbentity', primaryjoin='ReferenceRelation.child_id == Referencedbentity.dbentity_id')
    parent = relationship(u'Referencedbentity', primaryjoin='ReferenceRelation.parent_id == Referencedbentity.dbentity_id')
    source = relationship(u'Source')


class ReferenceUrl(Base):
    __tablename__ = 'reference_url'
    __table_args__ = (
        UniqueConstraint('reference_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class Referenceauthor(Base):
    __tablename__ = 'referenceauthor'
    __table_args__ = (
        UniqueConstraint('reference_id', 'display_name', 'author_order'),
        {u'schema': 'nex'}
    )

    referenceauthor_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    orcid = Column(String(20))
    author_order = Column(SmallInteger, nullable=False)
    author_type = Column(String(10), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class Referencedeleted(Base):
    __tablename__ = 'referencedeleted'
    __table_args__ = {u'schema': 'nex'}

    referencedeleted_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    pmid = Column(BigInteger, nullable=False, unique=True)
    sgdid = Column(String(20), unique=True)
    reason_deleted = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)


class Referencedocument(Base):
    __tablename__ = 'referencedocument'
    __table_args__ = (
        UniqueConstraint('reference_id', 'document_type'),
        {u'schema': 'nex'}
    )

    referencedocument_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    document_type = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class Referencetriage(Base):
    __tablename__ = 'referencetriage'
    __table_args__ = {u'schema': 'nex'}

    curation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.curation_seq'::regclass)"))
    pmid = Column(BigInteger, nullable=False, unique=True)
    citation = Column(String(500), nullable=False)
    fulltext_url = Column(String(500))
    abstract = Column(Text)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    json = Column(Text)
    abstract_genes = Column(String(500))

    def to_dict(self):
        return {
            "curation_id": self.curation_id,
            "basic": {
                "pmid": self.pmid,
                "citation": self.citation,
                "fulltext_url": self.fulltext_url,
                "abstract": self.abstract,
                "abstract_genes": self.abstract_genes,
                "date_created": self.date_created.strftime("%Y-%m-%d")
            },
            "data": json.loads(self.json or "{}")
        }

    def update_from_json(self, json_obj):
        if 'basic' in json_obj:
            if 'pmid' in json_obj['basic']:
                self.pmid = json_obj['basic']['pmid']
            if 'citation' in json_obj['basic']:
                self.citation = json_obj['basic']['citation']
            if 'fulltext_url' in json_obj['basic']:
                self.fulltext_url = json_obj['basic']['fulltext_url']
            if 'abstract' in json_obj['basic']:
                self.abstract = json_obj['basic']['abstract']
        if 'data' in json_obj:
            self.json = json.dumps(json_obj['data'])

class Referencetype(Base):
    __tablename__ = 'referencetype'
    __table_args__ = (
        UniqueConstraint('reference_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    referencetype_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class Referenceunlink(Base):
    __tablename__ = 'referenceunlink'
    __table_args__ = (
        UniqueConstraint('reference_id', 'dbentity_id'),
        {u'schema': 'nex'}
    )

    referenceunlink_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])


class Regulationannotation(Base):
    __tablename__ = 'regulationannotation'
    __table_args__ = (
        UniqueConstraint('target_id', 'regulator_id', 'eco_id', 'reference_id'),
        {u'schema': 'nex'}
    )

    annotation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.annotation_seq'::regclass)"))
    target_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    regulator_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    eco_id = Column(ForeignKey(u'nex.eco.eco_id', ondelete=u'CASCADE'), nullable=False, index=True)
    regulator_type = Column(String(40), nullable=False)
    regulation_type = Column(String(100), nullable=False)
    direction = Column(String(10))
    happens_during = Column(ForeignKey(u'nex.go.go_id', ondelete=u'CASCADE'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    eco = relationship(u'Eco')
    go = relationship(u'Go')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    regulator = relationship(u'Dbentity', primaryjoin='Regulationannotation.regulator_id == Dbentity.dbentity_id')
    source = relationship(u'Source')
    target = relationship(u'Dbentity', primaryjoin='Regulationannotation.target_id == Dbentity.dbentity_id')
    taxonomy = relationship(u'Taxonomy')

    def to_dict(self, reference):
        experiment = None
        if self.eco:
            experiment = {
                "display_name": self.eco.display_name,
                "link": self.eco.obj_url
            }

        strain = Straindbentity.get_strains_by_taxon_id(self.taxonomy_id)

        strain_obj = None
        if len(strain) == 0 or len(strain) > 1:
            strain_obj = {
                "display_name": "Other",
                "link": "/strain/S000203479"
            }
        else:
            strain_obj = {
                "display_name": strain[0].display_name,
                "link": strain[0].obj_url
            }
        
        return {
            "id": self.annotation_id,
            "locus2": {
                "display_name": self.target.display_name,
                "link": self.target.obj_url,
                "id": self.target.dbentity_id,
                "format_name": self.target.format_name                
            },
            "locus1": {
                "display_name": self.regulator.display_name,
                "link": self.regulator.obj_url,
                "id": self.regulator.dbentity_id,
                "format_name": self.regulator.format_name
            },
            "reference": {
                "display_name": reference.display_name,
                "link": reference.obj_url,
                "pubmed_id": reference.pmid
            },
            "strain": strain_obj,
            "experiment": experiment,
            "properties": [], #dropped
            "assay": None, #dropped
            "construct": None #dropped
        }

class Reporter(Base):
    __tablename__ = 'reporter'
    __table_args__ = {u'schema': 'nex'}

    reporter_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class Reservedname(Base):
    __tablename__ = 'reservedname'
    __table_args__ = {u'schema': 'nex'}

    reservedname_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    colleague_id = Column(ForeignKey(u'nex.colleague.colleague_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reservation_date = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    expiration_date = Column(DateTime, nullable=False, server_default=text("(('now'::text)::timestamp without time zone + '365 days'::interval)"))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    colleague = relationship(u'Colleague')
    locus = relationship(u'Locusdbentity')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')

    def to_dict(self):
        obj = {
            "display_name": self.display_name,
            "reservation_date": self.reservation_date.strftime("%Y-%m-%d"),
            "expiration_date": self.expiration_date.strftime("%Y-%m-%d"),
            "locus": None,
            "reference": None
        }

        if self.locus:
            obj["locus"] = {
                "display_name": self.locus.display_name,
                "link": self.locus.obj_url
            }

        if self.reference:
            obj["reference"] = {
                "display_name": self.reference.display_name,
                "link": self.reference.obj_url
            }

        return obj

class Ro(Base):
    __tablename__ = 'ro'
    __table_args__ = {u'schema': 'nex'}

    ro_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    roid = Column(String(20), nullable=False, unique=True)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class RoRelation(Base):
    __tablename__ = 'ro_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'relation_type'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    relation_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Ro', primaryjoin='RoRelation.child_id == Ro.ro_id')
    parent = relationship(u'Ro', primaryjoin='RoRelation.parent_id == Ro.ro_id')
    source = relationship(u'Source')


class RoUrl(Base):
    __tablename__ = 'ro_url'
    __table_args__ = (
        UniqueConstraint('ro_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    ro = relationship(u'Ro')
    source = relationship(u'Source')


class Sgdid(Base):
    __tablename__ = 'sgdid'
    __table_args__ = {u'schema': 'nex'}

    sgdid_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    bud_id = Column(Integer)
    subclass = Column(String(40), nullable=False)
    sgdid_status = Column(String(40), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class So(Base):
    __tablename__ = 'so'
    __table_args__ = {u'schema': 'nex'}

    so_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    soid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class SoAlia(Base):
    __tablename__ = 'so_alias'
    __table_args__ = (
        UniqueConstraint('so_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    so_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    so = relationship(u'So')
    source = relationship(u'Source')


class SoRelation(Base):
    __tablename__ = 'so_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'So', primaryjoin='SoRelation.child_id == So.so_id')
    parent = relationship(u'So', primaryjoin='SoRelation.parent_id == So.so_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class SoUrl(Base):
    __tablename__ = 'so_url'
    __table_args__ = (
        UniqueConstraint('so_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    so_id = Column(ForeignKey(u'nex.so.so_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    so = relationship(u'So')
    source = relationship(u'Source')


class Source(Base):
    __tablename__ = 'source'
    __table_args__ = {u'schema': 'nex'}

    source_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    bud_id = Column(Integer)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)


class StrainUrl(Base):
    __tablename__ = 'strain_url'
    __table_args__ = (
        UniqueConstraint('strain_id', 'display_name', 'url_type'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    strain_id = Column(ForeignKey(u'nex.straindbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')
    strain = relationship(u'Straindbentity')


class Strainsummary(Base):
    __tablename__ = 'strainsummary'
    __table_args__ = (
        UniqueConstraint('strain_id', 'summary_type'),
        {u'schema': 'nex'}
    )

    summary_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.summary_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    strain_id = Column(ForeignKey(u'nex.straindbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    summary_type = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')
    strain = relationship(u'Straindbentity')


class StrainsummaryReference(Base):
    __tablename__ = 'strainsummary_reference'
    __table_args__ = (
        UniqueConstraint('summary_id', 'reference_id'),
        {u'schema': 'nex'}
    )

    summary_reference_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.link_seq'::regclass)"))
    summary_id = Column(ForeignKey(u'nex.strainsummary.summary_id', ondelete=u'CASCADE'), nullable=False)
    reference_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    reference_order = Column(SmallInteger, nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    summary = relationship(u'Strainsummary')


class Taxonomy(Base):
    __tablename__ = 'taxonomy'
    __table_args__ = {u'schema': 'nex'}

    taxonomy_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.object_seq'::regclass)"))
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxid = Column(String(20), nullable=False, unique=True)
    common_name = Column(String(100))
    rank = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')


class TaxonomyAlia(Base):
    __tablename__ = 'taxonomy_alias'
    __table_args__ = (
        UniqueConstraint('taxonomy_id', 'display_name', 'alias_type'),
        {u'schema': 'nex'}
    )

    alias_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.alias_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class TaxonomyRelation(Base):
    __tablename__ = 'taxonomy_relation'
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', 'ro_id'),
        {u'schema': 'nex'}
    )

    relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False)
    child_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'nex.ro.ro_id', ondelete=u'CASCADE'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    child = relationship(u'Taxonomy', primaryjoin='TaxonomyRelation.child_id == Taxonomy.taxonomy_id')
    parent = relationship(u'Taxonomy', primaryjoin='TaxonomyRelation.parent_id == Taxonomy.taxonomy_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class TaxonomyUrl(Base):
    __tablename__ = 'taxonomy_url'
    __table_args__ = (
        UniqueConstraint('taxonomy_id', 'display_name', 'obj_url'),
        {u'schema': 'nex'}
    )

    url_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.url_seq'::regclass)"))
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'nex.taxonomy.taxonomy_id', ondelete=u'CASCADE'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Updatelog(Base):
    __tablename__ = 'updatelog'
    __table_args__ = {u'schema': 'nex'}

    updatelog_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.updatelog_seq'::regclass)"))
    bud_id = Column(Integer)
    tab_name = Column(String(60), nullable=False)
    col_name = Column(String(60), nullable=False)
    primary_key = Column(BigInteger, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
