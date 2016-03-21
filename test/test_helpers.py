import os

import unittest
import mock
from mock_helpers import MockQuery, MockQueryFilter
from pyramid import testing
import fixtures as factory

from pyramid.httpexceptions import HTTPBadRequest, HTTPForbidden, HTTPOk

from src.helpers import md5, allowed_file, secure_save_file, curator_or_none, authenticate, extract_references, extract_keywords, get_or_create_filepath, extract_topic, extract_format, file_already_uploaded, link_references_to_file, link_keywords_to_file
from src.models import Dbuser, Filepath


class HelpersTest(unittest.TestCase):
    def setUp(self):
        self.valid_filename = 'temp_test_1.txt'
        self.unexistent_filename = 'i_dont_exist.txt'
        self.invalid_extension_filename = 'invalid_extension.txxxt'

        self.msg = 'This is just a temporary message for a temporary file.'
        for fname in [self.valid_filename, self.invalid_extension_filename]:
            with open(fname, 'w') as f:
                f.write(self.msg)

        self.db_user = factory.DbuserFactory.build()

    def tearDown(self):
        for f in [self.valid_filename, self.invalid_extension_filename]:
            os.remove(f)

    def test_md5(self):
        macosx_md5 = "4e8b3f24604aae847088e76fb0fb14be" #calculated using md5 from BSD
        self.assertEqual(md5(self.valid_filename), macosx_md5)

    def test_md5_unexistent_file(self):
        with self.assertRaises(IOError):
            md5(self.unexistent_filename)

    def test_allowed_file(self):
        self.assertTrue(allowed_file(self.valid_filename))
        self.assertFalse(allowed_file(self.invalid_extension_filename))

    @mock.patch('werkzeug.secure_filename', return_value='temp_test_1.txt')
    @mock.patch('tempfile.gettempdir', return_value='/tmp')
    def test_write_temp_file_with_secure_name(self, mock_tmpdir, mock_secure_filename):
        filename = self.valid_filename
        
        f = open(filename, 'r')
        temp_file_path = secure_save_file(f, filename)
        f.close()

        with open(os.path.join('/tmp', filename), 'rb') as f:
            self.assertEqual(f.read(), self.msg)
        
        mock_secure_filename.assert_called_with(filename)
        self.assertTrue(os.path.isfile(os.path.join('/tmp', filename)))
        self.assertEqual(os.path.join('/tmp', filename), temp_file_path)

        os.remove(os.path.join('/tmp', filename))
        
    @mock.patch('src.models.DBSession.query')
    def test_is_an_active_curator(self, mock_search):
        mock_search.return_value = MockQuery(self.db_user)
        exp = (Dbuser.email == self.db_user.email) & (Dbuser.status == 'Current')
        
        self.assertEqual(curator_or_none(self.db_user.email), self.db_user)
        self.assertTrue(mock_search.called_with(Dbuser))
        self.assertTrue(exp.compare(mock_search.return_value._query_filter.query_params()))

    @mock.patch('src.models.DBSession.query')
    def test_is_an_inexistent_curator(self, mock_search):
        self.db_user.status = 'Former'
        mock_search.return_value = MockQuery(None)
        
        self.assertEqual(curator_or_none(self.db_user.email), None)
        self.assertTrue(mock_search.called_with(Dbuser))

    def test_authentication_decorator_denies_requests_with_no_session(self):
        decorator = authenticate(None)
        
        request = testing.DummyRequest()
        response = decorator(None, request)
        self.assertEqual(response.status, '403 Forbidden')

    def test_authentication_decorator_denies_requests_with_no_email(self):
        decorator = authenticate(None)
        
        request = testing.DummyRequest()
        request.session['username'] = 'User'
        response = decorator(None, request)
        self.assertEqual(response.status, '403 Forbidden')

    def test_authentication_decorator_denies_requests_with_no_username(self):
        decorator = authenticate(None)
        
        request = testing.DummyRequest()
        request.session['email'] = 'user@example.org'
        response = decorator(None, request)
        self.assertEqual(response.status, '403 Forbidden')

    def test_authentication_decorator_accepts_requests_username_and_email(self):
        def my_view(request):
            return HTTPOk()

        decorator = authenticate(my_view)
        
        request = testing.DummyRequest()
        request.session['username'] = 'user'
        request.session['email'] = 'user@example.org'
        response = decorator(testing.DummyResource, request)

        self.assertEqual(response.status, '200 OK')

    def test_invalid_references_should_raise_bad_request(self):
        params = {'pmids': 'invalid_pmid'}

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        with self.assertRaises(HTTPBadRequest):
            extract_references(request)

    @mock.patch('src.models.DBSession.query')
    def test_valid_pmids_but_inexistent_should_raise_bad_requset(self, mock_search):
        params = {'pmids': '1234'}
        
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        with self.assertRaises(HTTPBadRequest):
            extract_references(request)

    @mock.patch('src.models.DBSession.query')
    def test_valid_pmids_should_return_reference_ids(self, mock_search):
        params = {'pmids': '1234'}
        reference = factory.ReferencedbentityFactory.build()
        
        mock_search.return_value = MockQuery(reference)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertEqual(extract_references(request), [reference.dbentity_id])

    @mock.patch('src.models.DBSession.query')
    def test_valid_keywords_but_inexistent_should_raise_bad_requset(self, mock_search):
        params = {'keywords': 'keyword_1'}
        
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        with self.assertRaises(HTTPBadRequest):
            extract_keywords(request)

    @mock.patch('src.models.DBSession.query')
    def test_valid_keywords_should_return_ids(self, mock_search):
        params = {'keywords': '1234'}
        keyword = factory.KeywordFactory.build()
        
        mock_search.return_value = MockQuery(keyword)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertEqual(extract_keywords(request), [keyword.keyword_id])

    @mock.patch('src.models.DBSession.query')
    def test_existent_filepath_should_return_object(self, mock_search):
        params = {'new_filepath': '/i/do/exist'}
        filepath = factory.FilepathFactory.build()
        
        mock_search.return_value = MockQuery(filepath)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertEqual(get_or_create_filepath(request), filepath)

    @mock.patch('src.helpers.DBSession')
    def test_inexistent_filepath_should_return_new_object(self, mock_session):
        params = {'new_filepath': '/valid/path'}
        filepath = factory.FilepathFactory.build(filepath='/valid/path')

        mock_session.query.return_value = MockQuery(None)
        mock_session.return_value = MockQuery(None)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        response = get_or_create_filepath(request)
        
        self.assertTrue(mock_session.add.called_with(filepath))
        self.assertTrue(mock_session.flush.called)
        self.assertTrue(mock_session.refresh.called_with(filepath))
        self.assertEqual(response.__class__, Filepath)
        self.assertEqual(response.filepath, params["new_filepath"])
        self.assertEqual(response.source_id, 339)

    @mock.patch('src.models.DBSession.query')
    def test_valid_topic_but_inexistent_should_raise_bad_requset(self, mock_search):
        params = {'topic_id': '1234'}
        
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        with self.assertRaises(HTTPBadRequest):
            extract_topic(request)

    @mock.patch('src.models.DBSession.query')
    def test_valid_topic_should_return_ids(self, mock_search):
        params = {'topic_id': '1234'}
        topic = factory.EdamFactory.build()
        
        mock_search.return_value = MockQuery(topic)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertEqual(extract_topic(request), topic)

    @mock.patch('src.models.DBSession.query')
    def test_valid_format_but_inexistent_should_raise_bad_requset(self, mock_search):
        params = {'format_id': '1234'}
        
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        with self.assertRaises(HTTPBadRequest):
            extract_format(request)

    @mock.patch('src.models.DBSession.query')
    def test_valid_format_should_return_ids(self, mock_search):
        params = {'format_id': '1234'}
        format = factory.EdamFactory.build()
        
        mock_search.return_value = MockQuery(format)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertEqual(extract_format(request), format)

    @mock.patch('src.models.DBSession.query')
    def test_check_file_upload_should_return_true_for_existing_file(self, mock_search):
        params = {'display_name': 'existing_file'}
        filedb = factory.FiledbentityFactory.build()
        
        mock_search.return_value = MockQuery(filedb)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertTrue(file_already_uploaded(request))

    @mock.patch('src.models.DBSession.query')
    def test_check_file_upload_should_return_false_for_existing_file(self, mock_search):
        params = {'display_name': 'existing_file'}
        filedb = factory.FiledbentityFactory.build()
        
        mock_search.return_value = MockQuery(filedb)

        request = testing.DummyRequest(post=params)
        request.context = testing.DummyResource()

        self.assertTrue(file_already_uploaded(request))

    @mock.patch('src.helpers.DBSession')
    def test_link_references_to_file(self, mock_session):
        filedb = factory.FiledbentityFactory.build()
        references = [factory.ReferencedbentityFactory.build(), factory.ReferencedbentityFactory.build()]

        link_references_to_file(references, filedb.dbentity_id)

        for ref in references:
            self.assertTrue(mock_session.add.called_with(ref))
        
        self.assertTrue(mock_session.commit.called)
        
    @mock.patch('src.helpers.DBSession')
    def test_link_keywords_to_file(self, mock_session):
        filedb = factory.FiledbentityFactory.build()
        keywords = [factory.FileKeywordFactory.build(), factory.FileKeywordFactory.build()]

        link_keywords_to_file(keywords, filedb.dbentity_id)

        for key in keywords:
            self.assertTrue(mock_session.add.called_with(key))
        
        self.assertTrue(mock_session.commit.called)
