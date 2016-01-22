from pyramid import testing

import unittest
import mock
import os
import StringIO
import fixtures as factory
from mock_helpers import MockQuery, MockQueryFilter, MockFileStorage
from src.views import upload_file, colleagues_by_last_name, sign_in, sign_out, colleague_by_id
from src.models import Colleague


class ColleaguesTest(unittest.TestCase):    
    def setUp(self):
        self.config = testing.setUp()
        self.colleague = factory.ColleagueFactory.build()
        self.url_1 = factory.ColleagueUrlFactory.build(url_id=1, colleague_id=self.colleague.colleague_id)
        self.url_2 = factory.ColleagueUrlFactory.build(url_id=2, colleague_id=self.colleague.colleague_id, url_type="Lab")

    def tearDown(self):
        testing.tearDown()

    def test_should_return_400_for_missing_last_name_arg(self):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = colleagues_by_last_name(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.message, 'Query string field is missing: last_name')

    @mock.patch('src.models.Colleague.urls', new_callable=mock.PropertyMock)
    @mock.patch('src.models.DBSession.query')
    def test_should_return_list_of_colleagues_by_last_name(self, mock_search, colleague_urls):
        request = testing.DummyRequest(params={'last_name': 'Page'})
        request.context = testing.DummyResource()

        mock_search.return_value = MockQuery(self.colleague)
        colleague_urls.return_value = [self.url_1, self.url_2]

        response = colleagues_by_last_name(request)
        self.assertEqual(response, [{'work_phone': self.colleague.work_phone, 'organization': self.colleague.institution, 'first_name': self.colleague.first_name, 'last_name': self.colleague.last_name, 'fax': self.colleague.fax, 'lab_url': self.url_1.obj_url, 'research_summary_url': self.url_2.obj_url}])

    @mock.patch('src.models.DBSession.query')
    def test_last_names_should_begin_with_query_string(self, mock_search):
        mock_search.return_value = MockQuery(self.colleague)

        request = testing.DummyRequest(params={'last_name': 'page'})
        exp = Colleague.last_name.like("Page%")

        response = colleagues_by_last_name(request)

        self.assertTrue(mock_search.called_with(Colleague))
        self.assertTrue(exp.compare(mock_search.return_value._query_filter.query_params()))

    @mock.patch('src.models.DBSession.query')
    def test_should_return_empty_list_for_last_name_not_matched(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(params={'last_name': 'page'})
        response = colleagues_by_last_name(request)

        self.assertEqual(response, [])

    @mock.patch('src.models.Colleague.urls', new_callable=mock.PropertyMock)
    @mock.patch('src.models.DBSession.query')
    def test_should_return_colleague_by_id(self, mock_search, colleague_urls):
        mock_search.return_value = MockQuery(self.colleague)
        colleague_urls.return_value = [self.url_1, self.url_2]

        request = testing.DummyRequest()
        request.matchdict['id'] = str(self.colleague.colleague_id)
        response = colleague_by_id(request)
        self.maxDiff = None
        self.assertEqual(response, {'email': self.colleague.email, 'position': self.colleague.job_title, 'profession': self.colleague.profession, 'organization': self.colleague.institution, 'address': [self.colleague.address1, self.colleague.address2, self.colleague.address3], 'work_phone': self.colleague.work_phone, 'fax': self.colleague.fax, 'webpages': {'lab_url': 'http://example.org', 'research_summary_url': 'http://example.org'}, 'members_of_lab': [], 'associates': [], 'keywords': self.colleague.research_interests, 'research_topics': [], 'last_update': str(self.colleague.date_last_modified)})

    @mock.patch('src.models.DBSession.query')
    def test_should_return_not_found_for_valid_colleague_by_id_but_non_existent(self, mock_search):
        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest()
        request.matchdict['id'] = str(self.colleague.colleague_id)
        response = colleague_by_id(request)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.message, 'Colleague not found')

    def test_should_return_not_found_for_invalid_colleague_by_id(self):
        request = testing.DummyRequest()
        request.matchdict['id'] = "my_invalid_id"
        response = colleague_by_id(request)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.message, 'Colleague not found')


class UploadTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_no_file_uploaded_should_return_400(self):
        request = testing.DummyRequest(post={})
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}
        response = upload_file(request.context, request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.message, 'Field \'file\' is missing')
        
    def test_invalid_file_upload_should_return_400(self):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO().write('upload me!')
        upload.filename = 'file.unvalid_extension'
        
        request = testing.DummyRequest(post={'file': upload, 'form.submitted': '1'})
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}
        response = upload_file(request.context, request)
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
        request.session = {'email': 'curator@example.org', 'username': 'curator'}
        response = upload_file(request.context, request)

        self.assertTrue(mock_save.called)
        
        mock_tasks.assert_called_with(upload.filename, os.path.join('/tmp', upload.filename), os.environ['S3_ACCESS_KEY'], os.environ['S3_SECRET_KEY'], os.environ['S3_BUCKET'])
        
        self.assertEqual(response.status_code, 200)


class AutheticationTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_request_with_no_csrf_should_return_400(self):
        request = testing.DummyRequest(post={})
        request.context = testing.DummyRequest()
        response = sign_in(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.message, 'Bad CSRF Token')

    def test_request_with_no_token_should_return_403(self):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        
        response = sign_in(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Expected authentication token not found')
        self.assertNotIn('email', request.session)

    def test_request_with_fake_token_should_return_403(self):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'invalid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        response = sign_in(request)
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

        response = sign_in(request)
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

        response = sign_in(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'Authentication token has no email')
        self.assertNotIn('email', request.session)

    @mock.patch('src.views.log.info')
    @mock.patch('src.views.curator_or_none')
    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_but_not_a_curator_should_return_403(self, token_validator, curator_or_none, log):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        request.remote_addr = '127.0.0.1'

        token_validator.return_value = {'iss': 'accounts.google.com', 'email': 'not-a-curator@example.org'}
        curator_or_none.return_value = None

        response = sign_in(request)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.message, 'User not authorized on SGD')
        self.assertNotIn('email', request.session)
        log.assert_called_with('User not-a-curator@example.org trying to authenticate from 127.0.0.1')

    @mock.patch('src.views.log.info')
    @mock.patch('src.views.curator_or_none')
    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_and_user_should_return_a_logged_session(self, token_validator, curator_or_none, log):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'token': 'valid_token'})
        
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        request.remote_addr = '127.0.0.1'

        token_validator.return_value = {'iss': 'accounts.google.com', 'email': 'curator@example.org'}
        curator_or_none.return_value = factory.DbuserFactory.build()

        response = sign_in(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(request.session.get('email'), 'curator@example.org')
        log.assert_called_with('User curator@example.org was successfuly authenticated.')

    def test_sign_out_should_clear_session(self):
        request = testing.DummyRequest()
        request.session['_csrft_'] = "csrf token"
        request.session['email'] = "curator@example.org"
        
        response = sign_out(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('email', request.session)
        self.assertNotIn('_csrft_', request.session)

    def test_sign_out_should_invalidate_session(self):
        request = testing.DummyRequest()
        request.session = mock.Mock()
        
        response = sign_out(request)
        
        self.assertEqual(response.status_code, 200)
        request.session.invalidate.assert_called_with()

