from flask_restful import Resource

class Locus(Resource):
    def get(self, id):
        return id
