import logging
import os
import sys
from src.models import Dbentity, Locusdbentity, Referencedbentity, Taxonomy, \
                       Go, EcoAlias, Source, Goannotation, Goextension, \
                       Gosupportingevidence
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

outfile = "scripts/dumping/curation/data/gene_association.sgd"

def dump_data():
 
    nex_session = get_session()

    fw = open(outfile, "w")

    log.info("Getting data from the database...")

    id_to_source = dict([(x.source_id, x.display_name) for x in nex_session.query(Source).all()])
    id_to_gene = dict([(x.dbentity_id, (x.systematic_name, x.gene_name)) for x in nex_session.query(Locusdbentity).all()])
    id_to_go = dict([(x.go_id, (x.goid, x.display_name, x.go_namespace)) for x in nex_session.query(Locusdbentity).all()])
    id_to_pmid = dict([(x.dbentity_id, x.pmid) for x in nex_session.query(Referencebentity).all()])
    id_to_sgdid = dict([(x.dbentity_id, x.sgdid) for x in nex_session.query(Dbentity)..filter_by(subclass="REFERENCE").all()])
    id_to_taxon = dict([(x.taxonomy_id, x.taxid) for x in nex_session.query(Taxonomy).all()])
    id_to_eco = dict([(x.eco_id, x.display_name) for x in nex_session.query(EcoAlias).all()])

    for x in nex_session.query(Goannotation).all():
        ## do something here

    nex_session.close()

    log.info("Done!")

    fw.close()


if __name__ == '__main__':
    
    dump_data()




