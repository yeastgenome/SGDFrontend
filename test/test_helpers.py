import unittest
import os

from src.common.helpers import md5, allowed_file

class HelpersTest(unittest.TestCase):
    def setUp(self):
        self.valid_file = 'temp_test_1.txt'
        self.unexistent_file = 'i_dont_exist.txt'
        self.invalid_extension_file = 'invalid_extension.txxxt'

        msg = 'This is just a temporary message for a temporary file.'
        for fname in [self.valid_file, self.invalid_extension_file]:
            with open(fname, 'w') as f:
                f.write(msg)

    def tearDown(self):
        for f in [self.valid_file, self.invalid_extension_file]:
            os.remove(f)

    def test_md5(self):
        macosx_md5 = "4e8b3f24604aae847088e76fb0fb14be" #calculated using md5 from BSD
        self.assertEqual(md5(self.valid_file), macosx_md5)

    def test_md5_unexistent_file(self):
        with self.assertRaises(IOError):
            md5(self.unexistent_file)

    def test_allowed_file(self):
        self.assertTrue(allowed_file(self.valid_file))
        self.assertFalse(allowed_file(self.invalid_extension_file))
