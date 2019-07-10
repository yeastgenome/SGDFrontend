from pyramid import testing
import unittest
import mock
from src.curation_views import get_locus_curate, reference_triage_id, reference_triage_index, colleague_with_subscription, get_strains, ptm_by_gene, get_strains, get_psimod, colleague_triage_show
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import locus_side_effect, reference_side_effect, side_effect, strain_side_effect

class CurationViewsTest(unittest.TestCase):
  
  def setUp(self):
        self.config = testing.setUp()

  def tearDown(self):
    testing.tearDown()

  @mock.patch('src.curation_views.extract_id_request', return_value="S000001855")
  @mock.patch('src.models.DBSession.query')
  def test_get_locus_curate_should_return_valid_locus(self,mock_search,mock_redis):
    mock_search.side_effect = locus_side_effect
    locus_object = factory.LocusdbentityFactory()
    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    id = mock_redis.extract_id_request(request, 'locus', param_name='sgdid')
    response = get_locus_curate(request)
    self.assertEqual(response, locus_object.to_curate_dict())
    

  @mock.patch('src.models.DBSession.query')
  def test_reference_triage_id_should_return_valid_reference_triage(self,mock_search):
    mock_search.side_effect = reference_side_effect
    reference_triage = factory.ReferencetriageFactory()
    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    request.matchdict['id'] = "184870"
    response = reference_triage_id(request)
    self.assertEqual(response,reference_triage.to_dict())
  
  @mock.patch('src.models.DBSession.query')
  def test_reference_triage_index_should_return_valid_reference_triages(self, mock_search):
    mock_search.side_effect = reference_side_effect
    reference_triage = [factory.ReferencetriageFactory()]
    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    response = reference_triage_index(request)
    result = {'entries': [t.to_dict() for t in reference_triage], 'total': 1}
    self.assertEqual(response, result)

  #reference_tags
  #get_recent_annotations
  #colleague_triage_index
  
  ##colleague_triage_show
  @mock.patch('src.models.DBSession.query')
  def test_colleague_triage_show_should_return_valid_colleague_information(self, mock_search):
    mock_search.side_effect = side_effect

    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    request.matchdict['id'] = "1"
    response = colleague_triage_show(request)
    colleage_triage = factory.ColleaguetriageFactory()
    self.assertEqual(response, colleage_triage.to_dict())

  ##colleague_with_subscription
  @mock.patch('src.models.DBSession.query')
  def test_colleague_with_subscription_should_return_valid_emails(self, mock_search):
    mock_search.side_effect = side_effect

    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    response = colleague_with_subscription(request)
    result = {'colleagues': 'jimmy.page@example.org;\njimmy.page@example.org'}
    self.assertEqual(response,result)
  
  ##ptm_by_gene
  @mock.patch('src.models.DBSession.query')
  def test_ptm_by_gene_should_return_valid_ptm(self, mock_search):
    mock_search.side_effect = side_effect

    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    request.matchdict['id'] = "184870"
    response = ptm_by_gene(request)
    result = ['{"ptms": [{"site_index": 1, "reference": {"sgdid": "S000001", "link": "http://example.org/entity", "display_name": "My entity", "pubmed_id": 1}, "taxonomy": {"taxonomy_id": "", "display_name": "", "format_name": ""}, "locus": {"link": "/reference/S000185012", "display_name": "display name", "id": 1, "format_name": "format name"}, "site_residue": "residue", "id": 1, "aliases": [], "properties": [], "source": {"display_name": "Addgene"}, "psimod_id": 1, "modifier": {"format_name": ""}, "type": "display_name"}]}']
    self.assertEqual(response._app_iter__get(),result)
  
  ##get_strains
  @mock.patch('src.models.DBSession.query')
  def test_get_strains_should_return_valid_list(self, mock_search):
    mock_search.side_effect = strain_side_effect

    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    response = get_strains(request)
    result = {'strains': [{'taxonomy_id': 1, 'display_name': 'SOME NAME'}]}
    self.assertEqual(response,result)
  
  ##get_psimod
  @mock.patch('src.models.DBSession.query')
  def test_get_psimod_should_return_valid_list(self, mock_search):
    mock_search.side_effect = side_effect

    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    response = get_psimod(request)
    result = ['{"psimods": [{"display_name": "display_name", "psimod_id": 1, "format_name": "format_name", "inuse": true}, {"display_name": "display_name", "psimod_id": 1, "format_name": "format_name", "inuse": false}]}']
    self.assertEqual(response._app_iter__get(), result)
