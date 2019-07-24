import logging
import os
from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
from src.models import Locusdbentity, Referencedbentity, Dbentity, Reservedname, LocusReferences, ArchLocuschange
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

# CREATED_BY = os.environ['DEFAULT_USER']

def standardize_name(infile, logfile):

    nex_session = get_session()

    name_to_locus = dict([(x.systematic_name, (x.dbentity_id, x.gene_name, x.name_description)) for x in nex_session.query(Locusdbentity).all()])
    id_to_reference = dict([(x.dbentity_id, (x.citation, x.pmid)) for x in nex_session.query(Referencedbentity).all()])

    locus_id_to_reference_list = {}
    for x in nex_session.query(LocusReferences).filter(LocusReferences.reference_class.in_(['gene_name', 'name_description'])).all():
        (citation, pmid) = id_to_reference[x.reference_id]
        reference_list = []
        if x.locus_id in locus_id_to_reference_list:
            reference_list = locus_id_to_reference_list[x.locus_id]
        reference_list.append((x.reference_id, citation, pmid, x.reference_class))
        locus_id_to_reference_list[x.locus_id] = reference_list

    # log.info("Fixing...\n") 

    fw = open(logfile, "w")    
    f = open(infile)

    unique_papers = []

    for line in f:
        pieces = line.strip().split("\t")
        if pieces[0] == 'ORF':
            continue
        (locus_id, gene_name, name_desc) = name_to_locus[pieces[0]]       
        print((locus_id, gene_name, name_desc))

        reference_list = locus_id_to_reference_list.get(locus_id)
        print(pieces[0], pieces[1], pieces[2], pieces[4], reference_list)
 
        if reference_list is None:
            print("NO REF for ", pieces[0], locus_id, gene_name)
            continue

        for reference_row in reference_list:
            (reference_id, citation, pmid, reference_class) = reference_row 
            if (reference_id, citation) in unique_papers:
                continue
            print(reference_id, citation)
            unique_papers.append((reference_id, citation))

    fw.close()
    f.close()


if __name__ == '__main__':

    infile = None
    if len(sys.argv) >= 2:
         infile = sys.argv[1]
    else:
        print("Usage:         python standardizeReservedName.py datafile")
        print("Usage example: python standardizeReservedName.py scripts/loading/locus/data/reservedNames2standardize110817.txt")
        exit()
    
    logfile = "scripts/loading/locus/logs/standardizeReservedName.log"
    
    standardize_name(infile, logfile)
                                                  
