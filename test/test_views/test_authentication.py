from pyramid import testing

import unittest
import mock
import json
from src.views import sign_in, sign_out
import test.fixtures as factory

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
        self.assertEqual(json.loads(response.body), {'error': 'Bad CSRF Token'})

    def test_request_with_no_token_should_return_403(self):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        
        response = sign_in(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.body), {'error': 'Expected authentication token not found'})
        self.assertNotIn('email', request.session)

    def test_request_with_fake_token_should_return_403(self):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'google_token': 'invalid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        response = sign_in(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.body), {'error': 'Authentication token is invalid'})
        self.assertNotIn('email', request.session)

    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_invalid_iss_for_token_should_return_403(self, token_validator):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'google_token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        token_validator.return_value = {'iss': 'invalid_iss'}

        response = sign_in(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.body), {'error': 'Authentication token has an invalid ISS'})
        self.assertNotIn('email', request.session)

    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_but_no_email_should_return_403(self, token_validator):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'google_token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()

        token_validator.return_value = {'iss': 'accounts.google.com'}

        response = sign_in(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.body), {'error': 'Authentication token has no email'})
        self.assertNotIn('email', request.session)

    @mock.patch('src.views.log.info')
    @mock.patch('src.views.curator_or_none')
    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_but_not_a_curator_should_return_403(self, token_validator, curator_or_none, log):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'google_token': 'valid_token'})
        request.session['_csrft_'] = csrf_token
        request.context = testing.DummyRequest()
        request.remote_addr = '127.0.0.1'

        token_validator.return_value = {'iss': 'accounts.google.com', 'email': 'not-a-curator@example.org'}
        curator_or_none.return_value = None

        response = sign_in(request)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.body), {'error': 'User not-a-curator@example.org is not authorized on SGD'})
        self.assertNotIn('email', request.session)
        log.assert_called_with('User not-a-curator@example.org trying to authenticate from 127.0.0.1')

    @mock.patch('src.views.log.info')
    @mock.patch('src.views.curator_or_none')
    @mock.patch('oauth2client.client.verify_id_token')
    def test_request_with_valid_token_and_user_should_return_a_logged_session(self, token_validator, curator_or_none, log):
        csrf_token = 'dummy_csrf_token'
        
        request = testing.DummyRequest(headers={'X-CSRF-Token': csrf_token}, post={'google_token': 'valid_token'})
        
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
