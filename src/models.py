from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String, Text, text, FetchedValue
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker, relationship
from zope.sqlalchemy import ZopeTransactionExtension


DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


class Colleague(Base):
    __tablename__ = 'colleague'

    colleague_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'source.source_id'), nullable=False, index=True)
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

    source = relationship(u'Source')


class ColleagueAssociation(Base):
    __tablename__ = 'colleague_association'
    __table_args__ = (
        Index('colleague_association_uk', 'colleague_id', 'associate_id', 'association_type', unique=True),
    )

    colleague_association_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    source_id = Column(ForeignKey(u'source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    colleague_id = Column(ForeignKey(u'colleague.colleague_id'), nullable=False)
    associate_id = Column(ForeignKey(u'colleague.colleague_id'), nullable=False, index=True)
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
    )

    colleague_keyword_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    colleague_id = Column(ForeignKey(u'colleague.colleague_id'), nullable=False, index=True)
    keyword_id = Column(ForeignKey(u'keyword.keyword_id'), nullable=False)
    source_id = Column(ForeignKey(u'source.source_id'), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    keyword = relationship(u'Keyword')
    source = relationship(u'Source')


class ColleagueLocus(Base):
    __tablename__ = 'colleague_locus'
    __table_args__ = (
        Index('colleague_locus_uk', 'colleague_id', 'locus_id', unique=True),
    )

    colleague_locus_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    colleague_id = Column(ForeignKey(u'colleague.colleague_id'), nullable=False)
    locus_id = Column(ForeignKey(u'locusdbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    locus = relationship(u'Locusdbentity')
    source = relationship(u'Source')


class ColleagueReference(Base):
    __tablename__ = 'colleague_reference'
    __table_args__ = (
        Index('colleague_reference_uk', 'colleague_id', 'reference_id', unique=True),
    )

    colleague_reference_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    colleague_id = Column(ForeignKey(u'colleague.colleague_id'), nullable=False)
    reference_id = Column(ForeignKey(u'referencedbentity.dbentity_id'), nullable=False, index=True)
    source_id = Column(ForeignKey(u'source.source_id'), nullable=False, index=True)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    reference = relationship(u'Referencedbentity')
    source = relationship(u'Source')


class ColleagueUrl(Base):
    __tablename__ = 'colleague_url'
    __table_args__ = (
        Index('colleague_url_uk', 'colleague_id', 'display_name', 'url_type', unique=True),
    )

    url_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500), nullable=False)
    source_id = Column(ForeignKey(u'source.source_id'), nullable=False, index=True)
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    colleague_id = Column(ForeignKey(u'colleague.colleague_id'), nullable=False)
    url_type = Column(String(40), nullable=False)
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())

    colleague = relationship(u'Colleague')
    source = relationship(u'Source')


class Source(Base):
    __tablename__ = 'source'

    source_id = Column(Numeric(scale=0, asdecimal=False), primary_key=True)
    format_name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(500), nullable=False)
    obj_url = Column(String(500))
    bud_id = Column(Numeric(scale=0, asdecimal=False))
    description = Column(String(500))
    date_created = Column(DateTime, nullable=False, server_default=FetchedValue())
    created_by = Column(String(12), nullable=False, server_default=FetchedValue())
