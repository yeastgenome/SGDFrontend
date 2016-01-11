from pyramid import testing

import unittest
import mock
import os
import StringIO
import fixtures as factory
from src.views import upload_file, colleagues_by_last_name, authenticate


class MockFileStorage(object):
    pass


class ColleaguesTest(unittest.TestCase):    
    def setUp(self):
        self.config = testing.setUp()
        self.colleague = factory.ColleagueFactory.build()

    def tearDown(self):
        testing.tearDown()

    @mock.patch('src.models.DBSession.query')
    def test_should_return_list_of_colleagues_by_escaped_last_name(self, mock_search):
        colleagues = [
            {
                'first_name': 'Jimmy',
                'last_name': 'Page',
                'organization': 'Stanford University',
                'work_phone': '444-444-4444',
                'fax': '444-444-4444',
                'email': 'jimmy.page@stanford.edu',
                'www': 'http://jimmy.page.com'
            }
        ]
        
        request = testing.DummyRequest(params={'last_name': 'Page'})
        request.context = testing.DummyResource()

        mock_search.return_value = [self.colleague]
        response = colleagues_by_last_name(request)
        self.assertEqual(response, [self.colleague])
        self.assertTrue(mock_search.called)

    @mock.patch('src.models.DBSession.query')
    @mock.patch('src.views.escape', return_value='Page')
    def test_should_return_list_of_colleagues_by_escaped_last_name(self, mock_escape, mock_search):
        request = testing.DummyRequest(params={'last_name': 'Page'})
        request.context = testing.DummyResource()

        mock_search.return_value = [self.colleague]
        response = colleagues_by_last_name(request)
        mock_escape.assert_called_with('Page')

    def test_should_return_400_for_missing_last_name_arg(self):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = colleagues_by_last_name(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.message, 'last_name argument is missing')

    def test_should_return_colleagues_info(self):
        pass

    def test_should_return_404_for_unexistent_colleague_id(self):
        pass

    def test_should_return_400_for_invalid_colleague_id(self):
        pass


class UploadTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_no_file_uploaded_should_return_400(self):
        request = testing.DummyRequest(post={})
        request.context = testing.DummyResource()
        response = upload_file(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.message, 'Field \'file\' is missing')
        
    def test_invalid_file_upload_should_return_400(self):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO().write('upload me!')
        upload.filename = 'file.unvalid_extension'
        
        request = testing.DummyRequest(post={'file': upload, 'form.submitted': '1'})
        request.context = testing.DummyResource()
        response = upload_file(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.message, 'File extension is invalid')

    @mock.patch('src.celery_tasks.upload_to_s3.delay')
    @mock.patch('src.views.secure_save_file', return_value='/tmp/file.txt')
    def test_temp_storage_and_upload(self, mock_save, mock_tasks):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'
        
        request = testing.DummyRequest(post={'file': upload, 'form.submitted': '1'})
        request.context = testing.DummyResource()
        
        response = upload_file(request)

        self.assertTrue(mock_save.called)
        
        mock_tasks.assert_called_with(upload.filename, os.path.join('/tmp', upload.filename), os.environ['S3_ACCESS_KEY'], os.environ['S3_SECRET_KEY'], os.environ['S3_BUCKET'])
        
        self.assertEqual(response.status_code, 200)


class AutheticationTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_request_with_no_csrf_should_return_403(self):
        request = testing.DummyRequest(post={})
        request.context = testing.DummyRequest()
        response = authenticate(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Expected CSRF token not found')

    def test_request_with_no_token_should_return_403(self):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        
        response = authenticate(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Expected authentication token not found')
        self.assertNotIn('email', request.session)

    def test_request_with_fake_token_should_return_403(self):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'invalid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        response = authenticate(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Authentication token is invalid')
        self.assertNotIn('email', request.session)

    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_invalid_iss_for_token_should_return_403(self, token_validator):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        token_validator.return_value = {'iss': 'invalid_iss'}

        response = authenticate(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Authentication token has an invalid ISS')
        self.assertNotIn('email', request.session)

    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_but_no_email_should_return_403(self, token_validator):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        token_validator.return_value = {'iss': 'accounts.google.com'}

        response = authenticate(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Authentication token has no email')
        self.assertNotIn('email', request.session)

    @mock.patch('src.views.log.info')
    @mock.patch('src.views.is_a_curator')
    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_but_not_a_curator_should_return_403(self, token_validator, is_a_curator, log):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        request.remote_addr = '127.0.0.1'

        token_validator.return_value = {'iss': 'accounts.google.com', 'email': 'not-a-curator@example.org'}
        is_a_curator.return_value = False

        response = authenticate(request)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'User not authorized on SGD')
        self.assertNotIn('email', request.session)
        log.assert_called_with('User not-a-curator@example.org trying to authenticate from 127.0.0.1')

    @mock.patch('src.views.log.info')
    @mock.patch('src.views.is_a_curator')
    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_and_user_should_return_a_logged_session(self, token_validator, is_a_curator, log):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'valid_token'})
        
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        request.remote_addr = '127.0.0.1'

        token_validator.return_value = {'iss': 'accounts.google.com', 'email': 'curator@example.org'}
        is_a_curator.return_value = True

        response = authenticate(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(request.session.get('email'), 'curator@example.org')
        log.assert_called_with('User curator@example.org was successfuly authenticated.')
