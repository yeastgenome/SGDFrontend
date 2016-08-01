import unittest
from pyramid import testing

class SGDViewTests(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.config.include('pyramid_jinja2')

    def tearDown(self):
        testing.tearDown()
        
    def test_blast(self):
        from src.sgd.frontend.views import blast_sgd
        req = testing.DummyRequest()
        res = blast_sgd(req)
        self.assertEqual(res.status_code, 200)

    def test_fungal_blast(self):
        from src.sgd.frontend.views import blast_fungal
        req = testing.DummyRequest()
        res = blast_fungal(req)
        self.assertEqual(res.status_code, 200)

    def test_interaction_search(self):
        from src.sgd.frontend.views import interaction_search
        req = testing.DummyRequest()
        res = interaction_search(req)
        self.assertEqual(res.status_code, 200)

    def test_snapshot(self):
        from src.sgd.frontend.views import snapshot
        req = testing.DummyRequest()
        res = snapshot(req)
        self.assertEqual(res.status_code, 200)

    def test_suggestion(self):
        from src.sgd.frontend.views import suggestion
        req = testing.DummyRequest()
        res = suggestion(req)
        self.assertEqual(res.status_code, 200)

    def test_variant_viewer(self):
        from src.sgd.frontend.views import variant_viewer
        req = testing.DummyRequest()
        res = variant_viewer(req)
        self.assertEqual(res.status_code, 200)

    # TODO enable when search backend in production
    # def test_search(self):
    #     from src.sgd.frontend.views import search
    #     # test that gene names get a redirect
    #     req = testing.DummyRequest(params={ 'q': 'rad54', 'is_quick': 'true' })
    #     req.query_string = 'q=rad54&is_quick=true'
    #     res = search(req)
    #     self.assertEqual(res.status_code, 302)
    #     # no query, aka "explore"
    #     req = testing.DummyRequest()
    #     res = search(req)
    #     self.assertEqual(res.status_code, 200)
