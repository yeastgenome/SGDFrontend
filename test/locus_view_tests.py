import unittest

from pyramid import testing

class SGDViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.config.include('pyramid_jinja2')

    def tearDown(self):
        testing.tearDown()

    def test_locus_summary_page(self):
        from src.sgd.frontend.views import locus
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': 'rad54' }
        res = locus(req)
        self.assertEqual(res.status_code, 200)
        has_text = res.text.find('DNA-dependent ATPase that stimulates strand exchange') > 0
        self.assertTrue(has_text)
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': 'fakegene' }
        res = locus(req)
        self.assertEqual(res.status_code, 404)
