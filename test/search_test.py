# import unittest
# from pyramid import testing

# def get_response_with_query(query):
#     from src.sgd.frontend.yeastgenome.views.misc_views import search
#     req = testing.DummyRequest(params={ 'q': query, 'is_quick': 'true' })
#     req.query_string = 'q=' + query + '&is_quick=true'
#     res = search(req)
#     return res

# class SGDViewTests(unittest.TestCase):
#     def setUp(self):
#         self.config = testing.setUp()
#         self.config.include('pyramid_jinja2')

#     def test_explore(self):
#         from src.sgd.frontend.yeastgenome.views.misc_views import search
#         req = testing.DummyRequest()
#         res = search(req)
#         self.assertEqual(res.status_code, 200)

#     def test_show_all_results(self):
#         from src.sgd.frontend.yeastgenome.views.misc_views import search
#         req = testing.DummyRequest(params={ 'q': 'rad54', 'is_quick': 'false' })
#         req.query_string = 'q=rad54&is_quick=false'
#         res = search(req)
#         self.assertEqual(res.status_code, 200)
    
#     def test_gene_name_search(self):
#         res = get_response_with_query('act1')
#         self.assertEqual(res.status_code, 302)
#         res = get_response_with_query('rad54')
#         self.assertEqual(res.status_code, 302)

#     def test_protein_name_search(self):
#         res = get_response_with_query('act1p')
#         self.assertEqual(res.status_code, 302)

#     def test_alias_redirect(self):
#         res = get_response_with_query('end7')
#         self.assertEqual(res.status_code, 302)

#     def test_multi_alias_not_redirect(self):
#         res = get_response_with_query('acr1')
#         self.assertEqual(res.status_code, 200)
