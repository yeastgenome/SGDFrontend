from common.db_conn import db
from flask_restful import Resource

class Locus(Resource):
    def get(self, id):
        return id
