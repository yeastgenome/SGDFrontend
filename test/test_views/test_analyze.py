# from pyramid import testing
#
# import unittest
# import mock
# import json
# import test.fixtures as factory
# from test.mock_helpers import MockQuery
# from src.views import analyze
#
#
# class AnalyzeTest(unittest.TestCase):
#     def setUp(self):
#         self.config = testing.setUp()
#
#     def tearDown(self):
#         testing.tearDown()
#
#     @mock.patch('src.models.DBSession.query')
#     def test_should_return_valid_bioentity_list(self, mock_search):
#
#         locus = factory.LocusdbentityFactory()
#         locus2 = factory.LocusdbentityFactory()
#         mock_search.return_value = MockQuery([locus, locus2])
#
#         request = testing.DummyRequest(post={'bioent_ids': [locus.dbentity_id, locus2.dbentity_id]}, headers={'content_type': 'application/json'})
#         request.context = testing.DummyResource()
#         #request.json_body = {'bioent_ids': [locus.dbentity_id, locus2.dbentity_id]}
#         response = analyze(request)
#
#         self.assertEqual(response, [{'id': locus.dbentity_id, 'display_name': locus.display_name, 'link': locus.obj_url, 'description': locus.description, 'format_name': locus.format_name},
#                                     {'id': locus2.dbentity_id, 'display_name': locus2.display_name, 'link': locus2.obj_url, 'description': locus2.description, 'format_name': locus2.format_name}])
#
#
#     @mock.patch('src.models.DBSession.query')
#     def test_should_return_non_existent_bioentity_list(self, mock_search):
#         mock_search.return_value = MockQuery(None)
#
#         request = testing.DummyRequest()
#         request.context = testing.DummyResource()
#         request.matchdict['bioent_ids'] = 'nonexistent_id'
#         response = analyze(request)
#         self.assertEqual(response.status_code, 404)