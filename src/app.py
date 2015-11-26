from flask import Flask
from flask_restful import Api
from common.db_conn import db
from resources.locus import Locus
from gevent.wsgi import WSGIServer

import os

app = Flask(__name__)
app.config.from_pyfile('../config/config.py')

api = Api(app)

db.init_app(app)

api.add_resource(Locus, '/locus', '/locus/<string:id>')

if __name__ == '__main__':
    if os.environ.get('ENV', False) == 'prod':
        app.debug = False
        http_server = WSGIServer(('', 5000), app)
        http_server.serve_forever()
    else:
        app.run(port=5000, debug=True)
                
