import unittest
import os
import mock

from src.helpers import md5, allowed_file, secure_save_file, curator_or_none
from src.models import Dbuser

import fixtures as factory


class MockQueryFilter(object):
    def __init__(self, query_result):
        self._return = query_result

    def first(self):
        return self._return


class MockQuery(object):
    def __init__(self, query_result):
        self._query_result = query_result

    def filter(self, query_result):
        return MockQueryFilter(self._query_result)


class HelpersTest(unittest.TestCase):
    def setUp(self):
        self.valid_filename = 'temp_test_1.txt'
        self.unexistent_filename = 'i_dont_exist.txt'
        self.invalid_extension_filename = 'invalid_extension.txxxt'

        self.msg = 'This is just a temporary message for a temporary file.'
        for fname in [self.valid_filename, self.invalid_extension_filename]:
            with open(fname, 'w') as f:
                f.write(self.msg)

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
        db_user = factory.DbuserFactory.build()
        mock_search.return_value = MockQuery(db_user)
        
        self.assertEqual(curator_or_none(db_user.email), db_user)
        self.assertTrue(mock_search.called_with(Dbuser))

    @mock.patch('src.models.DBSession.query')
    def test_is_an_inactive_curator(self, mock_search):
        db_user = factory.DbuserFactory.build()
        db_user.status = 'Former'
        mock_search.return_value = MockQuery(db_user)
        
        self.assertEqual(curator_or_none(db_user.email), None)
        self.assertTrue(mock_search.called_with(Dbuser))

    @mock.patch('src.models.DBSession.query')
    def test_is_an_inexistent_curator(self, mock_search):
        db_user = factory.DbuserFactory.build()
        db_user.status = 'Former'
        mock_search.return_value = MockQuery(None)
        
        self.assertEqual(curator_or_none(db_user.email), None)
        self.assertTrue(mock_search.called_with(Dbuser))
