import urllib.request, urllib.parse, urllib.error
import gzip
import shutil
import logging
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Taxonomy, Source, Efo, Eco, Chebi, Go, Locusdbentity, Referencedbentity, \
                       Proteinabundanceannotation
from scripts.loading.database_session import get_session
from scripts.loading.util import get_strain_taxid_mapping

# from src.helpers import upload_file

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

CREATED_BY = os.environ['DEFAULT_USER']

datafile = "scripts/loading/protein/data/proteinAbundanceData-29361465.txt"
logfile = "scripts/loading/protein/logs/load_abundance_data-29361465.log"
PMID = 29361465

def load_data():

    nex_session = get_session()

    sgd = nex_session.query(Source).filter_by(display_name='SGD').one_or_none()
    source_id = sgd.source_id
    name_to_dbentity_id = dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    ecoid_to_eco_id = dict([(x.ecoid, x.eco_id) for x in nex_session.query(Eco).all()])
    efoid_to_efo_id = dict([(x.efoid, x.efo_id) for x in nex_session.query(Efo).all()])
    chebiid_to_chebi_id = dict([(x.chebiid, x.chebi_id) for x in nex_session.query(Chebi).all()])
    goid_to_go_id = dict([(x.goid, x.go_id) for x in nex_session.query(Go).all()])
    taxid_to_taxonomy_id =  dict([(x.taxid, x.taxonomy_id) for x in nex_session.query(Taxonomy).all()])
    strain_to_taxid_mapping = get_strain_taxid_mapping()
    reference_id = pmid_to_reference_id.get(PMID)
    if reference_id is None:
        print("The PMID:", PMID, " is not in the database.")
        return

    log.info("Start loading:\n") 
    log.info(str(datetime.now()) + "\n")

    fw = open(logfile, "w")
    f = open(datafile)

    i = 0

    for line in f:
        if line.startswith("SYSTEMATIC_NMAE"):
            continue
        pieces = line.strip().replace("None", "").split("\t")
        dbentity_id = name_to_dbentity_id.get(pieces[0])
        if dbentity_id is None:
            print("The ORF name is not in the Locusdbentity table:", pieces[0])
            continue
        original_reference_id = pmid_to_reference_id.get(int(pieces[2]))
        data_value = int(pieces[3])
        eco_id = ecoid_to_eco_id.get(pieces[4])
        if eco_id is None:
            print("The ECOID:", pieces[4], " is not in the database.")
            continue
        efo_id = efoid_to_efo_id.get(pieces[5])
        if efo_id is None:
            print("The EFOID:", pieces[5], " is not in the database.")
            continue
        taxid = strain_to_taxid_mapping.get(pieces[6])
        if taxid is None:
            print("The strain:", pieces[6], " is not in the mapping list.")
            continue
        taxonomy_id = taxid_to_taxonomy_id.get(taxid)
        if taxonomy_id is None:
            print("The TAXID:", taxid, " is not in the database.")
            continue
        chebi_id = None
        go_id = None
        time_value = None
        time_unit = None
        conc_value = None
        conc_unit = None
        fold_change = None
        median = None
        mad = None
        if len(pieces) >= 8:
            if pieces[7]:
                chebi_id = chebiid_to_chebi_id.get(pieces[7])
                if chebi_id is None:
                    print("The chebiid:", pieces[7], " is not in the database.")
                    continue
            if pieces[8]:
                go_id = goid_to_go_id.get(pieces[8])
                if go_id is None:
                    print("The goid:", pieces[8], " is not in the database.")
                    continue
            if pieces[9]:
                time_value = int(pieces[9])
            if pieces[10]:
                time_unit = pieces[10]
                if time_unit.startswith('hour'):
                    time_unit = 'hr'
                if time_unit.startswith('day'):
                    time_unit = 'd'
                if time_unit.startswith('min'):
                    time_unit = 'min'
            if pieces[11]:
                conc_value = float(pieces[11])
                conc_unit = pieces[12]
            if pieces[13]:
                fold_change = float(pieces[13])
            if pieces[14]:
                median = int(pieces[14])
            if pieces[15]:
                mad = int(pieces[15])

        insert_proteinabundanceannotation(nex_session, fw, dbentity_id, source_id, taxonomy_id,
                                          reference_id, original_reference_id, eco_id, efo_id, 
                                          chebi_id, go_id, data_value, fold_change, time_value,
                                          time_unit, conc_value, conc_unit, median, mad)

        i = i + 1
        if i > 500:
            # nex_session.rollback()
            nex_session.commit()  
            i = 0

    f.close()

    # nex_session.rollback()
    nex_session.commit()
    nex_session.close()

    log.info("Done loading\n")
    log.info(str(datetime.now()) + "\n")
    

def insert_proteinabundanceannotation(nex_session, fw, dbentity_id, source_id, taxonomy_id, reference_id, original_reference_id, eco_id, efo_id, chebi_id, go_id, data_value, fold_change, time_value, time_unit, conc_value, conc_unit, median, mad):

    x = Proteinabundanceannotation(dbentity_id = dbentity_id,
                                   source_id = source_id,
                                   taxonomy_id = taxonomy_id,
                                   reference_id = reference_id,
                                   original_reference_id = original_reference_id,
                                   assay_id = eco_id,
                                   media_id = efo_id,
                                   data_value = data_value,
                                   data_unit = "molecules/cell",
                                   fold_change = fold_change,
                                   chemical_id = chebi_id,
                                   process_id = go_id,
                                   concentration_value = conc_value,
                                   concentration_unit = conc_unit,
                                   time_value = time_value,
                                   time_unit = time_unit,
                                   median_value = median,
                                   median_abs_dev_value = mad,
                                   created_by = CREATED_BY)

    nex_session.add(x)
    
    fw.write("Insert new row for dbentity_id = " + str(dbentity_id) + ", original_reference_id " + str(original_reference_id) + ", aasay_id = " + str(eco_id) + ", media_id = " + str(efo_id) + ", chemical_id = " + str(chebi_id) + ", process_id = " + str(go_id) + "\n")

if __name__ == "__main__":
        
    load_data()


    
        
