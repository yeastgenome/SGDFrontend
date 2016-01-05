from pyramid import testing

import unittest
import mock
import os
import StringIO
import fixtures as factory
from src.views import upload_file, colleagues_by_last_name


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
