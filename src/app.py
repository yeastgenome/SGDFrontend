from flask import Flask
from flask_restful import Api
from flask.ext.sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config.from_pyfile('config.py')

api = Api(app)
db = SQLAlchemy(app)

from resources.locus import Locus

api.add_resource(Locus, '/locus', '/locus/<string:id>')

if __name__ == '__main__':
    app.run(debug=True)
