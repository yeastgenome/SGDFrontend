import datetime
import factory
from src.models import DBSession, Source, Colleague, ColleagueUrl, ColleagueAssociation, ColleagueKeyword, Keyword, Dbuser


class SourceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Source
        sqlalchemy_session = DBSession

    source_id = 261
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
    format_name = "Jimmy_Page_LZ"
    display_name = "Jimmy Page"
    obj_url = "/colleague/Jimmy_Page_LZ"
    source_id = 261
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
    is_pi = False
    is_contact = False
    display_email = True
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


class ColleagueUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueUrl
        sqlalchemy_session = DBSession

    url_id = 1
    display_name = "Lab"
    obj_url = "http://example.org"
    source_id = 261
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
    source_id = 261
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
    format_name = "protein_trafficking,_localization_and_degradation"
    display_name = "protein trafficking, localization and degradation"
    obj_url = "/keyword/protein_trafficking,_localization_and_degradation"
    source_id = 1
    bud_id = 1
    description = "my description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
