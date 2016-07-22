import unittest

from pyramid import testing

class SGDViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_locus_summary_page(self):
        from src.sgd.frontend.views import locus
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': 'rad54' }
        res = locus(req)
        self.assertEqual(res.status_code, 500)
