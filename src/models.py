from sqlalchemy import Column, BigInteger, UniqueConstraint, Float, Boolean, SmallInteger, Integer, DateTime, ForeignKey, Index, Numeric, String, Text, text, FetchedValue, func
from sqlalchemy.orm import scoped_session, sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from zope.sqlalchemy import ZopeTransactionExtension
from elasticsearch import Elasticsearch
import os
import json

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()
ESearch = Elasticsearch(os.environ['ES_URI'], retry_on_timeout=True)


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

    @staticmethod
    def get_apo_by_id(apo_id):
        if apo_id in Apo.db_cache:
            return Apo.db_cache[apo_id]
        else:
            apo = DBSession.query(Apo).filter_by(apo_id=apo_id).one_or_none()
            Apo.db_cache[apo_id] = apo
            return apo

    #observables
    def to_dict(self):
        phenotypes = DBSession.query(Phenotype.obj_url, Phenotype.qualifier_id, Phenotype.phenotype_id).filter_by(observable_id=self.apo_id).all()

        annotations_count = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([p.phenotype_id for p in phenotypes])).group_by(Phenotypeannotation.dbentity_id).count()

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
            annotations = DBSession.query(Phenotypeannotation).filter_by(phenotype_id=phenotype.phenotype_id).all()

            obj += [a.to_dict(phenotype=phenotype) for a in annotations]

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

            obj += [a.to_dict(phenotype=phenotype) for a in annotations]

        return obj

    def ontology_graph(self):
        phenotypes = DBSession.query(Phenotype).filter_by(observable_id=self.apo_id).all()

        annotations = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([p.phenotype_id for p in phenotypes])).group_by(Phenotypeannotation.dbentity_id).count()

        nodes = [{
            "data": {
                "link": self.obj_url,
                "sub_type": "FOCUS",
                "name": self.display_name + "(" + str(annotations) + ")",
                "id": str(self.apo_id)
            }
        }]

        edges = []
        all_children = []

        children_relation = DBSession.query(ApoRelation).filter_by(parent_id=self.apo_id).all()
        for child_relation in children_relation:
            child_node = child_relation.to_graph(nodes, edges, add_child=True)
            all_children.append({
                "display_name": child_node.display_name,
                "link": child_node.obj_url
            })

        level = 0
        parents_relation = DBSession.query(ApoRelation).filter_by(child_id=self.apo_id).all()
        for parent_relation in parents_relation:
            parent_relation.to_graph(nodes, edges, add_parent=True)

            if level < 3:
                parents_relation += DBSession.query(ApoRelation).filter_by(child_id=parent_relation.parent.apo_id).all()
                level += 1

        
        graph = {
            "edges": edges,
            "nodes": nodes,
            "all_children": all_children
        }
        
        return graph

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

    def to_graph(self, nodes, edges, add_parent=False, add_child=False):
        adding_nodes = []
        if add_parent:
            adding_nodes.append(self.parent)

        if add_child:
            adding_nodes.append(self.child)

        for node in adding_nodes:
            if node.display_name == "observable":
                type = "observable"
                name = "Yeast Phenotype Ontology"
            else:
                phenotypes = DBSession.query(Phenotype).filter_by(observable_id=node.apo_id).all()

                annotations = DBSession.query(Phenotypeannotation.dbentity_id, func.count(Phenotypeannotation.dbentity_id)).filter(Phenotypeannotation.phenotype_id.in_([p.phenotype_id for p in phenotypes])).group_by(Phenotypeannotation.dbentity_id).count()

                type = "development"
                name = node.display_name + "(" + str(annotations) + ")"
                
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
                "target": str(self.child.apo_id),
                "source": str(self.parent.apo_id)
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
        annotation_ids = [condition[0] for condition in conditions]

        phenotype_annotations = DBSession.query(Phenotypeannotation).filter(Phenotypeannotation.annotation_id.in_(annotation_ids)).all()

        return [annotation.to_dict(chemical=self) for annotation in phenotype_annotations]

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


