from moto import mock_s3
import unittest
import mock
import tempfile
import os
import boto

from src.celery_tasks import upload_to_s3

class UploadToS3Test(unittest.TestCase):
    def setUp(self):
        self.tmpfilename = "tmp-testfile"
        self.tmpfilepath = os.path.join(tempfile.gettempdir(), self.tmpfilename)
        with open(self.tmpfilepath, "wb") as f:
            f.write("Upload me and delete me!")

    def tearDown(self):
        if os.path.isfile(self.tmpfilepath):
            os.remove(self.tmpfilepath)

    @mock_s3
    def test_saves_file_in_s3(self):
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')

        upload_to_s3(self.tmpfilename, self.tmpfilepath, "s3_access_key", "s3_secret_key", "mybucket")

        self.assertEqual(conn.get_bucket('mybucket').get_key(self.tmpfilename).get_contents_as_string(), 'Upload me and delete me!')

    @mock_s3
    @mock.patch('src.celery_tasks.md5', return_value="111")
    def test_verifies_md5_sum_and_raises_exception_if_fails(self, mock_md5):
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')

        with self.assertRaises(Exception):
            upload_to_s3(self.tmpfilename, self.tmpfilepath, "s3_access_key", "s3_secret_key", "mybucket")
            mock_md5.assert_called_with(self.tmpfilepath)

    @mock_s3
    @mock.patch('os.remove')
    def test_deletes_file_from_filesystem(self, mock_os_remove):
        conn = boto.connect_s3()
        conn.create_bucket('mybucket')

        upload_to_s3(self.tmpfilename, self.tmpfilepath, "s3_access_key", "s3_secret_key", "mybucket")
        
        self.assertTrue(mock_os_remove.called)
