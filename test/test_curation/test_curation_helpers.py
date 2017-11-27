from pyramid import testing
import unittest

class CurationHelperTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def should_link_gene_names(self):
        from src.curation_helpers import link_gene_names
        locus_names_ids = [('HO', 'S000002386'), ('RAD5', 'S000004022'), ('DUR1,2', 'S000000412')]
        input_text = 'test highlights, HO, RAD5, RAD5p DUR1,2 ONION'
        expected_output = 'test highlights, <a href="/locus/S000002386">HO</a>, <a href="/locus/S000004022">RAD5</a>, <a href="/locus/S000004022">RAD5p</a> <a href="/locus/S000000412">DUR1,2</a> ONION'
        output = link_gene_names(input_text, locus_names_ids)
        self.assertEqual(expected_output, output)
