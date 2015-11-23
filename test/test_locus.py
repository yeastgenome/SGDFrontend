from src.app import app
from responses.locus import locus
import json

class TestLocus:
    def setUp(self):
        self.app = app.test_client()
        self.locus_233 = locus

    def test_invalid_locus(self):
        assert self.app.get('/locus/').status_code == 404

    def test_valid_locus(self):
        assert self.app.get('/locus/233').status_code == 200
        assert self.app.get('/locus/233').data == self.locus_233
