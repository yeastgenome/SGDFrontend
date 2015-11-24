from flask import Flask
from flask_restful import Api
from flask.ext.sqlalchemy import SQLAlchemy

from gevent.wsgi import WSGIServer

import os

app = Flask(__name__)
app.config.from_pyfile('../config/config.py')

api = Api(app)
db = SQLAlchemy(app)

from resources.locus import Locus

api.add_resource(Locus, '/locus', '/locus/<string:id>')

if __name__ == '__main__':
	if os.environ.get('ENV', False) == 'prod':
		app.debug = False
		http_server = WSGIServer(('', 5000), app)
		http_server.serve_forever()
	else:
		app.run(debug=True)
