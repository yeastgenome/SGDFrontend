from pyramid import testing
import unittest
import mock
from src.curation_views import get_locus_curate, reference_triage_id
import test.fixtures as factory
from test.mock_helpers import MockQuery
from test.mock_helpers import locus_side_effect, reference_side_effect

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
  
