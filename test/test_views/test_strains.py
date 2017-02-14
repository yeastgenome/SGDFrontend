from pyramid import testing

import unittest
import mock
import json
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

            if args[0] == ('strain_display_name', 'strain_url_type', 'strain_obj_url'):
                mock_search.side_effect = factory.StrainUrlFactory()
            elif args[0] == ('strain_summary_id', 'strain_summary_html'):
                mock_search.side_effect = factory.StrainsummaryFactory()
            elif args[0] == ('strainsummary_reference_id'):
                mock_search.side_effect = factory.StrainsummaryReferenceFactory()
            elif args[0] == ('reference_id'):
                mock_search.side_effect = factory.ReferencedbentityFactory()
            elif args[0] == ('contig'):
                mock_search.side_effect = factory.ContigFactory()
            else:
                s_name = factory.StraindbentityFactory()
                mock_search.return_value = MockQuery(s_name)


        mock_search.side_effect = side_effect

        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        request.matchdict['id'] = mock_search.side_effect
        response = strain(request)
        self.assertEqual(response, mock_search.to_dict())

        #urls = DBSession.query(StrainUrl.display_name, StrainUrl.url_type, StrainUrl.obj_url).filter_by(strain_id=self.dbentity_id).all()
        #paragraph = DBSession.query(Strainsummary.summary_id, Strainsummary.html).filter_by(strain_id=self.dbentity_id).one_or_none()
        #reference_ids = DBSession.query(StrainsummaryReference.reference_id).filter_by(summary_id=paragraph[0]).order_by(StrainsummaryReference.reference_order).all()
        #references = DBSession.query(Referencedbentity).filter(Referencedbentity.dbentity_id.in_(reference_ids)).all()
        #contigs = DBSession.query(Contig).filter_by(taxonomy_id=self.taxonomy_id).all()



