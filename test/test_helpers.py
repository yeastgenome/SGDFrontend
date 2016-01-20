import os

import unittest
import mock
from mock_helpers import MockQuery, MockQueryFilter
from pyramid import testing
import fixtures as factory

from pyramid.httpexceptions import HTTPForbidden, HTTPOk

from src.helpers import md5, allowed_file, secure_save_file, curator_or_none, authenticate
from src.models import Dbuser


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
