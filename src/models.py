from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String, Text, text, FetchedValue
from sqlalchemy.orm import scoped_session, sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from zope.sqlalchemy import ZopeTransactionExtension


DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


class Allele(Base):
    __tablename__ = 'allele'
    __table_args__ = {u'schema': 'NEX'}

    allele_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class Apo(Base):
    __tablename__ = 'apo'
    __table_args__ = {u'schema': 'NEX'}

    apo_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    apoid = Column(String(20), nullable=False, unique=True)
    apo_namespace = Column(String(20), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class ApoAlia(Base):
    __tablename__ = 'apo_alias'
    __table_args__ = (
        Index('apo_alias_uk', 'apo_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    apo_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    apo = relationship(u'Apo')
    source = relationship(u'Source')


class ApoRelation(Base):
    __tablename__ = 'apo_relation'
    __table_args__ = (
        Index('apo_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Apo', primaryjoin='ApoRelation.child_id == Apo.apo_id')
    parent = relationship(u'Apo', primaryjoin='ApoRelation.parent_id == Apo.apo_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class ApoUrl(Base):
    __tablename__ = 'apo_url'
    __table_args__ = (
        Index('apo_url_uk', 'apo_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    apo_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    apo = relationship(u'Apo')
    source = relationship(u'Source')


class ArchContig(Base):
    __tablename__ = 'arch_contig'
    __table_args__ = (
        Index('arch_contig_uk', 'format_name', 'genomerelease_id', unique=True),
        {u'schema': 'NEX'}
    )

    contig_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    taxonomy_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    centromere_start = Column(Numeric(scale=0, asdecimal=False))
    centromere_end = Column(Numeric(scale=0, asdecimal=False))
    genbank_accession = Column(String(40))
    gi_number = Column(String(40))
    refseq_id = Column(String(40))
    reference_chromosome_id = Column(Numeric(scale=0, asdecimal=False))
    reference_start = Column(Numeric(scale=0, asdecimal=False))
    reference_end = Column(Numeric(scale=0, asdecimal=False))
    reference_percent_identity = Column(Numeric(7, 3))
    reference_alignment_length = Column(Numeric(scale=0, asdecimal=False))
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    file_header = Column(String(200))
    download_filename = Column(String(200))
    file_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    description = Column(String(500))
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())


class ArchContigchange(Base):
    __tablename__ = 'arch_contigchange'
    __table_args__ = (
        Index('arch_contigchange_uk', 'contig_id', 'genomerelease_id', 'change_type', 'change_min_coord', 'change_max_coord', unique=True),
        {u'schema': 'NEX'}
    )

    archive_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    contig_id = Column(ForeignKey(u'NEX.arch_contig.contig_id'), nullable=False)
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    genomerelease_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    change_type = Column(String(40), nullable=False)
    change_min_coord = Column(Numeric(10, 0, asdecimal=False), nullable=False)
    change_max_coord = Column(Numeric(10, 0, asdecimal=False), nullable=False)
    old_value = Column(String(1000))
    new_value = Column(String(1000))
    date_changed = Column(DateTime, nullable=False)
    changed_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())

    contig = relationship(u'ArchContig')


class ArchDnaseqannotation(Base):
    __tablename__ = 'arch_dnaseqannotation'
    __table_args__ = (
        Index('arch_dnaseqannotation_uk', 'dbentity_id', 'taxonomy_id', 'contig_id', 'genomerelease_id', 'so_id', 'dna_type', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    taxonomy_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    reference_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    dna_type = Column(String(50), nullable=False)
    contig_id = Column(ForeignKey(u'NEX.arch_contig.contig_id'), index=True)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    start_index = Column(Numeric(scale=0, asdecimal=False))
    end_index = Column(Numeric(scale=0, asdecimal=False))
    strand = Column(String(1), nullable=False)
    file_header = Column(String(200))
    download_filename = Column(String(200))
    file_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())

    contig = relationship(u'ArchContig')


class ArchDnasubsequence(Base):
    __tablename__ = 'arch_dnasubsequence'
    __table_args__ = (
        Index('arch_dnasubsequence_uk', 'annotation_id', 'dbentity_id', 'genomerelease_id', 'relative_start_index', 'relative_end_index', unique=True),
        {u'schema': 'NEX'}
    )

    dnasubsequence_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.arch_dnaseqannotation.annotation_id'), nullable=False)
    dbentity_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    display_name = Column(String(500), nullable=False)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    relative_start_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    relative_end_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    contig_start_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    contig_end_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())

    annotation = relationship(u'ArchDnaseqannotation')


class ArchLiteratureannotation(Base):
    __tablename__ = 'arch_literatureannotation'
    __table_args__ = (
        Index('arch_literatureannotation_uk', 'reference_id', 'topic', 'locus_id', unique=True),
        {u'schema': 'NEX'}
    )

    archive_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    reference_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    taxonomy_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    locus_id = Column(Numeric(scale=0, asdecimal=False))
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    topic = Column(String(42), nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())


class ArchLocuschange(Base):
    __tablename__ = 'arch_locuschange'
    __table_args__ = (
        Index('arch_locuschange_uk', 'dbentity_id', 'change_type', 'old_value', 'new_value', 'date_changed', unique=True),
        {u'schema': 'NEX'}
    )

    archive_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    change_type = Column(String(100), nullable=False)
    old_value = Column(String(40))
    new_value = Column(String(40))
    date_changed = Column(DateTime, nullable=False)
    changed_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())


class ArchProteinseqannotation(Base):
    __tablename__ = 'arch_proteinseqannotation'
    __table_args__ = (
        Index('arch_proteinseqannotation_uk', 'dbentity_id', 'taxonomy_id', 'contig_id', 'genomerelease_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    taxonomy_id = Column(Numeric(scale=0, asdecimal=False), nullable=False, index=True)
    reference_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    contig_id = Column(ForeignKey(u'NEX.arch_contig.contig_id'), nullable=False, index=True)
    seq_version = Column(DateTime)
    genomerelease_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    file_header = Column(String(200))
    download_filename = Column(String(200))
    file_id = Column(Numeric(scale=0, asdecimal=False), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False)
    created_by = Column(String(12), nullable=False)
    date_archived = Column(DateTime, nullable=False, server_default=FetchedValue())

    contig = relationship(u'ArchContig')


class Authorresponse(Base):
    __tablename__ = 'authorresponse'
    __table_args__ = {u'schema': 'NEX'}

    curation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    reference_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False, unique=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), index=True)
    author_email = Column(String(100), nullable=False)
    has_novel_research = Column(Numeric(1, 0, asdecimal=False))
    has_large_scale_data = Column(Numeric(1, 0, asdecimal=False))
    has_fast_track_tag = Column(Numeric(1, 0, asdecimal=False))
    curator_checked_datasets = Column(Numeric(1, 0, asdecimal=False))
    curator_checked_genelist = Column(Numeric(1, 0, asdecimal=False))
    no_action_required = Column(Numeric(1, 0, asdecimal=False))
    research_results = Column(Text)
    gene_list = Column(String(4000))
    dataset_description = Column(String(4000))
    other_description = Column(String(4000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    reference = relationship(u'Dbentity')
    source = relationship(u'Source')


class Bindingmotifannotation(Base):
    __tablename__ = 'bindingmotifannotation'
    __table_args__ = (
        Index('bindingmotifannotation_uk', 'dbentity_id', 'motif_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    obj_url = Column(String(500), nullable=False)
    motif_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    logo_url = Column(String(500), nullable=False)

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Book(Base):
    __tablename__ = 'book'
    __table_args__ = (
        Index('book_uk', 'title', 'volume_title', unique=True),
        {u'schema': 'NEX'}
    )

    book_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    title = Column(String(200), nullable=False)
    volume_title = Column(String(200))
    isbn = Column(String(20))
    total_pages = Column(Numeric(scale=0, asdecimal=False))
    publisher = Column(String(100))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class Chebi(Base):
    __tablename__ = 'chebi'
    __table_args__ = {u'schema': 'NEX'}

    chebi_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    chebiid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class ChebiAlia(Base):
    __tablename__ = 'chebi_alias'
    __table_args__ = (
        Index('chebi_alias_uk', 'chebi_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    chebi_id = Column(ForeignKey(u'NEX.chebi.chebi_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    chebi = relationship(u'Chebi')
    source = relationship(u'Source')


class ChebiRelation(Base):
    __tablename__ = 'chebi_relation'
    __table_args__ = (
        Index('chebi_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.chebi.chebi_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.chebi.chebi_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Chebi', primaryjoin='ChebiRelation.child_id == Chebi.chebi_id')
    parent = relationship(u'Chebi', primaryjoin='ChebiRelation.parent_id == Chebi.chebi_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class ChebiUrl(Base):
    __tablename__ = 'chebi_url'
    __table_args__ = (
        Index('chebi_url_uk', 'chebi_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    chebi_id = Column(ForeignKey(u'NEX.chebi.chebi_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    chebi = relationship(u'Chebi')
    source = relationship(u'Source')


class Colleague(Base):
    __tablename__ = 'colleague'
    __table_args__ = {u'schema': 'NEX'}

    colleague_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    orcid = Column(String(20), unique=True)
    last_name = Column(String(40), nullable=False)
    first_name = Column(String(40), nullable=False)
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
    fax = Column(String(40))
    email = Column(String(100))
    research_interest = Column(String(4000))
    is_pi = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    is_contact = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    display_email = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    date_last_modified = Column(DateTime, nullable=False, server_default=FetchedValue())
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    colleague_note = Column(String(1000))

    source = relationship(u'Source')
    urls = relationship(u'ColleagueUrl')

    def _include_urls_to_dict(self, colleague_dict):
        for url in self.urls:
            if colleague_dict.get('webpages') is None:
                colleague_dict['webpages'] = {}

            if url.url_type == "Lab":
                colleague_dict['webpages']['lab_url'] = url.obj_url
            elif url.url_type == "Research summary":
                colleague_dict['webpages']['research_summary_url'] = url.obj_url

    def _include_associates_to_dict(self, colleague_dict):
        obj = {}
        
        for associate_id, association_type in DBSession.query(ColleagueAssociation.associate_id, ColleagueAssociation.association_type).filter(ColleagueAssociation.colleague_id == self.colleague_id).all():
            colleague = DBSession.query(Colleague.first_name, Colleague.last_name, Colleague.format_name).filter(Colleague.colleague_id == associate_id).one_or_none()
            if colleague is not None:
                if obj.get(association_type) is None:
                    obj[association_type] = [colleague]
                else:
                    obj[association_type].append(colleague)

        if obj != {}:
            colleague_dict['associations'] = obj

    def _include_keywords_to_dict(self, colleague_dict):
        keyword_ids = DBSession.query(ColleagueKeyword.keyword_id).filter(ColleagueKeyword.colleague_id == self.colleague_id).all()
        if len(keyword_ids) > 0:
            ids_query = [k[0] for k in keyword_ids]
            keywords = DBSession.query(Keyword.display_name).filter(Keyword.keyword_id.in_(ids_query)).all()
            colleague_dict['keywords'] = [k[0] for k in keywords]

                
    def to_search_results_dict(self):
        colleague_dict = {
            'format_name': self.format_name,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'organization': self.institution,
            'work_phone': self.work_phone,
            'fax': self.fax
        }

        if self.display_email:
            colleague_dict['email'] = self.email

        self._include_urls_to_dict(colleague_dict)
        return colleague_dict

    def to_info_dict(self):
        colleague_dict = {
            'orcid': self.orcid,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'position': self.job_title,
            'profession': self.profession,
            'organization': self.institution,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'work_phone': self.work_phone,
            'fax': self.fax,
            'research_interests': self.research_interest,
            'last_update': str(self.date_last_modified)
        }

        colleague_dict['address'] = []
        for addr in [self.address1, self.address2, self.address3]:
            if addr is not None:
                colleague_dict['address'].append(addr)
        if len(colleague_dict['address']) == 0:
            colleague_dict['address'] = None
        
        if self.display_email:
            colleague_dict['email'] = self.email
        
        self._include_urls_to_dict(colleague_dict)
        self._include_associates_to_dict(colleague_dict)
        self._include_keywords_to_dict(colleague_dict)
        return colleague_dict


class ColleagueAssociation(Base):
    __tablename__ = 'colleague_association'
    __table_args__ = (
        Index('colleague_association_uk', 'colleague_id', 'associate_id', 'association_type', unique=True),
        {u'schema': 'NEX'}
    )

    colleague_association_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False)
    associate_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False, index=True)
    association_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    associate = relationship(u'Colleague', primaryjoin='ColleagueAssociation.associate_id == Colleague.colleague_id')
    colleague = relationship(u'Colleague', primaryjoin='ColleagueAssociation.colleague_id == Colleague.colleague_id')
    source = relationship(u'Source')


class ColleagueKeyword(Base):
    __tablename__ = 'colleague_keyword'
    __table_args__ = (
        Index('colleague_keyword_uk', 'keyword_id', 'colleague_id', unique=True),
        {u'schema': 'NEX'}
    )

    colleague_keyword_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False, index=True)
    keyword_id = Column(ForeignKey(u'NEX.keyword.keyword_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')


class ColleagueLocu(Base):
    __tablename__ = 'colleague_locus'
    __table_args__ = (
        Index('colleague_locus_uk', 'colleague_id', 'locus_id', unique=True),
        {u'schema': 'NEX'}
    )

    colleague_locus_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False)
    locus_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class ColleagueReference(Base):
    __tablename__ = 'colleague_reference'
    __table_args__ = (
        Index('colleague_reference_uk', 'colleague_id', 'reference_id', unique=True),
        {u'schema': 'NEX'}
    )

    colleague_reference_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class ColleagueUrl(Base):
    __tablename__ = 'colleague_url'
    __table_args__ = (
        Index('colleague_url_uk', 'colleague_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    source = relationship(u'Source')


class Colleaguetriage(Base):
    __tablename__ = 'colleaguetriage'
    __table_args__ = {u'schema': 'NEX'}

    curation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    triage_type = Column(String(10), nullable=False)
    colleague_id = Column(Numeric(scale=0, asdecimal=False))
    colleague_data = Column(Text)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())


class Contig(Base):
    __tablename__ = 'contig'
    __table_args__ = {u'schema': 'NEX'}

    contig_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False, index=True)
    centromere_start = Column(Numeric(scale=0, asdecimal=False))
    centromere_end = Column(Numeric(scale=0, asdecimal=False))
    genbank_accession = Column(String(40), nullable=False)
    gi_number = Column(String(40))
    refseq_id = Column(String(40))
    reference_chromosome_id = Column(Numeric(scale=0, asdecimal=False))
    reference_start = Column(Numeric(scale=0, asdecimal=False))
    reference_end = Column(Numeric(scale=0, asdecimal=False))
    reference_percent_identity = Column(Numeric(7, 3))
    reference_alignment_length = Column(Numeric(scale=0, asdecimal=False))
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'NEX.genomerelease.genomerelease_id'), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    file = relationship(u'Filedbentity')
    genomerelease = relationship(u'Genomerelease')
    so = relationship(u'So')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class ContigUrl(Base):
    __tablename__ = 'contig_url'
    __table_args__ = (
        Index('contig_url_uk', 'contig_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    contig_id = Column(ForeignKey(u'NEX.contig.contig_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    contig = relationship(u'Contig')
    source = relationship(u'Source')


class Contignoteannotation(Base):
    __tablename__ = 'contignoteannotation'
    __table_args__ = (
        Index('contignoteannotation_uk', 'contig_id', 'note_type', 'display_name', 'note', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    contig_id = Column(ForeignKey(u'NEX.contig.contig_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    note_type = Column(String(40), nullable=False)
    display_name = Column(String(500), nullable=False)
    note = Column(String(2000), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    contig = relationship(u'Contig')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Curation(Base):
    __tablename__ = 'curation'
    __table_args__ = (
        Index('curation_uk', 'dbentity_id', 'subclass', 'curation_task', 'locus_id', unique=True),
        {u'schema': 'NEX'}
    )

    curation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    locus_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    subclass = Column(String(40), nullable=False)
    curation_task = Column(String(40), nullable=False)
    curator_comment = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    locus = relationship(u'Locusdbentity', foreign_keys=[locus_id])
    source = relationship(u'Source')


class Dataset(Base):
    __tablename__ = 'dataset'
    __table_args__ = {u'schema': 'NEX'}

    dataset_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    dbxref_id = Column(String(40))
    dbxref_type = Column(String(40))
    assay_id = Column(ForeignKey(u'NEX.obi.obi_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), index=True)
    channel_count = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    sample_count = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    is_in_spell = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    is_in_browser = Column(Numeric(1, 0, asdecimal=False), nullable=False)

    assay = relationship(u'Obi')
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class DatasetFile(Base):
    __tablename__ = 'dataset_file'
    __table_args__ = (
        Index('dataset_file_uk', 'dataset_id', 'file_id', unique=True),
        {u'schema': 'NEX'}
    )

    dataset_file_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dataset_id = Column(ForeignKey(u'NEX.dataset.dataset_id'), nullable=False)
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dataset = relationship(u'Dataset')
    file = relationship(u'Filedbentity')
    source = relationship(u'Source')


class DatasetKeyword(Base):
    __tablename__ = 'dataset_keyword'
    __table_args__ = (
        Index('dataset_keyword_uk', 'keyword_id', 'dataset_id', unique=True),
        {u'schema': 'NEX'}
    )

    dataset_keyword_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    keyword_id = Column(ForeignKey(u'NEX.keyword.keyword_id'), nullable=False)
    dataset_id = Column(ForeignKey(u'NEX.dataset.dataset_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dataset = relationship(u'Dataset')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')


class DatasetReference(Base):
    __tablename__ = 'dataset_reference'
    __table_args__ = (
        Index('dataset_reference_uk', 'reference_id', 'dataset_id', unique=True),
        {u'schema': 'NEX'}
    )

    dataset_reference_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    dataset_id = Column(ForeignKey(u'NEX.dataset.dataset_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dataset = relationship(u'Dataset')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class DatasetUrl(Base):
    __tablename__ = 'dataset_url'
    __table_args__ = (
        Index('dataset_url_uk', 'dataset_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    dataset_id = Column(ForeignKey(u'NEX.dataset.dataset_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dataset = relationship(u'Dataset')
    source = relationship(u'Source')


class Datasetlab(Base):
    __tablename__ = 'datasetlab'
    __table_args__ = (
        Index('datasetlab_uk', 'lab_name', 'dataset_id', unique=True),
        {u'schema': 'NEX'}
    )

    datasetlab_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dataset_id = Column(ForeignKey(u'NEX.dataset.dataset_id'), nullable=False, index=True)
    source_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    lab_name = Column(String(40), nullable=False)
    lab_location = Column(String(100), nullable=False)
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    dataset = relationship(u'Dataset')


class Datasetsample(Base):
    __tablename__ = 'datasetsample'
    __table_args__ = {u'schema': 'NEX'}

    datasetsample_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    dataset_id = Column(ForeignKey(u'NEX.dataset.dataset_id'), nullable=False, index=True)
    dbxref_id = Column(String(40))
    dbxref_type = Column(String(40))
    sample_order = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    biosample = Column(String(500))
    strain_name = Column(String(500))

    dataset = relationship(u'Dataset')
    source = relationship(u'Source')


class Dbentity(Base):
    __tablename__ = 'dbentity'
    __table_args__ = (
        Index('dbentity_uk', 'format_name', 'subclass', unique=True),
        {u'schema': 'NEX'}
    )

    dbentity_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    sgdid = Column(String(20), nullable=False, unique=True)
    subclass = Column(String(40), nullable=False)
    dbentity_status = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')

    __mapper_args__ = {
        'polymorphic_identity':'dbentity',
        'polymorphic_on':subclass
    }


class Dbuser(Base):
    __tablename__ = 'dbuser'
    __table_args__ = {u'schema': 'NEX'}

    dbuser_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    username = Column(String(12), nullable=False, unique=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    first_name = Column(String(40), nullable=False)
    last_name = Column(String(40), nullable=False)
    status = Column(String(40), nullable=False)
    email = Column(String(100), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    is_curator = Column(Numeric(1, 0, asdecimal=False), nullable=False)


class DeleteLog(Base):
    __tablename__ = 'delete_log'
    __table_args__ = {u'schema': 'NEX'}

    delete_log_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    tab_name = Column(String(30), nullable=False)
    primary_key = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    deleted_row = Column(Text, nullable=False)


class Dnasequenceannotation(Base):
    __tablename__ = 'dnasequenceannotation'
    __table_args__ = (
        Index('dnasequenceannotation_uk', 'dbentity_id', 'taxonomy_id', 'contig_id', 'so_id', 'dna_type', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False, index=True)
    dna_type = Column(String(50), nullable=False)
    contig_id = Column(ForeignKey(u'NEX.contig.contig_id'), nullable=False, index=True)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'NEX.genomerelease.genomerelease_id'), index=True)
    start_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    end_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    strand = Column(String(1), nullable=False)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

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
        Index('dnasubsequence_uk', 'annotation_id', 'dbentity_id', 'relative_start_index', 'relative_end_index', unique=True),
        {u'schema': 'NEX'}
    )

    dnasubsequence_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.dnasequenceannotation.annotation_id'), nullable=False)
    dbentity_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False, index=True)
    display_name = Column(String(500), nullable=False)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False, index=True)
    relative_start_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    relative_end_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    contig_start_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    contig_end_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    seq_version = Column(DateTime)
    coord_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'NEX.genomerelease.genomerelease_id'), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), index=True)
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    annotation = relationship(u'Dnasequenceannotation')
    dbentity = relationship(u'Locusdbentity')
    file = relationship(u'Filedbentity')
    genomerelease = relationship(u'Genomerelease')
    so = relationship(u'So')


class Ec(Base):
    __tablename__ = 'ec'
    __table_args__ = {u'schema': 'NEX'}

    ec_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    ecid = Column(String(20), nullable=False, unique=True)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class EcAlia(Base):
    __tablename__ = 'ec_alias'
    __table_args__ = (
        Index('ec_alias_uk', 'ec_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    ec_id = Column(ForeignKey(u'NEX.ec.ec_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    ec = relationship(u'Ec')
    source = relationship(u'Source')


class EcUrl(Base):
    __tablename__ = 'ec_url'
    __table_args__ = (
        Index('ec_url_uk', 'ec_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    ec_id = Column(ForeignKey(u'NEX.ec.ec_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    ec = relationship(u'Ec')
    source = relationship(u'Source')


class Eco(Base):
    __tablename__ = 'eco'
    __table_args__ = {u'schema': 'NEX'}

    eco_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    ecoid = Column(String(20), nullable=False, unique=True)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class EcoAlia(Base):
    __tablename__ = 'eco_alias'
    __table_args__ = (
        Index('eco_alias_uk', 'eco_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    eco_id = Column(ForeignKey(u'NEX.eco.eco_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    eco = relationship(u'Eco')
    source = relationship(u'Source')


class EcoRelation(Base):
    __tablename__ = 'eco_relation'
    __table_args__ = (
        Index('eco_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.eco.eco_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.eco.eco_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Eco', primaryjoin='EcoRelation.child_id == Eco.eco_id')
    parent = relationship(u'Eco', primaryjoin='EcoRelation.parent_id == Eco.eco_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class EcoUrl(Base):
    __tablename__ = 'eco_url'
    __table_args__ = (
        Index('eco_url_uk', 'eco_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    eco_id = Column(ForeignKey(u'NEX.eco.eco_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    eco = relationship(u'Eco')
    source = relationship(u'Source')


class Edam(Base):
    __tablename__ = 'edam'
    __table_args__ = {u'schema': 'NEX'}

    edam_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    edamid = Column(String(20), nullable=False, unique=True)
    edam_namespace = Column(String(20), nullable=False)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')

    def to_dict(self):
        return {'id': int(self.edam_id), 'name': self.format_name}

class EdamAlia(Base):
    __tablename__ = 'edam_alias'
    __table_args__ = (
        Index('edam_alias_uk', 'edam_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    edam_id = Column(ForeignKey(u'NEX.edam.edam_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    edam = relationship(u'Edam')
    source = relationship(u'Source')


class EdamRelation(Base):
    __tablename__ = 'edam_relation'
    __table_args__ = (
        Index('edam_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.edam.edam_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.edam.edam_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Edam', primaryjoin='EdamRelation.child_id == Edam.edam_id')
    parent = relationship(u'Edam', primaryjoin='EdamRelation.parent_id == Edam.edam_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class EdamUrl(Base):
    __tablename__ = 'edam_url'
    __table_args__ = (
        Index('edam_url_uk', 'edam_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    edam_id = Column(ForeignKey(u'NEX.edam.edam_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    edam = relationship(u'Edam')
    source = relationship(u'Source')


class Enzymeannotation(Base):
    __tablename__ = 'enzymeannotation'
    __table_args__ = (
        Index('enzymeannotation_uk', 'dbentity_id', 'ec_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    ec_id = Column(ForeignKey(u'NEX.ec.ec_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    ec = relationship(u'Ec')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Expressionannotation(Base):
    __tablename__ = 'expressionannotation'
    __table_args__ = (
        Index('expressionannotation_uk', 'datasetsample_id', 'dbentity_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    datasetsample_id = Column(ForeignKey(u'NEX.datasetsample.datasetsample_id'), nullable=False)
    expression_value = Column(Numeric(7, 3), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    datasetsample = relationship(u'Datasetsample')
    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class FileKeyword(Base):
    __tablename__ = 'file_keyword'
    __table_args__ = (
        Index('file_keyword_uk', 'file_id', 'keyword_id', unique=True),
        {u'schema': 'NEX'}
    )

    file_keyword_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), nullable=False)
    keyword_id = Column(ForeignKey(u'NEX.keyword.keyword_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    file = relationship(u'Filedbentity')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')


class Filedbentity(Dbentity):
    __tablename__ = 'filedbentity'
    __table_args__ = {u'schema': 'NEX'}

    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), primary_key=True)
    md5sum = Column(String(32), index=True)
    previous_file_name = Column(String(100))
    topic_id = Column(ForeignKey(u'NEX.edam.edam_id'), nullable=False, index=True)
    format_id = Column(ForeignKey(u'NEX.edam.edam_id'), nullable=False, index=True)
    file_date = Column(DateTime, nullable=False)
    is_public = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    is_in_spell = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    is_in_browser = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    filepath_id = Column(ForeignKey(u'NEX.filepath.filepath_id'), index=True)
    readme_url = Column(String(500))
    file_extension = Column(String(20), nullable=False)
    s3_url = Column(String(500))

    filepath = relationship(u'Filepath')
    format = relationship(u'Edam', primaryjoin='Filedbentity.format_id == Edam.edam_id')
    topic = relationship(u'Edam', primaryjoin='Filedbentity.topic_id == Edam.edam_id')

    __mapper_args__ = {
        'polymorphic_identity':'FILE',
    }


class Filepath(Base):
    __tablename__ = 'filepath'
    __table_args__ = {u'schema': 'NEX'}

    filepath_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    filepath = Column(String(500), nullable=False, unique=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class Geninteractionannotation(Base):
    __tablename__ = 'geninteractionannotation'
    __table_args__ = (
        Index('geninteractionannotation_uk', 'dbentity1_id', 'dbentity2_id', 'bait_hit', 'biogrid_experimental_system', 'reference_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity1_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    dbentity2_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    phenotype_id = Column(ForeignKey(u'NEX.phenotype.phenotype_id'), index=True)
    biogrid_experimental_system = Column(String(100), nullable=False)
    annotation_type = Column(String(20), nullable=False)
    bait_hit = Column(String(10), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity1 = relationship(u'Dbentity', primaryjoin='Geninteractionannotation.dbentity1_id == Dbentity.dbentity_id')
    dbentity2 = relationship(u'Dbentity', primaryjoin='Geninteractionannotation.dbentity2_id == Dbentity.dbentity_id')
    phenotype = relationship(u'Phenotype')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Genomerelease(Base):
    __tablename__ = 'genomerelease'
    __table_args__ = {u'schema': 'NEX'}

    genomerelease_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), index=True)
    sequence_release = Column(Numeric(4, 0, asdecimal=False), nullable=False)
    annotation_release = Column(Numeric(4, 0, asdecimal=False), nullable=False)
    curation_release = Column(Numeric(4, 0, asdecimal=False), nullable=False)
    release_date = Column(DateTime, nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    file = relationship(u'Filedbentity')
    source = relationship(u'Source')


class Go(Base):
    __tablename__ = 'go'
    __table_args__ = {u'schema': 'NEX'}

    go_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    goid = Column(String(20), nullable=False, unique=True)
    go_namespace = Column(String(20), nullable=False)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class GoAlia(Base):
    __tablename__ = 'go_alias'
    __table_args__ = (
        Index('go_alias_uk', 'go_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    go_id = Column(ForeignKey(u'NEX.go.go_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    go = relationship(u'Go')
    source = relationship(u'Source')


class GoRelation(Base):
    __tablename__ = 'go_relation'
    __table_args__ = (
        Index('go_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.go.go_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.go.go_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Go', primaryjoin='GoRelation.child_id == Go.go_id')
    parent = relationship(u'Go', primaryjoin='GoRelation.parent_id == Go.go_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class GoUrl(Base):
    __tablename__ = 'go_url'
    __table_args__ = (
        Index('go_url_uk', 'go_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    go_id = Column(ForeignKey(u'NEX.go.go_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    go = relationship(u'Go')
    source = relationship(u'Source')


class Goannotation(Base):
    __tablename__ = 'goannotation'
    __table_args__ = (
        Index('goannotation_uk', 'dbentity_id', 'go_id', 'eco_id', 'reference_id', 'annotation_type', 'go_qualifier', 'source_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    go_id = Column(ForeignKey(u'NEX.go.go_id'), nullable=False, index=True)
    eco_id = Column(ForeignKey(u'NEX.eco.eco_id'), nullable=False, index=True)
    annotation_type = Column(String(40), nullable=False)
    go_qualifier = Column(String(40), nullable=False)
    date_assigned = Column(DateTime, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    eco = relationship(u'Eco')
    go = relationship(u'Go')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Goextension(Base):
    __tablename__ = 'goextension'
    __table_args__ = (
        Index('goextension_uk', 'annotation_id', 'dbxref_id', 'group_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    goextension_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.goannotation.annotation_id'), nullable=False)
    group_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    dbxref_id = Column(String(40), nullable=False)
    obj_url = Column(String(500), nullable=False)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    annotation = relationship(u'Goannotation')
    ro = relationship(u'Ro')


class Goslim(Base):
    __tablename__ = 'goslim'
    __table_args__ = {u'schema': 'NEX'}

    goslim_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    go_id = Column(ForeignKey(u'NEX.go.go_id'), nullable=False, index=True)
    slim_name = Column(String(40), nullable=False)
    genome_count = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    go = relationship(u'Go')
    source = relationship(u'Source')


class Goslimannotation(Base):
    __tablename__ = 'goslimannotation'
    __table_args__ = (
        Index('goslimannotation_uk', 'dbentity_id', 'goslim_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    goslim_id = Column(ForeignKey(u'NEX.goslim.goslim_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    goslim = relationship(u'Goslim')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Gosupportingevidence(Base):
    __tablename__ = 'gosupportingevidence'
    __table_args__ = (
        Index('gosupportingevidence_uk', 'annotation_id', 'dbxref_id', 'group_id', 'evidence_type', unique=True),
        {u'schema': 'NEX'}
    )

    gosupportingevidence_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.goannotation.annotation_id'), nullable=False)
    group_id = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    dbxref_id = Column(String(40), nullable=False)
    obj_url = Column(String(500), nullable=False)
    evidence_type = Column(String(10), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    annotation = relationship(u'Goannotation')


class Journal(Base):
    __tablename__ = 'journal'
    __table_args__ = (
        Index('journal_uk', 'med_abbr', 'title', unique=True),
        {u'schema': 'NEX'}
    )

    journal_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    med_abbr = Column(String(100))
    title = Column(String(200))
    issn_print = Column(String(10))
    issn_electronic = Column(String(10))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class Keyword(Base):
    __tablename__ = 'keyword'
    __table_args__ = {u'schema': 'NEX'}

    keyword_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')

    def to_dict(self):
        return {'name': self.display_name, 'id': int(self.keyword_id)}


class Literatureannotation(Base):
    __tablename__ = 'literatureannotation'
    __table_args__ = (
        Index('literatureannotation_uk', 'dbentity_id', 'reference_id', 'topic', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    topic = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class LocusAlia(Base):
    __tablename__ = 'locus_alias'
    __table_args__ = (
        Index('locus_alias_uk', 'locus_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    locus_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False)
    has_external_id_section = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class LocusRelation(Base):
    __tablename__ = 'locus_relation'
    __table_args__ = (
        Index('locus_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Locusdbentity', primaryjoin='LocusRelation.child_id == Locusdbentity.dbentity_id')
    parent = relationship(u'Locusdbentity', primaryjoin='LocusRelation.parent_id == Locusdbentity.dbentity_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class LocusSummary(Base):
    __tablename__ = 'locus_summary'
    __table_args__ = (
        Index('locus_summary_uk', 'locus_id', 'summary_type', 'summary_order', unique=True),
        {u'schema': 'NEX'}
    )

    summary_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    locus_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False)
    summary_type = Column(String(40), nullable=False)
    summary_order = Column(Numeric(scale=0, asdecimal=False), nullable=False, server_default=FetchedValue())
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class LocusSummaryReference(Base):
    __tablename__ = 'locus_summary_reference'
    __table_args__ = (
        Index('locus_summary_reference_uk', 'summary_id', 'reference_id', unique=True),
        {u'schema': 'NEX'}
    )

    summary_reference_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    summary_id = Column(ForeignKey(u'NEX.locus_summary.summary_id'), nullable=False)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    reference_order = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    summary = relationship(u'LocusSummary')


class LocusUrl(Base):
    __tablename__ = 'locus_url'
    __table_args__ = (
        Index('locus_url_uk', 'locus_id', 'display_name', 'obj_url', 'placement', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    locus_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    placement = Column(String(100))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class Locusdbentity(Dbentity):
    __tablename__ = 'locusdbentity'
    __table_args__ = {u'schema': 'NEX'}

    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), primary_key=True)
    systematic_name = Column(String(40), nullable=False, unique=True)
    gene_name = Column(String(20))
    qualifier = Column(String(40))
    genetic_position = Column(Numeric(5, 2))
    name_description = Column(String(100))
    headline = Column(String(70))
    description = Column(String(500))
    has_summary = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_sequence = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_history = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_literature = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_go = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_phenotype = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_interaction = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_expression = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_regulation = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_protein = Column(Numeric(1, 0, asdecimal=False), nullable=False)
    has_sequence_section = Column(Numeric(1, 0, asdecimal=False), nullable=False)


class Locusnoteannotation(Base):
    __tablename__ = 'locusnoteannotation'
    __table_args__ = (
        Index('locusnoteannotation_uk', 'dbentity_id', 'note_type', 'display_name', 'note', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    note_type = Column(String(40), nullable=False)
    display_name = Column(String(500), nullable=False)
    note = Column(String(2000), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Obi(Base):
    __tablename__ = 'obi'
    __table_args__ = {u'schema': 'NEX'}

    obi_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    obiid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class ObiRelation(Base):
    __tablename__ = 'obi_relation'
    __table_args__ = (
        Index('obi_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.obi.obi_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.obi.obi_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Obi', primaryjoin='ObiRelation.child_id == Obi.obi_id')
    parent = relationship(u'Obi', primaryjoin='ObiRelation.parent_id == Obi.obi_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class ObiUrl(Base):
    __tablename__ = 'obi_url'
    __table_args__ = (
        Index('obi_url_uk', 'obi_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    obi_id = Column(ForeignKey(u'NEX.obi.obi_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    obi = relationship(u'Obi')
    source = relationship(u'Source')


class PathwayAlia(Base):
    __tablename__ = 'pathway_alias'
    __table_args__ = (
        Index('pathway_alias_uk', 'pathway_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    pathway_id = Column(ForeignKey(u'NEX.pathwaydbentity.dbentity_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    pathway = relationship(u'Pathwaydbentity')
    source = relationship(u'Source')


class PathwaySummary(Base):
    __tablename__ = 'pathway_summary'
    __table_args__ = (
        Index('pathway_summary_uk', 'pathway_id', 'summary_type', unique=True),
        {u'schema': 'NEX'}
    )

    summary_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    pathway_id = Column(ForeignKey(u'NEX.pathwaydbentity.dbentity_id'), nullable=False)
    summary_type = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    pathway = relationship(u'Pathwaydbentity')
    source = relationship(u'Source')


class PathwaySummaryReference(Base):
    __tablename__ = 'pathway_summary_reference'
    __table_args__ = (
        Index('pathway_summary_reference_uk', 'summary_id', 'reference_id', unique=True),
        {u'schema': 'NEX'}
    )

    summary_reference_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    summary_id = Column(ForeignKey(u'NEX.pathway_summary.summary_id'), nullable=False)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    reference_order = Column(Numeric(scale=0, asdecimal=False))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    summary = relationship(u'PathwaySummary')


class PathwayUrl(Base):
    __tablename__ = 'pathway_url'
    __table_args__ = (
        Index('pathway_url_uk', 'pathway_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    pathway_id = Column(ForeignKey(u'NEX.pathwaydbentity.dbentity_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    pathway = relationship(u'Pathwaydbentity')
    source = relationship(u'Source')


class Pathwayannotation(Base):
    __tablename__ = 'pathwayannotation'
    __table_args__ = (
        Index('pathwayannotation_uk', 'dbentity_id', 'pathway_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    pathway_id = Column(ForeignKey(u'NEX.pathwaydbentity.dbentity_id'), nullable=False, index=True)
    ec_id = Column(ForeignKey(u'NEX.ec.ec_id'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    ec = relationship(u'Ec')
    pathway = relationship(u'Pathwaydbentity', foreign_keys=[pathway_id])
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Pathwaydbentity(Dbentity):
    __tablename__ = 'pathwaydbentity'
    __table_args__ = {u'schema': 'NEX'}

    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), primary_key=True)
    biocyc_id = Column(String(40))


class Phenotype(Base):
    __tablename__ = 'phenotype'
    __table_args__ = {u'schema': 'NEX'}

    phenotype_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    observable_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False, index=True)
    qualifier_id = Column(ForeignKey(u'NEX.apo.apo_id'), index=True)
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    observable = relationship(u'Apo', primaryjoin='Phenotype.observable_id == Apo.apo_id')
    qualifier = relationship(u'Apo', primaryjoin='Phenotype.qualifier_id == Apo.apo_id')
    source = relationship(u'Source')


class Phenotypeannotation(Base):
    __tablename__ = 'phenotypeannotation'
    __table_args__ = (
        Index('phenotypeannotation_uk', 'dbentity_id', 'phenotype_id', 'experiment_id', 'mutant_id', 'reference_id', 'taxonomy_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    phenotype_id = Column(ForeignKey(u'NEX.phenotype.phenotype_id'), nullable=False, index=True)
    experiment_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False, index=True)
    mutant_id = Column(ForeignKey(u'NEX.apo.apo_id'), nullable=False, index=True)
    allele_id = Column(ForeignKey(u'NEX.allele.allele_id'), index=True)
    reporter_id = Column(ForeignKey(u'NEX.reporter.reporter_id'), index=True)
    assay_id = Column(ForeignKey(u'NEX.obi.obi_id'), index=True)
    strain_name = Column(String(100))
    details = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

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


class PhenotypeannotationCond(Base):
    __tablename__ = 'phenotypeannotation_cond'
    __table_args__ = (
        Index('phenotypeannotation_cond_uk', 'annotation_id', 'condition_type', 'condition_name', 'condition_value', unique=True),
        {u'schema': 'NEX'}
    )

    condition_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.phenotypeannotation.annotation_id'), nullable=False)
    condition_type = Column(String(40), nullable=False)
    condition_name = Column(String(500), nullable=False)
    condition_value = Column(String(25))
    condition_unit = Column(String(25))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    annotation = relationship(u'Phenotypeannotation')


class Physinteractionannotation(Base):
    __tablename__ = 'physinteractionannotation'
    __table_args__ = (
        Index('physinteractionannotation_uk', 'dbentity1_id', 'dbentity2_id', 'bait_hit', 'biogrid_experimental_system', 'reference_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity1_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    dbentity2_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    psimod_id = Column(ForeignKey(u'NEX.psimod.psimod_id'), index=True)
    biogrid_experimental_system = Column(String(100), nullable=False)
    annotation_type = Column(String(20), nullable=False)
    bait_hit = Column(String(10), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity1 = relationship(u'Dbentity', primaryjoin='Physinteractionannotation.dbentity1_id == Dbentity.dbentity_id')
    dbentity2 = relationship(u'Dbentity', primaryjoin='Physinteractionannotation.dbentity2_id == Dbentity.dbentity_id')
    psimod = relationship(u'Psimod')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Posttranslationannotation(Base):
    __tablename__ = 'posttranslationannotation'
    __table_args__ = (
        Index('posttranslationannotation_uk', 'dbentity_id', 'psimod_id', 'site_residue', 'site_index', 'reference_id', 'modifier_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    site_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    site_residue = Column(String(1), nullable=False)
    psimod_id = Column(ForeignKey(u'NEX.psimod.psimod_id'), nullable=False, index=True)
    modifier_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity', primaryjoin='Posttranslationannotation.dbentity_id == Dbentity.dbentity_id')
    modifier = relationship(u'Dbentity', primaryjoin='Posttranslationannotation.modifier_id == Dbentity.dbentity_id')
    psimod = relationship(u'Psimod')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Proteindomain(Base):
    __tablename__ = 'proteindomain'
    __table_args__ = {u'schema': 'NEX'}

    proteindomain_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    interpro_id = Column(String(20))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class ProteindomainUrl(Base):
    __tablename__ = 'proteindomain_url'
    __table_args__ = (
        Index('proteindomain_url_uk', 'proteindomain_id', 'display_name', 'url_type', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    proteindomain_id = Column(ForeignKey(u'NEX.proteindomain.proteindomain_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    proteindomain = relationship(u'Proteindomain')
    source = relationship(u'Source')


class Proteindomainannotation(Base):
    __tablename__ = 'proteindomainannotation'
    __table_args__ = (
        Index('proteindomainannotation_uk', 'dbentity_id', 'proteindomain_id', 'start_index', 'end_index', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    proteindomain_id = Column(ForeignKey(u'NEX.proteindomain.proteindomain_id'), nullable=False, index=True)
    start_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    end_index = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    date_of_run = Column(DateTime, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    proteindomain = relationship(u'Proteindomain')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Proteinexptannotation(Base):
    __tablename__ = 'proteinexptannotation'
    __table_args__ = (
        Index('proteinexptannotation_uk', 'dbentity_id', 'reference_id', 'experiment_type', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    experiment_type = Column(String(40), nullable=False)
    data_value = Column(String(25), nullable=False)
    data_unit = Column(String(25), nullable=False)
    assay_id = Column(ForeignKey(u'NEX.obi.obi_id'), index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    assay = relationship(u'Obi')
    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class ProteinexptannotationCond(Base):
    __tablename__ = 'proteinexptannotation_cond'
    __table_args__ = (
        Index('proteinexptannotation_cond_uk', 'annotation_id', 'condition_type', 'condition_name', 'condition_value', unique=True),
        {u'schema': 'NEX'}
    )

    condition_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.proteinexptannotation.annotation_id'), nullable=False)
    condition_type = Column(String(40), nullable=False)
    condition_name = Column(String(500), nullable=False)
    condition_value = Column(String(25))
    condition_unit = Column(String(25))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    annotation = relationship(u'Proteinexptannotation')


class ProteinsequenceDetail(Base):
    __tablename__ = 'proteinsequence_detail'
    __table_args__ = {u'schema': 'NEX'}

    detail_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    annotation_id = Column(ForeignKey(u'NEX.proteinsequenceannotation.annotation_id'), nullable=False, unique=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    molecular_weight = Column(Numeric(scale=2), nullable=False)
    protein_length = Column(Numeric(asdecimal=False), nullable=False)
    n_term_seq = Column(String(10), nullable=False)
    c_term_seq = Column(String(10), nullable=False)
    pi = Column(Numeric(scale=2))
    cai = Column(Numeric(scale=2))
    codon_bias = Column(Numeric(scale=2))
    fop_score = Column(Numeric(scale=2))
    gravy_score = Column(Numeric(scale=2))
    aromaticity_score = Column(Numeric(scale=2))
    aliphatic_index = Column(Numeric(scale=2))
    instability_index = Column(Numeric(scale=2))
    ala = Column(Numeric(asdecimal=False), nullable=False)
    arg = Column(Numeric(asdecimal=False), nullable=False)
    asn = Column(Numeric(asdecimal=False), nullable=False)
    asp = Column(Numeric(asdecimal=False), nullable=False)
    cys = Column(Numeric(asdecimal=False), nullable=False)
    gln = Column(Numeric(asdecimal=False), nullable=False)
    glu = Column(Numeric(asdecimal=False), nullable=False)
    gly = Column(Numeric(asdecimal=False), nullable=False)
    his = Column(Numeric(asdecimal=False), nullable=False)
    ile = Column(Numeric(asdecimal=False), nullable=False)
    leu = Column(Numeric(asdecimal=False), nullable=False)
    lys = Column(Numeric(asdecimal=False), nullable=False)
    met = Column(Numeric(asdecimal=False), nullable=False)
    phe = Column(Numeric(asdecimal=False), nullable=False)
    pro = Column(Numeric(asdecimal=False), nullable=False)
    ser = Column(Numeric(asdecimal=False), nullable=False)
    thr = Column(Numeric(asdecimal=False), nullable=False)
    trp = Column(Numeric(asdecimal=False), nullable=False)
    tyr = Column(Numeric(asdecimal=False), nullable=False)
    val = Column(Numeric(asdecimal=False), nullable=False)
    hydrogen = Column(Numeric(asdecimal=False))
    sulfur = Column(Numeric(asdecimal=False))
    nitrogen = Column(Numeric(asdecimal=False))
    oxygen = Column(Numeric(asdecimal=False))
    carbon = Column(Numeric(asdecimal=False))
    no_cys_ext_coeff = Column(Numeric(asdecimal=False))
    all_cys_ext_coeff = Column(Numeric(asdecimal=False))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    annotation = relationship(u'Proteinsequenceannotation')


class Proteinsequenceannotation(Base):
    __tablename__ = 'proteinsequenceannotation'
    __table_args__ = (
        Index('proteinsequenceannotation_uk', 'dbentity_id', 'taxonomy_id', 'contig_id', unique=True),
        {u'schema': 'NEX'}
    )

    annotation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    contig_id = Column(ForeignKey(u'NEX.contig.contig_id'), nullable=False, index=True)
    seq_version = Column(DateTime)
    genomerelease_id = Column(ForeignKey(u'NEX.genomerelease.genomerelease_id'), index=True)
    file_header = Column(String(200), nullable=False)
    download_filename = Column(String(100), nullable=False)
    file_id = Column(Numeric(scale=0, asdecimal=False))
    residues = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    contig = relationship(u'Contig')
    dbentity = relationship(u'Dbentity')
    genomerelease = relationship(u'Genomerelease')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class Psimod(Base):
    __tablename__ = 'psimod'
    __table_args__ = {u'schema': 'NEX'}

    psimod_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    psimodid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class PsimodRelation(Base):
    __tablename__ = 'psimod_relation'
    __table_args__ = (
        Index('psimod_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.psimod.psimod_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.psimod.psimod_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Psimod', primaryjoin='PsimodRelation.child_id == Psimod.psimod_id')
    parent = relationship(u'Psimod', primaryjoin='PsimodRelation.parent_id == Psimod.psimod_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class PsimodUrl(Base):
    __tablename__ = 'psimod_url'
    __table_args__ = (
        Index('psimod_url_uk', 'psimod_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    psimod_id = Column(ForeignKey(u'NEX.psimod.psimod_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    psimod = relationship(u'Psimod')
    source = relationship(u'Source')


class ReferenceAlia(Base):
    __tablename__ = 'reference_alias'
    __table_args__ = (
        Index('reference_alias_uk', 'reference_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')


class ReferenceAuthor(Base):
    __tablename__ = 'reference_author'
    __table_args__ = (
        Index('reference_author_uk', 'reference_id', 'display_name', 'author_order', unique=True),
        {u'schema': 'NEX'}
    )

    reference_author_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    orcid = Column(String(20))
    author_order = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    author_type = Column(String(10), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')


class ReferenceCorrection(Base):
    __tablename__ = 'reference_correction'
    __table_args__ = (
        Index('reference_correction_uk', 'parent_id', 'child_id', 'correction_type', unique=True),
        {u'schema': 'NEX'}
    )

    reference_correction_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    parent_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    child_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    correction_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Referencedbentity', primaryjoin='ReferenceCorrection.child_id == Referencedbentity.dbentity_id')
    parent = relationship(u'Referencedbentity', primaryjoin='ReferenceCorrection.parent_id == Referencedbentity.dbentity_id')
    source = relationship(u'Source')


class ReferenceDeleted(Base):
    __tablename__ = 'reference_deleted'
    __table_args__ = {u'schema': 'NEX'}

    reference_deleted_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    pmid = Column(Numeric(scale=0, asdecimal=False), nullable=False, unique=True)
    sgdid = Column(String(20), unique=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    reason_deleted = Column(String(500))


class ReferenceDocument(Base):
    __tablename__ = 'reference_document'
    __table_args__ = (
        Index('reference_document_uk', 'reference_id', 'document_type', unique=True),
        {u'schema': 'NEX'}
    )

    reference_document_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    document_type = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')


class ReferenceFile(Base):
    __tablename__ = 'reference_file'
    __table_args__ = (
        Index('reference_file_uk', 'reference_id', 'file_id', unique=True),
        {u'schema': 'NEX'}
    )

    reference_file_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    file_id = Column(ForeignKey(u'NEX.filedbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    file = relationship(u'Filedbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')


class ReferenceReftype(Base):
    __tablename__ = 'reference_reftype'
    __table_args__ = (
        Index('reference_reftype_uk', 'reference_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    reference_reftype_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])
    source = relationship(u'Source')


class ReferenceUnlink(Base):
    __tablename__ = 'reference_unlink'
    __table_args__ = (
        Index('reference_unlink_uk', 'reference_id', 'dbentity_id', unique=True),
        {u'schema': 'NEX'}
    )

    reference_unlink_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    dbentity = relationship(u'Dbentity')
    reference = relationship(u'Referencedbentity', foreign_keys=[reference_id])


class ReferenceUrl(Base):
    __tablename__ = 'reference_url'
    __table_args__ = (
        Index('reference_url_uk', 'reference_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class Referencedbentity(Dbentity):
    __tablename__ = 'referencedbentity'
    __table_args__ = {u'schema': 'NEX'}

    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), primary_key=True)
    method_obtained = Column(String(40), nullable=False)
    publication_status = Column(String(40), nullable=False)
    fulltext_status = Column(String(40), nullable=False)
    citation = Column(String(500), nullable=False, unique=True)
    year = Column(Numeric(4, 0, asdecimal=False), nullable=False)
    pmid = Column(Numeric(scale=0, asdecimal=False), unique=True)
    pmcid = Column(String(20), unique=True)
    date_published = Column(String(40))
    date_revised = Column(DateTime)
    issue = Column(String(100))
    page = Column(String(40))
    volume = Column(String(40))
    title = Column(String(400))
    doi = Column(String(100))
    journal_id = Column(ForeignKey(u'NEX.journal.journal_id'), index=True)
    book_id = Column(ForeignKey(u'NEX.book.book_id'), index=True)

    book = relationship(u'Book')
    journal = relationship(u'Journal')

    __mapper_args__ = {
        'polymorphic_identity':'REFERENCE',
    }


class Referencetriage(Base):
    __tablename__ = 'referencetriage'
    __table_args__ = {u'schema': 'NEX'}

    curation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    pmid = Column(Numeric(scale=0, asdecimal=False), nullable=False, unique=True)
    citation = Column(String(500), nullable=False)
    fulltext_url = Column(String(500))
    abstract = Column(Text)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())


class Reporter(Base):
    __tablename__ = 'reporter'
    __table_args__ = {u'schema': 'NEX'}

    reporter_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class Reservedname(Base):
    __tablename__ = 'reservedname'
    __table_args__ = {u'schema': 'NEX'}

    reservedname_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    locus_id = Column(ForeignKey(u'NEX.locusdbentity.dbentity_id'), index=True)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), index=True)
    colleague_id = Column(ForeignKey(u'NEX.colleague.colleague_id'), nullable=False, index=True)
    reservation_date = Column(DateTime, nullable=False, server_default=FetchedValue())
    expiration_date = Column(DateTime, nullable=False, server_default=FetchedValue())
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    locus = relationship(u'Locusdbentity')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class Ro(Base):
    __tablename__ = 'ro'
    __table_args__ = {u'schema': 'NEX'}

    ro_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    roid = Column(String(20), nullable=False, unique=True)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class RoRelation(Base):
    __tablename__ = 'ro_relation'
    __table_args__ = (
        Index('ro_relation_uk', 'parent_id', 'child_id', 'relation_type', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    relation_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Ro', primaryjoin='RoRelation.child_id == Ro.ro_id')
    parent = relationship(u'Ro', primaryjoin='RoRelation.parent_id == Ro.ro_id')
    source = relationship(u'Source')


class RoUrl(Base):
    __tablename__ = 'ro_url'
    __table_args__ = (
        Index('ro_url_uk', 'ro_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    ro = relationship(u'Ro')
    source = relationship(u'Source')


class Sgdid(Base):
    __tablename__ = 'sgdid'
    __table_args__ = {u'schema': 'NEX'}

    sgdid_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    subclass = Column(String(40), nullable=False)
    sgdid_status = Column(String(40), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    format_name = Column(String(100), nullable=False, unique=True)

    source = relationship(u'Source')


class So(Base):
    __tablename__ = 'so'
    __table_args__ = {u'schema': 'NEX'}

    so_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    soid = Column(String(20), nullable=False, unique=True)
    description = Column(String(2000))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class SoAlia(Base):
    __tablename__ = 'so_alias'
    __table_args__ = (
        Index('so_alias_uk', 'so_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    so = relationship(u'So')
    source = relationship(u'Source')


class SoRelation(Base):
    __tablename__ = 'so_relation'
    __table_args__ = (
        Index('so_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'So', primaryjoin='SoRelation.child_id == So.so_id')
    parent = relationship(u'So', primaryjoin='SoRelation.parent_id == So.so_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class SoUrl(Base):
    __tablename__ = 'so_url'
    __table_args__ = (
        Index('so_url_uk', 'so_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    so_id = Column(ForeignKey(u'NEX.so.so_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    so = relationship(u'So')
    source = relationship(u'Source')


class Source(Base):
    __tablename__ = 'source'
    __table_args__ = {u'schema': 'NEX'}

    source_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())


class StrainSummary(Base):
    __tablename__ = 'strain_summary'
    __table_args__ = (
        Index('strain_summary_uk', 'strain_id', 'summary_type', unique=True),
        {u'schema': 'NEX'}
    )

    summary_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    strain_id = Column(ForeignKey(u'NEX.straindbentity.dbentity_id'), nullable=False)
    summary_type = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    html = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')
    strain = relationship(u'Straindbentity')


class StrainSummaryReference(Base):
    __tablename__ = 'strain_summary_reference'
    __table_args__ = (
        Index('strain_summary_reference_uk', 'summary_id', 'reference_id', unique=True),
        {u'schema': 'NEX'}
    )

    summary_reference_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    summary_id = Column(ForeignKey(u'NEX.strain_summary.summary_id'), nullable=False)
    reference_id = Column(ForeignKey(u'NEX.referencedbentity.dbentity_id'), nullable=False, index=True)
    reference_order = Column(Numeric(scale=0, asdecimal=False))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')
    summary = relationship(u'StrainSummary')


class StrainUrl(Base):
    __tablename__ = 'strain_url'
    __table_args__ = (
        Index('strain_url_uk', 'strain_id', 'display_name', 'url_type', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    strain_id = Column(ForeignKey(u'NEX.straindbentity.dbentity_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')
    strain = relationship(u'Straindbentity')


class Straindbentity(Dbentity):
    __tablename__ = 'straindbentity'
    __table_args__ = {u'schema': 'NEX'}

    dbentity_id = Column(ForeignKey(u'NEX.dbentity.dbentity_id'), primary_key=True)
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    strain_type = Column(String(40), nullable=False)
    genotype = Column(String(500))
    genbank_id = Column(String(40))
    assembly_size = Column(Numeric(scale=0, asdecimal=False))
    fold_coverage = Column(Numeric(scale=0, asdecimal=False))
    scaffold_number = Column(Numeric(scale=0, asdecimal=False))
    longest_scaffold = Column(Numeric(scale=0, asdecimal=False))
    scaffold_nfifty = Column(Numeric(scale=0, asdecimal=False))
    feature_count = Column(Numeric(scale=0, asdecimal=False))

    taxonomy = relationship(u'Taxonomy')


class Taxonomy(Base):
    __tablename__ = 'taxonomy'
    __table_args__ = {u'schema': 'NEX'}

    taxonomy_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    taxid = Column(String(20), nullable=False, unique=True)
    common_name = Column(String(100))
    rank = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')


class TaxonomyAlia(Base):
    __tablename__ = 'taxonomy_alias'
    __table_args__ = (
        Index('taxonomy_alias_uk', 'taxonomy_id', 'display_name', 'alias_type', unique=True),
        {u'schema': 'NEX'}
    )

    alias_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False)
    alias_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class TaxonomyRelation(Base):
    __tablename__ = 'taxonomy_relation'
    __table_args__ = (
        Index('taxonomy_relation_uk', 'parent_id', 'child_id', 'ro_id', unique=True),
        {u'schema': 'NEX'}
    )

    relation_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    parent_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False)
    child_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False, index=True)
    ro_id = Column(ForeignKey(u'NEX.ro.ro_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    child = relationship(u'Taxonomy', primaryjoin='TaxonomyRelation.child_id == Taxonomy.taxonomy_id')
    parent = relationship(u'Taxonomy', primaryjoin='TaxonomyRelation.parent_id == Taxonomy.taxonomy_id')
    ro = relationship(u'Ro')
    source = relationship(u'Source')


class TaxonomyUrl(Base):
    __tablename__ = 'taxonomy_url'
    __table_args__ = (
        Index('taxonomy_url_uk', 'taxonomy_id', 'display_name', 'obj_url', unique=True),
        {u'schema': 'NEX'}
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'NEX.source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    taxonomy_id = Column(ForeignKey(u'NEX.taxonomy.taxonomy_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    source = relationship(u'Source')
    taxonomy = relationship(u'Taxonomy')


class UpdateLog(Base):
    __tablename__ = 'update_log'
    __table_args__ = {u'schema': 'NEX'}

    update_log_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    tab_name = Column(String(30), nullable=False)
    col_name = Column(String(30), nullable=False)
    primary_key = Column(Numeric(scale=0, asdecimal=False), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
    old_value = Column(Text)
    new_value = Column(Text)

