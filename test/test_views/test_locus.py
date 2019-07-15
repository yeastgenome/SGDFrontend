from pyramid import testing

import unittest
import mock
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import go_side_effect, phenotype_side_effect, locus_side_effect, reference_side_effect,\
    locus_reference_side_effect, locus_expression_side_effect, sequence_side_effect, protein_side_effect, disease_side_effect
from src.views import locus, locus_go_details, locus_phenotype_details, locus_phenotype_graph, locus_literature_details, locus_interaction_details, \
    locus_sequence_details, locus_neighbor_sequence_details, locus_posttranslational_details, locus_ecnumber_details, \
    locus_protein_experiment_details, locus_protein_domain_details, locus_protein_domain_graph, locus_tabs, \
    locus_go_graph, locus_literature_graph, locus_protein_abundance_details, locus_regulation_details, locus_regulation_graph, \
    locus_regulation_target_enrichment, locus_binding_site_details, locus_disease_details

### NEED TO ADD TEST FOR locus_disease_graph, locus_interaction_graph, locus_expression_graph

class LocusTest(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        loc = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus(request)
        self.maxDiff = None
        self.assertEqual(response, loc.to_dict())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_go_details(self, mock_search, mock_redis):
        mock_search.side_effect = go_side_effect
        locus = factory.LocusdbentityFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_go_details(request)
        self.assertEqual(response, locus.go_to_dict())


    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_disease_details(self, mock_search, mock_redis):
        mock_search.side_effect = disease_side_effect
        locus = factory.LocusdbentityFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_disease_details(request)
        self.assertEqual(response, locus.disease_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_interaction_details(self, mock_search, mock_redis):
        mock_search.side_effect = reference_side_effect

        locus = factory.LocusdbentityFactory()
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_interaction_details(request)
        self.assertEqual(response, locus.interactions_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_phenotype_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory(format_name='format_1')
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_phenotype_details(request)
        self.assertEqual(response, locus.phenotype_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_literature_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_reference_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_literature_details(request)
        self.assertEqual(response, locus.literature_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.execute')
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_sequence_details(self, mock_search, mock_execute, mock_redis):
        mock_search.side_effect = sequence_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_sequence_details(request)
        self.assertEqual(response, locus.sequence_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_protein_experiment_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_protein_experiment_details(request)
        self.assertEqual(response, locus.protein_experiment_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_protein_domain_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_protein_domain_details(request)
        self.assertEqual(response, locus.protein_domain_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_protein_domain_graph(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_protein_domain_graph(request)
        self.assertEqual(response, locus.protein_domain_graph())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_go_graph(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_go_graph(request)
        self.assertEqual(response, locus.go_graph())

    @mock.patch('src.views.extract_id_request', return_value="S000003878")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_literature_graph(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_literature_graph(request)
        self.assertEqual(response, locus.literature_graph())

    @mock.patch('src.views.extract_id_request', return_value="S000002870")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_protein_abundance_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_protein_abundance_details(request)
        self.assertEqual(response, locus.protein_abundance_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_regulation_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_regulation_details(request)
        self.assertEqual(response, locus.regulation_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_regulation_graph(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_regulation_graph(request)
        self.assertEqual(response, locus.regulation_graph())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_regulation_target_enrichment(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_regulation_target_enrichment(request)
        self.assertEqual(response, locus.regulation_target_enrichment())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_binding_site_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_binding_site_details(request)
        self.assertEqual(response, locus.binding_site_details())

    @mock.patch('src.views.extract_id_request', return_value="S000003878")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_disease_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_disease_details(request)
        self.assertEqual(response, locus.disease_to_dict())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_posttranslational_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_posttranslational_details(request)
        self.assertEqual(response, locus.posttranslational_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_ecnumber_details(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_ecnumber_details(request)
        self.assertEqual(response, locus.ecnumber_details())

    @mock.patch('src.views.extract_id_request', return_value="S000114259")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_locus_tabs(self, mock_search, mock_redis):
        mock_search.side_effect = locus_side_effect

        locus = factory.LocusdbentityFactory()

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_tabs(request)
        self.assertEqual(response, locus.tabs())

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_go_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_go_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_interaction_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_interaction_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_phenotype_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_phenotype_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_literature_details(self, mock_search, mock_redis):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        id = mock_redis.extract_id_request(request, 'locus', param_name='id')
        response = locus_literature_details(request)
        self.assertEqual(response.status_code, 404)

    @mock.patch('src.views.extract_id_request', return_value="nonexistent_id")
    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_locus_sequence_details(self, mock_search, mock_redis):
         mock_search.return_value = MockQuery(None)

         request = testing.DummyRequest()
         request.context = testing.DummyResource()
         id = mock_redis.extract_id_request(request, 'locus', param_name='id')
         response = locus_sequence_details(request)
         self.assertEqual(response.status_code, 404)
