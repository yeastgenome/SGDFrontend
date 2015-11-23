from flask import Flask
from flask_restful import Api
from resources.locus import Locus
from sqlalchemy import create_engine

app = Flask(__name__)
api = Api(app)

api.add_resource(Locus, '/locus', '/locus/<string:id>')

if __name__ == '__main__':
    app.run(debug=True)
