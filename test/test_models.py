import unittest
from sqlalchemy import create_engine, Column, String
from src.models import DBSession, Base, Source, Colleague, ColleagueUrl, Dbuser
import fixtures as factory


class ModelsTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        DBSession.remove()
        DBSession.configure(bind=self.engine)

        Base.metadata.create_all(self.engine)

    def tearDown(self):
        DBSession.remove()

    def test_source_model(self):
        instances = DBSession.query(Source).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        instances = DBSession.query(Source).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(source, instances[0])

    def test_colleague_model(self):
        instances = DBSession.query(Colleague).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        self.assertEqual(colleague.source, source)

    def test_colleague_model_search_result_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        self.assertEqual(colleague.to_search_result_dict(), {
            'first_name': 'Jimmy',
            'last_name': 'Page',
            'organization': 'Stanford Universty',
            'work_phone': '444-444-4444',
            'fax': '333-333-3333',
            'lab_url': '',
            'research_summary_url': ''
        })

    def test_dbuser_model(self):
        instances = DBSession.query(Dbuser).all()
        self.assertEqual(0, len(instances))

        dbuser = factory.DbuserFactory()
        instances = DBSession.query(Dbuser).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(dbuser, instances[0])

    def test_colleagueurl_model(self):
        instances = DBSession.query(ColleagueUrl).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        colleague_url = factory.ColleagueUrlFactory()
        instances = DBSession.query(ColleagueUrl).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(colleague_url, instances[0])
        self.assertEqual(colleague_url.source, source)
        self.assertEqual(colleague_url.colleague, colleague)
