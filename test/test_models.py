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

    def test_colleague_model_search_results_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        self.assertEqual(colleague.to_search_results_dict(), {
            'first_name': colleague.first_name,
            'last_name': colleague.last_name,
            'organization': colleague.institution,
            'work_phone': colleague.work_phone,
            'fax': colleague.fax
        })

    def test_colleague_model_search_result_dict_with_urls(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        colleague_url_1 = factory.ColleagueUrlFactory(url_id=1, colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(url_id=2, colleague_id=colleague.colleague_id, url_type="Lab")
        self.assertEqual(colleague.to_search_results_dict(), {
            'first_name': colleague.first_name,
            'last_name': colleague.last_name,
            'organization': colleague.institution,
            'work_phone': colleague.work_phone,
            'fax': colleague.fax,
            'lab_url': colleague_url_1.obj_url,
            'research_summary_url': colleague_url_2.obj_url
        })

    def test_colleague_model_info_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        colleague_url_1 = factory.ColleagueUrlFactory(url_id=1, colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(url_id=2, colleague_id=colleague.colleague_id, url_type="Lab")
        self.assertEqual(colleague.to_info_dict(), {
            'email': colleague.email,
            'position': colleague.job_title,
            'profession': colleague.profession,
            'organization': colleague.institution,
            'address': [colleague.address1, colleague.address2, colleague.address3],
            'work_phone': colleague.work_phone,
            'fax': colleague.fax,
            'webpages': {
                'lab_url': 'http://example.org',
                'research_summary_url': 'http://example.org'
            },
            'members_of_lab': [],
            'associates': [],
            'keywords': [],
            'research_topics': [],
            'last_update': str(colleague.date_last_modified)
        })

    def test_colleague_model_should_include_urls_in_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        colleague_url_1 = factory.ColleagueUrlFactory(url_id=1, colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(url_id=2, colleague_id=colleague.colleague_id, url_type="Lab")

        colleague_dict = {}
        colleague._include_urls_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'lab_url': 'http://example.org', 'research_summary_url': 'http://example.org'})

    def test_dbuser_model(self):
        instances = DBSession.query(Dbuser).all()
        self.assertEqual(0, len(instances))

        dbuser = factory.DbuserFactory()
        instances = DBSession.query(Dbuser).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(dbuser, instances[0])

    def test_colleague_url_model(self):
        instances = DBSession.query(ColleagueUrl).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()

        colleague_url_1 = factory.ColleagueUrlFactory(url_id=1, colleague_id=colleague.colleague_id)
        instances = DBSession.query(ColleagueUrl).all()

        self.assertEqual(1, len(instances))

        self.assertEqual(colleague_url_1, instances[0])
        self.assertEqual(colleague_url_1.source, source)
        self.assertEqual(colleague_url_1.colleague, colleague)

        colleague_url_2 = factory.ColleagueUrlFactory(url_id=2, colleague_id=colleague.colleague_id, url_type="Lab")
        instances = DBSession.query(ColleagueUrl).all()

        self.assertEqual(2, len(instances))
        self.assertEqual(colleague.urls, [colleague_url_2, colleague_url_1])
