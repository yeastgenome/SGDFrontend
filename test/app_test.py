import unittest

from pyramid import testing

class SGDViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_app(self):
		from src.sgd.frontend import prepare_frontend
		config = prepare_frontend('yeastgenome')
		config.make_wsgi_app()
