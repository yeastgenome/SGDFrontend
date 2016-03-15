import datetime
import factory
from src.models import DBSession, Source, Colleague, ColleagueUrl, ColleagueAssociation, ColleagueKeyword, Keyword, Dbuser, Edam


class SourceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Source
        sqlalchemy_session = DBSession

    source_id = 1
    format_name = "Addgene"
    display_name = "Addgene"
    obj_url = None
    bud_id = 1035
    description = "Plasmid Repository"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

    
class ColleagueFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Colleague
        sqlalchemy_session = DBSession

    colleague_id = 113698
    format_name = factory.Sequence(lambda n: 'Jimmy_{0}'.format(n))
    display_name = "Jimmy Page"
    obj_url = "/colleague/Jimmy_Page_LZ"
    source_id = 1
    bud_id = 549
    orcid = None
    last_name = "Page"
    first_name = "Jimmy"
    suffix = None
    other_last_name = None
    profession = "Yeast Geneticist/Molecular biologist"
    job_title = "Graduate Student"
    institution = "Stanford Universty"
    address1 = "Genome Research Center"
    address2 = None
    address3 = None
    city = "Palo Alto"
    state = "CA"
    country = "USA"
    postal_code = "94015"
    work_phone = "444-444-4444"
    other_phone = None
    fax = "333-333-3333"
    email = "jimmy.page@example.org"
    research_interest = "mRNA decay, translation, mRNA decay"
    is_pi = 0
    is_contact = 0
    display_email = 1
    date_last_modified = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class DbuserFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Dbuser
        sqlalchemy_session = DBSession

    dbuser_id = 1
    username = "mr_curator"
    bud_id = None
    first_name = "Curator"
    last_name = "X"
    status = "Current"
    email = "curator@example.org"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    is_curator = 0


class ColleagueUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueUrl
        sqlalchemy_session = DBSession

    url_id = factory.Sequence(lambda n: n)
    display_name = "Lab"
    obj_url = factory.Sequence(lambda n: 'http://example.org/{0}'.format(n))
    source_id = 1
    bud_id = 1
    colleague_id = 113698
    url_type = "Research summary"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ColleagueAssociationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueAssociation
        sqlalchemy_session = DBSession

    colleague_association_id = factory.Sequence(lambda n: n)
    source_id = 1
    bud_id = 1
    colleague_id = 113698
    associate_id = 113699
    association_type = "Lab member"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ColleagueKeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueKeyword
        sqlalchemy_session = DBSession

    colleague_keyword_id = factory.Sequence(lambda n: n)
    colleague_id = 113698
    keyword_id = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class KeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Keyword
        sqlalchemy_session = DBSession

    keyword_id = 1
    format_name = factory.Sequence(lambda n: 'protein_{0}'.format(n))
    display_name = factory.Sequence(lambda n: 'protein traffcking {0}'.format(n))
    obj_url = "/keyword/protein_trafficking,_localization_and_degradation"
    source_id = 1
    bud_id = 1
    description = "my description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class EdamFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Edam
        sqlalchemy_session = DBSession

    edam_id = factory.Sequence(lambda n: n)
    format_name = "format_name"
    display_name = "display_name"
    obj_url = "/url"
    source_id = 1
    bud_id = None
    edamid = factory.Sequence(lambda n: 'protein_{0}'.format(n))
    edam_namespace = "namespace"
    description = "This is my description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
