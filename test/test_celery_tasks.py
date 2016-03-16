from moto import mock_s3
import unittest
import mock
import tempfile
import os
import boto
from mock_helpers import MockQuery
import fixtures as factory

from src.helpers import md5
from src.celery_tasks import upload_to_s3

class UploadToS3Test(unittest.TestCase):
    def setUp(self):
        self.sgdid = "S00001"
        self.file_extension = "txt"
        self.file_content = "Upload me and delete me!"

        self.fdbentity = factory.FiledbentityFactory.build(sgdid = self.sgdid)
        
        self.tmpfilepath = os.path.join(tempfile.gettempdir(), "tmp-testfile")
        with open(self.tmpfilepath, "wb") as f:
            f.write(self.file_content)

    def tearDown(self):
        if os.path.isfile(self.tmpfilepath):
            os.remove(self.tmpfilepath)

    @mock_s3
    @mock.patch('src.models.DBSession.query')
    def test_saves_file_in_s3(self, mock_search):
        mock_search.return_value = MockQuery(self.fdbentity)
        
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')

        upload_to_s3(self.tmpfilepath, self.sgdid, self.file_extension, "s3_access_key", "s3_secret_key", "mybucket")

        self.assertEqual(conn.get_bucket('mybucket').get_key(self.sgdid + "." + self.file_extension).get_contents_as_string(), self.file_content)

    @mock_s3
    @mock.patch('src.celery_tasks.md5', return_value="111")
    def test_verifies_md5_sum_and_raises_exception_if_fails(self, mock_md5):
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')

        with self.assertRaises(Exception):
            self.assertEqual(conn.get_bucket('mybucket').get_key(self.sgdid + "." + self.file_extension).get_contents_as_string(), self.file_content)
            upload_to_s3(self.tmpfilepath, self.sgdid, self.file_extension, "s3_access_key", "s3_secret_key", "mybucket")
            mock_md5.assert_called_with(self.tmpfilepath)

    @mock_s3
    @mock.patch('src.models.DBSession.query')
    @mock.patch('os.remove')
    def test_deletes_file_from_filesystem(self, mock_os_remove, mock_search):
        mock_search.return_value = MockQuery(self.fdbentity)
        
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')
        upload_to_s3(self.tmpfilepath, self.sgdid, self.file_extension, "s3_access_key", "s3_secret_key", "mybucket")
        
        self.assertTrue(mock_os_remove.called)

    @mock_s3
    @mock.patch('transaction.commit')
    @mock.patch('src.models.DBSession.flush')
    @mock.patch('src.models.DBSession.query')
    def test_updates_fildbentity_in_database(self, mock_search, mock_session, mock_transaction):
        fdbentity = factory.FiledbentityFactory.build(s3_url = None, md5sum = None)
        mock_search.return_value = MockQuery(fdbentity)
        
        local_md5 = md5(self.tmpfilepath)
        
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')
        upload_to_s3(self.tmpfilepath, self.sgdid, self.file_extension, "s3_access_key", "s3_secret_key", "mybucket")

        self.assertEqual(fdbentity.s3_url, "https://mybucket.s3.amazonaws.com/" + self.sgdid + "." + self.file_extension)
        self.assertEqual(fdbentity.md5sum, local_md5)
        
        self.assertTrue(mock_session.called)
        self.assertTrue(mock_transaction.called)
