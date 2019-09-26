from pyramid import testing
import unittest
import mock
from src.curation_views import get_locus_curate, reference_triage_id, reference_triage_index, colleague_with_subscription, get_strains, ptm_by_gene, get_strains, get_psimod, colleague_triage_show, colleague_triage_index, reference_tags, get_recent_annotations
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

  ##reference_tags
  @mock.patch('src.models.DBSession.query')
  def test_reference_tags_should_return_valid_reference(self, mock_search):
    mock_search.side_effect = reference_side_effect
    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    request.matchdict['id'] = "1"
    response = reference_tags(request)
    result = [{'comment': 'curators comments', 'genes': 'GENE1', 'name': None}]
    self.assertEqual(response,result)


  ##get_recent_annotations
  @mock.patch('src.models.DBSession.query')
  def test_get_recent_annotations_should_return_valid_list_of_valid_annotation(self, mock_search):
    mock_search.side_effect = side_effect
    
    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    request.params['everyone'] = True
    request.session['username'] = "OTTO"
    response = get_recent_annotations(request)
    response[0]['time_created'] = response[0]['time_created'][0:-9]

    curation_factory = factory.CuratorActivityFactory()
    result = curation_factory.to_dict()
    result['time_created'] = result['time_created'][0:-9]

    self.assertEqual(response,[result])


  ##colleague_triage_index
  @mock.patch('src.models.DBSession.query')
  def test_colleague_triage_index_should_return_valid_list_of_colleague_information(self, mock_search):
    mock_search.side_effect = side_effect
    
    request = testing.DummyRequest()
    request.context = testing.DummyResource()
    response = colleague_triage_index(request)
    colleage_triage = factory.ColleaguetriageFactory()
    self.assertEqual(response, [colleage_triage.to_dict()])
  
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
    result = [b'{"ptms": [{"site_index": 1, "site_residue": "residue", "locus": {"id": 1, "display_name": "display name", "format_name": "format name", "link": "/reference/S000185012"}, "reference": {"display_name": "My entity", "link": "http://example.org/entity", "pubmed_id": 1, "sgdid": "S000001"}, "properties": [], "source": {"display_name": "Addgene"}, "aliases": [], "type": "display_name", "id": 1, "modifier": {"format_name": ""}, "psimod_id": 1, "taxonomy": {"taxonomy_id": "", "format_name": "", "display_name": ""}}]}']
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
    result = [b'{"psimods": [{"psimod_id": 1, "format_name": "format_name", "display_name": "display_name", "inuse": true}, {"psimod_id": 1, "format_name": "format_name", "display_name": "display_name", "inuse": false}]}']
    self.assertEqual(response._app_iter__get(), result)
