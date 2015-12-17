import datetime
import factory
from src.models import Source, Colleague, DBSession


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
    created_by = "EDITH"

    
class ColleagueFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Colleague
        sqlalchemy_session = DBSession

    colleague_id = 10
    
