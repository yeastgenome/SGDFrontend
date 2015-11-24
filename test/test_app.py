from src.app import app, db

class TestApp:
    def test_db_config(self):
        assert 'SQLALCHEMY_DATABASE_URI' in app.config
        assert app.config.get('SQLALCHEMY_TRACK_MODIFICATIONS') == False

    def test_db_is_present(self):
        assert db is not None
