from pyramid import testing

import unittest
import mock
import json
from test.test_helpers import test_reference_side_effect
import test.fixtures as factory
from test.mock_helpers import MockQuery
from src.views import strain


class StraindbentityTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    # @mock.patch('src.models.DBSession.query')
    # def test_should_return_valid_strain_name(self, mock_search):
    #
    #         s_name = factory.StraindbentityFactory()
    #         mock_search.return_value = MockQuery(s_name)
    #
    #         request = testing.DummyRequest()
    #         request.context = testing.DummyResource()
    #         request.matchdict['id'] = s_name.display_name
    #         response = strain(request)
    #
    #         self.assertEqual(response, s_name.to_dict())

    @mock.patch('src.models.DBSession.query')
    def test_should_return_valid_strain_name(self, mock_search):

        def side_effect(*args, **kwargs):
            import pdb; pdb.set_trace()
            if len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
                s_name = factory.StraindbentityFactory()
                return MockQuery(s_name)
            if len(args) == 3 and str(args[0]) == 'StrainUrl.display_name' and str(args[1]) == 'StrainUrl.url_type' and str(args[2]) == 'StrainUrl.obj_url':
                strain_url = factory.StrainUrlFactory()
                return MockQuery((strain_url.display_name, strain_url.url_type, strain_url.obj_url))
            elif len(args) == 2 and str(args[0]) == 'Strainsummary.summary_id' and str(args[1]) == 'Strainsummary.html':
                strain_summary = factory.StrainsummaryFactory()
                return MockQuery((strain_summary.summary_id, strain_summary.html))
            elif len(args) == 1 and str(args[0]) == 'StrainsummaryReference.reference_id':
                strain_ref = factory.StrainsummaryReferenceFactory()
                return MockQuery((strain_ref))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
                  test_reference_side_effect(*args, **kwargs)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Contig'>":
                c_name = factory.ContigFactory()
                return MockQuery(c_name)

        mock_search.side_effect = side_effect

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = "S000203483"
        response = strain(request)
        print response.status_code
        self.assertEqual(response, mock_search.to_dict())

        #urls = DBSession.query(StrainUrl.display_name, StrainUrl.url_type, StrainUrl.obj_url).filter_by(strain_id=self.dbentity_id).all()
        #paragraph = DBSession.query(Strainsummary.summary_id, Strainsummary.html).filter_by(strain_id=self.dbentity_id).one_or_none()
        #reference_ids = DBSession.query(StrainsummaryReference.reference_id).filter_by(summary_id=paragraph[0]).order_by(StrainsummaryReference.reference_order).all()
        #references = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reference_ids)).all()
        #contigs = DBSession.query(Contig).filter_by(taxonomy_id=self.taxonomy_id).all()

    @mock.patch('src.models.DBSession.query')
    def test_should_return_non_existent_strain(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = 'nonexistent_id'
        response = strain(request)
        self.assertEqual(response.status_code, 404)

