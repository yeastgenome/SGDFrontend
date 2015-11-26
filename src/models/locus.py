from common.db_conn import db

class Locus(db.Model):
    __tablename__ = "locusdbentity"

    id = db.Column('dbentity_id', db.Integer, primary_key=True)
    systematic_name = db.Column('systematic_name', db.String)
    gene_name = db.Column('gene_name', db.String)
    qualifier = db.Column('qualifier', db.String)
    genetic_position = db.Column('genetic_position', db.Integer)
    name_description = db.Column('name_description', db.String)
    headline = db.Column('headline', db.String)
    description = db.Column('description', db.String)
    has_summary = db.Column('has_summary', db.Integer)
    has_sequence = db.Column('has_sequence', db.Integer)
    has_history = db.Column('has_history', db.Integer)
    has_literature = db.Column('has_literature', db.Integer)
    has_go = db.Column('has_go', db.Integer)
    has_phenotype = db.Column('has_phenotype', db.Integer)
    has_interaction = db.Column('has_interaction', db.Integer)
    has_expression = db.Column('has_expression', db.Integer)
    has_regulation = db.Column('has_regulation', db.Integer)
    has_protein = db.Column('has_protein', db.Integer)
    has_sequence_section = db.Column('has_sequence_section', db.Integer)
    
    def __init__(self):
        pass

    def to_dict(self):
        fields = ["id", "systematic_name", "gene_name", "qualifier", "genetic_position", "name_description", "headline", "description", "has_summary", "has_sequence", "has_history", "has_literature", "has_go", "has_phenotype", "has_interaction", "has_expression", "has_regulation", "has_protein", "has_sequence_section"]
        
        obj = {}
        for f in fields:
            obj[f] = getattr(self, f)
        return obj
