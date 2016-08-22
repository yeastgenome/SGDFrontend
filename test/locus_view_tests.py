import unittest
from pyramid import testing

EXAMPLE_IDENTIFIER = 'rad54'

class SGDViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.config.include('pyramid_jinja2')

    def tearDown(self):
        testing.tearDown()

    def test_locus_summary_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import locus
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = locus(req)
        self.assertEqual(res.status_code, 200)
        has_text = res.text.find('DNA-dependent ATPase that stimulates strand exchange') > 0
        self.assertTrue(has_text)
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': 'fakegene' }
        res = locus(req)
        self.assertEqual(res.status_code, 404)

    def test_sequence_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import sequence_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = sequence_details(req)
        self.assertEqual(res.status_code, 200)

    def test_protein_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import protein_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = protein_details(req)
        self.assertEqual(res.status_code, 200)

    def test_go_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import go_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = go_details(req)
        self.assertEqual(res.status_code, 200)

    def test_phenotype_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import phenotype_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = phenotype_details(req)
        self.assertEqual(res.status_code, 200)

    def test_interactions_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import interaction_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = interaction_details(req)
        self.assertEqual(res.status_code, 200)

    def test_regulation_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import regulation_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = regulation_details(req)
        self.assertEqual(res.status_code, 200)

    def test_expression_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import expression_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = expression_details(req)
        self.assertEqual(res.status_code, 200)

    def test_literature_page(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import literature_details
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = literature_details(req)
        self.assertEqual(res.status_code, 200)

    def test_curator_sequence(self):
        from src.sgd.frontend.yeastgenome.views.locus_views import curator_sequence
        req = testing.DummyRequest()
        req.matchdict = { 'identifier': EXAMPLE_IDENTIFIER }
        res = curator_sequence(req)
        self.assertEqual(res.status_code, 200)
