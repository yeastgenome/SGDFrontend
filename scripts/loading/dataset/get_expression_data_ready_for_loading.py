import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Locusdbentity, Referencedbentity, Datasetsample, Taxonomy, Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

infile = "data/expression_annotation.data"
outfile = "data/expression_annotation_ready_to_load.txt"

def get_data():

    nex_session = get_session()

    format_name_to_datasetsample_id = dict([(x.format_name, x.datasetsample_id) for x in nex_session.query(Datasetsample).all()])
    systematic_name_to_dbentity_id = dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    tax = nex_session.query(Taxonomy).filter_by(taxid="TAX:4932").one_or_none()
    taxonomy_id = tax.taxonomy_id
    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id
            
    fw = open(outfile, "w")
    fw.write("dbentity_id\tsource_id\ttaxonomy_id\treference_id\tdatasetsample_id\tnormalized_expression_value\tlog_ratio_value\n")

    f = open(infile)
    seen = {}
    for line in f:
        pieces = line.strip().split("\t")
        reference_id = pmid_to_reference_id.get(int(pieces[0]))
        if reference_id is None:
            print("The pmid: ", pieces[0], " is not in the database.")
            continue
        dbentity_id = systematic_name_to_dbentity_id.get(pieces[6])
        if dbentity_id is None:
            print("The feature_name: ", pieces[6], " is not in the database.")
            continue
        datasetsample_id = format_name_to_datasetsample_id.get(pieces[1])
        if datasetsample_id is None:
            print("The datasetsample format_name: ", pieces[1], " is not in the database.")
            continue
        key = (dbentity_id, datasetsample_id)
        if key in seen:
            continue
        seen[key] = 1
        fw.write(str(dbentity_id)+"\t"+str(source_id)+"\t"+str(taxonomy_id)+"\t"+str(reference_id)+"\t"+str(datasetsample_id)+"\t"+pieces[4]+"\t"+pieces[5]+"\n")

    f.close()
    fw.close()

if __name__ == '__main__':

    get_data()

