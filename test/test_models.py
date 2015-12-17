import unittest
from sqlalchemy import create_engine, Column, String
from src.models import DBSession, Base, Source #Base, Colleague, Source
from fixtures import SourceFactory


class ModelsTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        DBSession.configure(bind=self.engine)

        Base.metadata.create_all(self.engine)

    def tearDown(self):
        DBSession.remove()

    def test_source_fields(self):
        instances = DBSession.query(Source).all()
        self.assertEqual(0, len(instances))
        
        source = SourceFactory()
        instances = DBSession.query(Source).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(source, instances[0])
