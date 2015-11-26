from flask_restful import Resource, abort
from models.locus import Locus as Locus_

class Locus(Resource):
    def get(self, id):
        locus = Locus_.query.filter_by(systematic_name=id).first()
        if locus:
            return locus.to_dict()
        else:
            abort(404, message="Locus {} doesn't exist.".format(id))
