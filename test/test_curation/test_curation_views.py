from pyramid import testing
import unittest
import mock
from src.curation_views import get_locus_curate, reference_triage_id, reference_triage_index, get_strains, get_psimod
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import locus_side_effect, reference_side_effect, side_effect

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
  #colleague_triage_show
  #colleague_with_subscription
  #ptm_by_gene
  
  #get_strains
  
  ##get_psimod
  @mock.patch('src.models.DBSession.query')
  def test_get_psimod_should_return_valid_list(self, mock_search):
    mock_search.side_effect = side_effect

    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    response = get_psimod(request)
    result = ['{"psimods": [{"display_name": "display_name", "psimod_id": 1, "format_name": "format_name", "inuse": true}, {"display_name": "display_name", "psimod_id": 1, "format_name": "format_name", "inuse": false}]}']
    self.assertEqual(response._app_iter__get(), result)
