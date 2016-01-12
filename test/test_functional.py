import unittest
from moto import mock_s3
import StringIO
import os
import tempfile
import fixtures as factory
import json


class MockFileStorage(object):
    pass


class SGDFunctionalTests(unittest.TestCase):
    def setUp(self):
        self.tmpfilename = "tmpfile.txt"
        self.tmpfilepath = os.path.join(tempfile.gettempdir(), self.tmpfilename)
        with open(self.tmpfilepath, "wb") as f:
            f.write("Upload me and delete me!")
        
        from src import main
        settings = {'pyramid.includes': ['pyramid_celery', 'pyramid_redis_sessions', 'pyramid_jinja2'], 'jinja2.directories': "../templates", 'redis.sessions.secret': 'my_session_secret_for_testing_only'}
        app = main({'__file__': 'development.ini'}, **settings)
        from webtest import TestApp

        self.testapp = TestApp(app)

    def tearDown(self):
        if os.path.isfile(self.tmpfilepath):
            os.remove(self.tmpfilepath)
        
    def test_home(self):
        res = self.testapp.get('/')
        self.assertEqual(res.status, '200 OK')
        self.assertIn(b'<h1>SGD File Uploader</h1>', res.body)

    @mock_s3
    def test_upload(self):
        upload = MockFileStorage()
        upload.file = StringIO.StringIO('upload me!')
        upload.filename = 'file.txt'
        
        res = self.testapp.post('/upload', upload_files=[('file', self.tmpfilepath)])
        self.assertEqual(res.status, '200 OK')

    # def test_colleagues(self):
    #     res = self.testapp.get('/colleagues?last_name=Page')
    #     self.assertEqual(res.body, json.dumps([{
    #             'first_name': 'Jimmy',
    #             'last_name': 'Page',
    #             'organization': 'Stanford University',
    #             'work_phone': '444-444-4444',
    #             'fax': '444-444-4444',
    #             'email': 'jimmy.page@stanford.edu',
    #             'www': 'http://jimmy.page.com'
    #         }
    #     ]))
