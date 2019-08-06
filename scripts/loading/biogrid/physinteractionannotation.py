import urllib.request, urllib.parse, urllib.error
import logging
import os
from datetime import datetime
import sys
import importlib
from src.models import Locusdbentity, Referencedbentity, Source, Taxonomy, \
                       Psimod, Physinteractionannotation
from scripts.loading.reference.promote_reference_triage import add_paper
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

CREATED_BY = os.environ['DEFAULT_USER']

TAXON_ID = "TAX:4932"

def load_data(infile, logfile):

    nex_session = get_session()

    taxonomy =  nex_session.query(Taxonomy).filter_by(taxid=TAXON_ID).one_or_none()
    taxonomy_id = taxonomy.taxonomy_id
    
    src = nex_session.query(Source).filter_by(display_name='BioGRID').one_or_none()
    source_id = src.source_id
    
    sgdid_to_dbentity_id = dict([(x.sgdid, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])

    key_to_interaction = dict([((x.dbentity1_id, x.dbentity2_id, x.bait_hit, x.biogrid_experimental_system, x.annotation_type, x.reference_id, x.psimod_id), x) for x in nex_session.query(Physinteractionannotation).all()])

    psimodid_to_psimod_id = dict([(x.psimodid, x.psimod_id) for x in nex_session.query(Psimod).all()])

    log.info(str(datetime.now()))

    f = open("scripts/loading/biogrid/data/PSI-MOD2SGD-PTMmapping112115.txt")
    modification_to_psimod_id = {}
    for line in f:
        if line.startswith('BUD'):
            continue
        pieces = line.strip().split('\t')
        if len(pieces) < 5:
            continue
        if pieces[0] == '':
            continue
        psimodid = pieces[4]
        psimod_id = psimodid_to_psimod_id.get(psimodid)
        modification_to_psimod_id[pieces[0]] = psimod_id

    f.close()
    
    genetic_types = get_genetic_type_list()

    fw = open(logfile, "w")    
    f = open(infile)
    
    count = 0
    key_existed = {}
    paper_added = {}
    for line in f:
        row = line.strip().split('\t')
        if len(row) == 12 and row[4] and row[4] in genetic_types:
            # it is a genetic interaction                                                                 
            continue
        if len(row) == 12:
            if line.startswith('>>>'):
                continue
            else:
                reference_id = pmid_to_reference_id.get(int(row[6]))
                if reference_id is None:
                    reference_id = paper_added.get(int(row[6]))
                if reference_id is None:
                    log.info("The PMID: " + row[6] + " is not in the REFERENCEDBENTITY table.")
                    # continue
                    # fw.write("The PMID: " + row[6] + " is not in the REFERENCEDBENTITY table. Adding the paper now.\n")
                    (reference_id, sgdid) = add_paper(int(row[6]), CREATED_BY)
                    if reference_id is None:
                        log.info("It is an obsolete PMID: " + row[6] + "?");
                        continue
                    else:
                        paper_added[int(row[6])] = reference_id 
                dbentity1_id = sgdid_to_dbentity_id.get(row[2])
                dbentity2_id = sgdid_to_dbentity_id.get(row[3])
                if dbentity1_id is None:
                    log.info("The SGDID: " + row[2] + " is not in LOCUSDBENTITY table.")
                    continue
                if dbentity2_id is None:
                    log.info("The SGDID: " + row[3] + " is not in LOCUSDBENTITY table.")
                    continue

                annotation_types = []
                if row[9] == 'HTP':
                    annotation_types.append('high-throughput')
                elif row[9] == 'HTP|LTP' or row[9] == 'LTP|HTP':
                    annotation_types.append('high-throughput')
                    annotation_types.append('manually curated')
                else:
                    annotation_types.append('manually curated')
                
                biogrid_experimental_system = row[4]

                psimod_id = None
                if row[8] != '-' and row[8] != 'No Modification':
                    psimod_term = row[8]
                    if psimod_term == 'Proteolytic Processing':
                        psimod_term = 'Proteolytic processing'
                    psimod_id = modification_to_psimod_id.get(psimod_term)
                    if psimod_id is None:
                        log.info("The modification term: " + psimod_term + " is not in PSIMOD table.")
                        continue
                    # print "MODIFICATION=", row[8], ", PSIMOD_ID=", psimod_id
                # row[11] = vegetative growth                                                             

                id1 = int(row[2].lstrip("S").lstrip("0"))
                id2 = int(row[3].lstrip("S").lstrip("0"))
                bait_hit = 'Bait-Hit'
                if id1 >= id2:
                    (dbentity1_id, dbentity2_id) = (dbentity2_id, dbentity1_id)
                    bait_hit = 'Hit-Bait'

                # row[10] = High Throughput: SGA analysis|Low Throughput: Interaction confirmed by random sporulation.       
                description = None
                if row[10] != '-':
                    description = row[10]

                for annotation_type in annotation_types:
                    key = (dbentity1_id, dbentity2_id, bait_hit, biogrid_experimental_system, annotation_type, reference_id, psimod_id)


                    print("KEY=", key)


                
                    if key in key_to_interaction:
                        # x = key_to_interaction[key]
                        key_existed[key] = 1
                        # if description is not None and description != x.description:
                        #    x.description = description
                        #    fw.write("Update DESCRITION for key = " + str(key) + "\n")    
                        #    count = count + 1
                        #    nex_session.add(x)
                    else:

                        print("NEW")


                        insert_interaction(nex_session, fw, source_id, taxonomy_id, reference_id, 
                                           biogrid_experimental_system, annotation_type, dbentity1_id, 
                                           dbentity2_id, bait_hit, psimod_id, description)
                        count = count + 1

                if count > 500:
                    # nex_session.rollback()
                    nex_session.commit()
                    count = 0

    for key in key_to_interaction:
        if key not in key_existed:
            fw.write("Delete row for key = " + str(key) + "\n")
            x = key_to_interaction[key]
            nex_session.delete(x)

    # nex_session.rollback()
    nex_session.commit()

    fw.close()
    f.close()

    log.info(str(datetime.now()))

    log.info("Done!\n\n")


def insert_interaction(nex_session, fw, source_id, taxonomy_id, reference_id, biogrid_experimental_system, annotation_type, dbentity1_id, dbentity2_id, bait_hit, psimod_id, description):
    
    x = Physinteractionannotation(source_id = source_id,
                                  taxonomy_id = taxonomy_id,
                                  reference_id = reference_id,
                                  biogrid_experimental_system = biogrid_experimental_system,
                                  annotation_type = annotation_type,
                                  dbentity1_id = dbentity1_id,
                                  dbentity2_id = dbentity2_id,
                                  bait_hit = bait_hit,
                                  psimod_id = psimod_id,
                                  description = description,
                                  created_by = CREATED_BY)
    nex_session.add(x)

    fw.write("Insert row for dbentity1_id = " + str(dbentity1_id) + ", dbentity2_id = " + str(dbentity2_id) + ", reference_id = " + str(reference_id) + ", bait_hit = " + bait_hit + ", biogrid_experimental_system = " + biogrid_experimental_system + "\n")
           

def get_genetic_type_list():

    return ['Dosage Lethality',
            'Dosage Rescue',
            'Dosage Growth Defect',
            'Epistatic MiniArray Profile',
            'Negative Genetic',
            'Positive Genetic',
            'Phenotypic Enhancement',
            'Phenotypic Suppression',
            'Synthetic Growth Defect',
            'Synthetic Haploinsufficiency',
            'Synthetic Lethality',
            'Synthetic Rescue']


if __name__ == '__main__':

    # https://www.thebiogrid.org/downloads/datasets/SGD.tab.txt

    url_path = 'https://www.thebiogrid.org/downloads/datasets/'
    infile = 'SGD.tab.txt'

    urllib.request.urlretrieve(url_path + infile, infile)
            
    logfile = "scripts/loading/biogrid/logs/physinteractionannotation.log"
    
    load_data(infile, logfile)
                                                  
