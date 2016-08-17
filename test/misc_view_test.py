import unittest
from pyramid import testing

class SGDViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.config.include('pyramid_jinja2')

    def tearDown(self):
        testing.tearDown()
        
    def test_homepage(self):
        from src.sgd.frontend.yeastgenome.views.misc_views import home
        req = testing.DummyRequest()
        res = home(req)
        self.assertEqual(res.status_code, 200)

    def test_blast(self):
        from src.sgd.frontend.yeastgenome.views.misc_views import blast_sgd
        req = testing.DummyRequest()
        res = blast_sgd(req)
        self.assertEqual(res.status_code, 200)

    def test_fungal_blast(self):
        from src.sgd.frontend.yeastgenome.views.misc_views import blast_fungal
        req = testing.DummyRequest()
        res = blast_fungal(req)
        self.assertEqual(res.status_code, 200)

    def test_interaction_search(self):
        from src.sgd.frontend.yeastgenome.views.misc_views import interaction_search
        req = testing.DummyRequest()
        res = interaction_search(req)
        self.assertEqual(res.status_code, 200)

    def test_snapshot(self):
        from src.sgd.frontend.yeastgenome.views.misc_views import snapshot
        req = testing.DummyRequest()
        res = snapshot(req)
        self.assertEqual(res.status_code, 200)

    # def test_suggestion(self):
    #     from src.sgd.frontend.yeastgenome.views.misc_views import suggestion
    #     req = testing.DummyRequest()
    #     res = suggestion(req)
    #     self.assertEqual(res.status_code, 200)

    def test_variant_viewer(self):
        from src.sgd.frontend.yeastgenome.views.misc_views import variant_viewer
        req = testing.DummyRequest()
        res = variant_viewer(req)
        self.assertEqual(res.status_code, 200)
