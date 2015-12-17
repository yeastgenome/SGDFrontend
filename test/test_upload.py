from pyramid import testing

import unittest
import mock
import os
import StringIO

from src.views import upload_file


class MockFileStorage(object):
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
        request.registry.settings['s3_access_key'] = 'lalala'
        request.registry.settings['s3_secret_key'] = 'lalala'
        request.registry.settings['s3_bucket'] = 'lalala'
        request.context = testing.DummyResource()
        
        response = upload_file(request)

        self.assertTrue(mock_save.called)
        
        mock_tasks.assert_called_with(upload.filename, os.path.join('/tmp', upload.filename), request.registry.settings['s3_access_key'], request.registry.settings['s3_secret_key'], request.registry.settings['s3_bucket'])
        
        self.assertEqual(response.status_code, 200)
