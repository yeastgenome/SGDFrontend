from pyramid import testing

import unittest
import mock
import os
import StringIO
import json
import test.fixtures as factory
from test.mock_helpers import MockQuery, MockQueryFilter, MockFileStorage
from src.views import upload_file, extensions
from src.helpers import FILE_EXTENSIONS
from src.models import Filedbentity


class UploadTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        self.complete_params = {
            'file': '',
            'old_filepath': '',
            'new_filepath': '',
            'previous_file_name': '',
            'display_name': '',
            'status': '',
            'topic': '',
            'topic_id': '',
            'format': '',
            'format_id': '',
            'extension': '',
            'extension_id': '',
            'file_date': '',
            'is_public': '',
            'for_spell': '',
            'for_browser': '',
            'readme_name': '',
            'pmids': '',
            'keyword_ids': '',

            'form.submitted': 1
        }

    def tearDown(self):
        testing.tearDown()

    def test_no_file_uploaded_should_return_400(self):
        request = testing.DummyRequest(post={})
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}
        
        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Field \'file\' is missing'})
        
    def test_invalid_file_upload_should_return_400(self):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.unvalid_extension'

        self.complete_params['file'] = upload
        
        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}
        
        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'File extension is invalid'})

    def test_invalid_pmids_should_return_400(self):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        self.complete_params['file'] = upload
        self.complete_params['pmids'] = 'invalid_pmid'

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'PMIDs must be integer numbers. You sent: invalid_pmid'})

    @mock.patch('src.models.DBSession.query')
    def test_valid_pmids_but_inexistent_should_return_400(self, mock_search):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        self.complete_params['file'] = upload
        self.complete_params['pmids'] = '1234'

        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Nonexistent PMID(s): 1234'})

    @mock.patch('src.models.DBSession.query')
    def test_inexistent_keywords_should_return_400(self, mock_search):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        self.complete_params['file'] = upload
        self.complete_params['keyword_ids'] = 'keyword_1'

        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Invalid or nonexistent Keyword ID: keyword_1'})

    @mock.patch('src.models.DBSession.query')
    def test_inexistent_topic_should_return_400(self, mock_search):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        self.complete_params['file'] = upload
        self.complete_params['topic_id'] = 'random_topic'

        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Invalid or nonexistent Topic ID: random_topic'})

    @mock.patch('src.views.extract_topic', return_value='')
    @mock.patch('src.models.DBSession.query')
    def test_inexistent_format_should_return_400(self, mock_search, mock_topic):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        self.complete_params['file'] = upload
        self.complete_params['format_id'] = 'format_123'

        mock_search.return_value = MockQuery(None)

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Invalid or nonexistent Format ID: format_123'})

    @mock.patch('src.views.file_already_uploaded', return_value=True)
    @mock.patch('src.views.extract_format', return_value='')
    @mock.patch('src.views.extract_references', return_value='')
    @mock.patch('src.views.extract_keywords', return_value='')
    @mock.patch('src.views.extract_topic', return_value='')
    @mock.patch('src.views.get_or_create_filepath', return_value='')
    def test_file_already_upload_should_return_400(self, mock_filepath, mock_topic, mock_keywords, mock_references, mock_format, mock_file):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        self.complete_params['file'] = upload
        self.complete_params['display_name'] = 'file.txt'

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.body), {'error': 'Upload error: File file.txt already exists.'})

    @mock.patch('src.views.transaction')
    @mock.patch('src.celery_tasks.upload_to_s3.delay')
    @mock.patch('src.views.secure_save_file', return_value='/tmp/file.txt')
    @mock.patch('src.views.link_keywords_to_file', return_value='')
    @mock.patch('src.views.link_references_to_file', return_value='')
    @mock.patch('src.views.file_already_uploaded', return_value=False)
    @mock.patch('src.views.extract_format')
    @mock.patch('src.views.extract_references', return_value='')
    @mock.patch('src.views.extract_keywords', return_value='')
    @mock.patch('src.views.extract_topic')
    @mock.patch('src.views.get_or_create_filepath')
    @mock.patch('src.views.DBSession')
    def test_file_should_be_saved_and_uploaded(self, mock_session, mock_filepath, mock_topic, mock_keywords, mock_references, mock_format, mock_file, mock_refs, mock_keys, mock_save, mock_tasks, mock_transaction):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'

        topic = factory.EdamFactory.build()
        format = factory.EdamFactory.build()
        filepath = factory.FilepathFactory.build()

        mock_topic.return_value = topic
        mock_format.return_value = format
        mock_filepath.return_value = filepath
        
        self.complete_params['file'] = upload
        self.complete_params['display_name'] = 'file.txt'
        self.complete_params['file_date'] = '2016-03-18 14:09:10'

        request = testing.DummyRequest(post=self.complete_params)
        request.context = testing.DummyResource()
        request.session = {'email': 'curator@example.org', 'username': 'curator'}

        response = upload_file(request.context, request)

        fdb = Filedbentity(
            md5sum=None,
            previous_file_name=self.complete_params['previous_file_name'],
            topic_id=topic.edam_id,
            format_id=format.edam_id,
            file_date=self.complete_params['file_date'],
            is_public=self.complete_params['is_public'],
            is_in_spell=self.complete_params['for_spell'],
            is_in_browser=self.complete_params['for_browser'],
            filepath_id=filepath.filepath_id,
            readme_url=self.complete_params['readme_name'],
            file_extension=self.complete_params['extension'],

            # DBentity params
            format_name=self.complete_params['display_name'],
            display_name=self.complete_params['display_name'],
            s3_url=None,
            source_id=339,
            dbentity_status=self.complete_params['status']
        )
        
        self.assertTrue(mock_session.add.called_with(fdb))
        self.assertTrue(mock_session.flush.called)
        self.assertTrue(mock_session.refresh.called_with(fdb))
        self.assertTrue(mock_transaction.commit.called)
        self.assertTrue(mock_save.called)
        
        mock_tasks.assert_called_with(os.path.join('/tmp', upload.filename), None, self.complete_params['extension'], os.environ['S3_ACCESS_KEY'], os.environ['S3_SECRET_KEY'], os.environ['S3_BUCKET'])
       
        self.assertEqual(response.status_code, 200)


class MiscUploadTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_should_return_all_valid_extensions(self):
        request = testing.DummyRequest()
        request.context = testing.DummyResource()
        response = extensions(request)
        
        self.assertEqual(response, {'options': [{'id': e, 'name': e} for e in FILE_EXTENSIONS]})