class Curation(Base):
    __tablename__ = 'curation'
    __table_args__ = (
        UniqueConstraint('dbentity_id', 'subclass', 'curation_task', 'locus_id'),
        {u'schema': 'nex'}
    )

    curation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.curation_seq'::regclass)"))
    dbentity_id = Column(ForeignKey(u'nex.dbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False)
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    locus_id = Column(ForeignKey(u'nex.locusdbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    subclass = Column(String(40), nullable=False)
    curation_task = Column(String(40), nullable=False)
    curator_comment = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=text("('now'::text)::timestamp without time zone"))
    created_by = Column(String(12), nullable=False)

    dbentity = relationship(u'Dbentity')
    locus = relationship(u'Locusdbentity', foreign_keys=[locus_id])
    source = relationship(u'Source')


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

    def to_dict(self, reference):
        keywords = DBSession.query(DatasetKeyword).filter_by(dataset_id=self.dataset_id).all()

        tags = [keyword.to_dict() for keyword in keywords]

        return {
            "id": self.dataset_id,
            "display_name": self.display_name,
            "link": self.obj_url,
            "short_description": self.description,
            "condition_count": self.sample_count,
            "reference": {
                "display_name": reference.display_name,
                "link": reference.obj_url,
                "pubmed_id": reference.pmid
            },
            "tags": tags
        }


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
    file = relationship(u'Filedbentity')
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

    def to_dict_citation(self):
        obj = {
            "id": self.dbentity_id,
            "display_name": self.display_name,
            "citation": self.citation,
            "pubmed_id": self.pmid,
            "link": self.obj_url,
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
            "reftypes": [],
            "urls": []
        }

        ref_urls = DBSession.query(ReferenceUrl).filter_by(reference_id=self.dbentity_id).all()
        for url in ref_urls:
            obj["urls"].append({
                "display_name": url.display_name,
                "link": url.obj_url,                            
            })

        abstract = DBSession.query(Referencedocument.text).filter_by(reference_id=self.dbentity_id, document_type="Abstract").one_or_none()
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
            "sgdid": self.sgdid,
            "journal": {
                "med_abbr": self.journal.med_abbr,
            },
            "year": self.year,
            "id": self.dbentity_id,

            "related_references": [],
            "expression_datasets": []
        }

        datasets = DBSession.query(DatasetReference).filter_by(reference_id=self.dbentity_id).all()
        obj["expression_datasets"] = [data.dataset.to_dict(self) for data in datasets]
        
        abstract = DBSession.query(Referencedocument.text).filter_by(reference_id=self.dbentity_id, document_type="Abstract").one_or_none()
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

        return [annotation.to_dict() for annotation in annotations]

    def interactions_to_dict(self):
        obj = []

        interactions = DBSession.query(Physinteractionannotation).filter_by(reference_id=self.dbentity_id).all() + DBSession.query(Geninteractionannotation).filter_by(reference_id=self.dbentity_id).all()

        return [interaction.to_dict(self) for interaction in interactions]

    def go_to_dict(self):
        obj = []

        gos = DBSession.query(Goannotation).filter_by(reference_id=self.dbentity_id).all()
        return [go.to_dict() for go in gos]

    def phenotype_to_dict(self):
        obj = []

        phenotypes = DBSession.query(Phenotypeannotation).filter_by(reference_id=self.dbentity_id).all()
        
        return [phenotype.to_dict(reference=self) for phenotype in phenotypes]

    def regulation_to_dict(self):
        obj = []

        regulations = DBSession.query(Regulationannotation).filter_by(reference_id=self.dbentity_id).all()
        
        return [regulation.to_dict(self) for regulation in regulations]

    
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
    filepath_id = Column(ForeignKey(u'nex.filepath.filepath_id', ondelete=u'CASCADE'), index=True)
    readme_file_id = Column(ForeignKey(u'nex.filedbentity.dbentity_id', ondelete=u'CASCADE'), index=True)
    previous_file_name = Column(String(100))
    s3_url = Column(String(500))
    description = Column(String(4000))

    data = relationship(u'Edam', primaryjoin='Filedbentity.data_id == Edam.edam_id')
    filepath = relationship(u'Filepath')
    format = relationship(u'Edam', primaryjoin='Filedbentity.format_id == Edam.edam_id')
    readme_file = relationship(u'Filedbentity', foreign_keys=[dbentity_id])
    topic = relationship(u'Edam', primaryjoin='Filedbentity.topic_id == Edam.edam_id')


class Locusdbentity(Dbentity):
    __tablename__ = 'locusdbentity'
    __table_args__ = {u'schema': 'nex'}

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


class Straindbentity(Dbentity):
    __tablename__ = 'straindbentity'
    __table_args__ = {u'schema': 'nex'}

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

        urls = DBSession.query(StrainUrl.display_name, StrainUrl.url_type, StrainUrl.obj_url).filter_by(strain_id=self.dbentity_id).all()
        obj["urls"] = [{
            "display_name": u[0],
            "category": u[1].lower(),
            "link": u[2]
        } for u in urls]

        paragraph = DBSession.query(Strainsummary.summary_id, Strainsummary.html).filter_by(strain_id=self.dbentity_id).one_or_none()
        if paragraph:
            reference_ids = DBSession.query(StrainsummaryReference.reference_id).filter_by(summary_id=paragraph[0]).order_by(StrainsummaryReference.reference_order).all()

            references = []
            if len(reference_ids):
                reference_ids = [r[0] for r in reference_ids]
                references = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reference_ids)).all()
                
            obj["paragraph"] = {
                "text": paragraph[1],
                "references": [r.to_dict_citation() for r in references]
            }

        contigs = DBSession.query(Contig).filter_by(taxonomy_id=self.taxonomy_id).all()
        obj["contigs"] = []
        
        chromosome_cache = {}
        for co in contigs:
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

    def to_dict(self, reference):
        dbentity1 = self.dbentity1
        dbentity2 = self.dbentity2
        phenotype = self.phenotype

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

    def to_dict(self):
        annotations_count = DBSession.query(Goannotation.dbentity_id, func.count(Goannotation.dbentity_id)).filter_by(go_id=self.go_id).group_by(Goannotation.dbentity_id).count()

        children_relation = DBSession.query(GoRelation).filter_by(parent_id=self.go_id).all()
        if len(children_relation) > 0:
            children_go_ids = DBSession.query(Go.go_id).filter()
            children_annotations = DBSession.query(Goannotation.dbentity_id, func.count(Goannotation.dbentity_id)).filter(Goannotation.go_id.in_([c[0] for c in children_go_ids])).group_by(Goannotation.dbentity_id).count()
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
                "name": self.display_name + "(" + str(annotations) + ")",
                "id": str(self.go_id)
            }
        }]

        edges = []
        all_children = []

        children_relation = DBSession.query(GoRelation).filter_by(parent_id=self.go_id).all()
        
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
            
        level = 0
        parents_relation = DBSession.query(GoRelation).filter_by(child_id=self.go_id).all()
        while len(parents_relation) > 0:
            parent_relation = parents_relation.pop()
            parent_relation.to_graph(nodes, edges, add_parent=True)

            if level < 4:
                parents_relation += DBSession.query(GoRelation).filter_by(child_id=parent_relation.parent.go_id).all()
                level += 1

        
        graph = {
            "edges": edges,
            "nodes": nodes,
            "all_children": all_children
        }
        
        return graph

    def annotations_to_dict(self):
        annotations = DBSession.query(Goannotation).filter_by(go_id=self.go_id).all()

        return [a.to_dict(go=self) for a in annotations]

    def annotations_and_children_to_dict(self):
        annotations = DBSession.query(Goannotation).filter_by(go_id=self.go_id).all()
        obj = [a.to_dict(go=self) for a in annotations]

        children_relation = DBSession.query(GoRelation).filter_by(parent_id=self.go_id).all()
        children = [c.child for c in children_relation]
        for child in children:
            annotations = DBSession.query(Goannotation).filter_by(go_id=child.go_id).all()
            obj += [a.to_dict(go=child) for a in annotations]

        return obj

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
            name = node.display_name + "(" + str(annotations) + ")"
                
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

    def to_dict(self, go=None):
        if go == None:
            go = self.go
        
        alias = DBSession.query(EcoAlias).filter_by(eco_id=self.eco.eco_id).all()
        experiment_name = alias[0].display_name

        for alia in alias:
            if len(experiment_name) > len(alia.display_name):
                experiment_name = alia.display_name

        alias_url = DBSession.query(EcoUrl).filter_by(eco_id=self.eco.eco_id).all()
        
        experiment_url = None
        for url in alias_url:
            if url.display_name == "OntoBee":
                experiment_url = url.obj_url
                break
        if experiment_url == None and len(alias_url) > 0:
            experiment_url = alias_url[0].obj_url

        properties = []
            
        extensions = DBSession.query(Goextension).filter_by(annotation_id=self.annotation_id).all()

        for extension in extensions:
            split_dbxref = extension.dbxref_id.split("SGD:")
            if len(split_dbxref) == 2:
                sgdid = split_dbxref[1]
                dbentity = DBSession.query(Dbentity).filter_by(sgdid=sgdid).one_or_none()
                properties.append({
                    "bioentity": {
                        "display_name": dbentity.display_name,
                        "link": dbentity.obj_url,
                        "class_type": dbentity.subclass
                    },
                    "role": extension.ro.display_name
                })

        supporting_evidences = DBSession.query(Gosupportingevidence).filter_by(annotation_id=self.annotation_id).all()

        for se in supporting_evidences:
            split_dbxref = se.dbxref_id.split("SGD:")
            if len(split_dbxref) == 2:
                sgdid = split_dbxref[1]
                dbentity = DBSession.query(Dbentity).filter_by(sgdid=sgdid).one_or_none()
                properties.append({
                    "bioentity": {
                        "display_name": dbentity.display_name,
                        "link": dbentity.obj_url,
                        "class_type": dbentity.subclass
                    },
                    "role": se.evidence_type
                })
        
        return {
            "id": self.annotation_id,
            "annotation_type": self.annotation_type,
            "date_created": self.date_created.strftime("%Y-%m-%d"),
            "qualifier": self.go_qualifier,
            "locus": {
                "display_name": self.dbentity.display_name,
                "link": self.dbentity.obj_url,
                "id": self.dbentity.dbentity_id,
                "format_name": self.dbentity.format_name
            },
            "go": {
                "display_name": go.display_name,
                "link": go.obj_url,
                "go_id": go.go_id,
                "go_aspect": go.go_namespace
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
            "properties": properties
        }


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

    def to_dict(self):
        return {
            "id": self.keyword_id,
            "name": self.display_name
        }


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

    def to_dict(self):
        entity = self.dbentity
        
        return {
            "topic": self.topic,
            "locus": {
                "display_name": entity.display_name,
                "link": entity.obj_url
            }
        }

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
        return {
            "id": self.phenotype_id,
            "display_name": self.display_name,
            "observable": {
                "display_name": self.observable.display_name,
                "link": self.observable.obj_url
            },
            "qualifier": self.qualifier.display_name,
            "overview": Phenotypeannotation.create_count_overview([self.phenotype_id])
        }

        return obj

    def annotations_to_dict(self):
        phenotypes = DBSession.query(Phenotypeannotation).filter_by(phenotype_id=self.phenotype_id).all()
        
        return [phenotype.to_dict(phenotype=self) for phenotype in phenotypes]


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
    def count_strains(phenotype_ids):
        strains_result = []
        
        counts = DBSession.query(Phenotypeannotation.taxonomy_id, func.count(Phenotypeannotation.taxonomy_id)).filter(Phenotypeannotation.phenotype_id.in_(phenotype_ids)).group_by(Phenotypeannotation.taxonomy_id).all()

        for count in counts:
            strains = Straindbentity.get_strains_by_taxon_id(count[0])
            
            if len(strains) > 1:
                strains_result.append(["Other", count[1]])
            elif len(strains) == 1:
                strains_result.append([strains[0].display_name, count[1]])
            else:
                continue            

        return sorted(strains_result, key=lambda strain: -1 * strain[1])

    @staticmethod
    def count_experiment_categories(phenotype_ids):
        annotations = DBSession.query(Phenotypeannotation).filter(Phenotypeannotation.phenotype_id.in_(phenotype_ids)).all()

        mt = {}
        for annotation in annotations:
            if annotation.mutant.display_name not in mt:
                mt[annotation.mutant.display_name] = {
                    "classical genetics": 0,
                    "large-scale survey": 0
                }

            if annotation.experiment.display_name in mt[annotation.mutant.display_name]:
                mt[annotation.mutant.display_name][annotation.experiment.display_name] += 1
            else:
                mt[annotation.mutant.display_name]["large-scale survey"] += 1
                
        experiment_categories = []
        for key in mt.keys():
            experiment_categories.append([key, mt[key]["classical genetics"], mt[key]["large-scale survey"]])

        return sorted(experiment_categories, key=lambda k: k[1] + k[2], reverse=True)
    
    # method for graphs counting annotations
    @staticmethod
    def create_count_overview(phenotype_ids):
        return {
            "strains": [["Strain", "Annotations"]] + Phenotypeannotation.count_strains(phenotype_ids),
            "experiment_categories": [["Mutant Type", "classical genetics", "large-scale survey"]] +  Phenotypeannotation.count_experiment_categories(phenotype_ids)
        }
    
    def to_dict(self, reference=None, chemical=None, phenotype=None):
        if reference == None:
            reference = self.reference
        
        properties = []
        
        if self.reporter:
            note = None
            if self.reporter.description and len(self.reporter.description) > 0:
                note = self.reporter.description
            properties.append({
                "class_type": "BIOITEM",
                "bioitem": {
                    "display_name": self.reporter.display_name
                },
                "note": note,
                "role": "Reporter"
            })

        if self.allele:
            note = None
            if self.allele.description and len(self.allele.description) > 0:
                note = self.allele.description

            properties.append({
                "class_type": "BIOITEM",
                "bioitem": {
                    "display_name": self.allele.display_name
                },
                "note": note,
                "role": "Allele"
            })
        
        conditions = DBSession.query(PhenotypeannotationCond).filter_by(annotation_id=self.annotation_id).all()

        for condition in conditions:
            if condition.condition_class == "chemical":
                if chemical is not None and (chemical.display_name == condition.condition_name):
                    chebi = chemical
                else:
                    chebi = DBSession.query(Chebi).filter_by(display_name=condition.condition_name).one_or_none()

                link = None
                if chebi:
                    link = chebi.obj_url

                properties.append({
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
                
                properties.append({
                    "class_type": condition.condition_class,
                    "note": note
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
        experiment_details = None
        
        if experiment:
            experiment_obj = {
                "display_name": experiment.display_name,
                "link": None, # self.experiment.obj_url -> no page yet
                "category": experiment.apo_namespace
            }
            experiment_details = experiment.description

        if phenotype:
            phenotype_obj = {
                "display_name": phenotype.display_name,
                "link": phenotype.obj_url
            }
        else:
            phenotype_obj = {
                "display_name": self.phenotype.display_name,
                "link": self.phenotype.obj_url
            }
            
        obj = {
            "id": self.annotation_id,
            "mutant_type": mutant.display_name,
            "locus": {
                "display_name": self.dbentity.display_name,
                "id": self.dbentity.dbentity_id,
                "link": self.dbentity.obj_url,
                "format_name": self.dbentity.format_name
            },
            "experiment": experiment_obj,
            "experiment_details": experiment_details,
            "strain": strain_obj,
            "properties": properties,
            "note": note,
            "phenotype": phenotype_obj,
            "reference": {
                "display_name": reference.display_name,
                "link": reference.obj_url,
                "pubmed_id": reference.pmid
            }
        }

        return obj

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

    def to_dict(self, reference):
        dbentity1 = self.dbentity1
        dbentity2 = self.dbentity2

        modification = "No Modification"
        if self.psimod:
            modification = self.psimod.display_name
            import pdb; pdb.set_trace()
        
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
        UniqueConstraint('parent_id', 'child_id', 'correction_type'),
        {u'schema': 'nex'}
    )

    reference_relation_id = Column(BigInteger, primary_key=True, server_default=text("nextval('nex.relation_seq'::regclass)"))
    source_id = Column(ForeignKey(u'nex.source.source_id', ondelete=u'CASCADE'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    child_id = Column(ForeignKey(u'nex.referencedbentity.dbentity_id', ondelete=u'CASCADE'), nullable=False, index=True)
    correction_type = Column(String(40), nullable=False)
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

    def to_dict(self):
        return {
            "curation_id": self.curation_id,
            "basic": {
                "pmid": self.pmid,
                "citation": self.citation,
                "fulltext_url": self.fulltext_url,
                "abstract": self.abstract,
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
                "link": self.locus.obj_url + "/overview"
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
