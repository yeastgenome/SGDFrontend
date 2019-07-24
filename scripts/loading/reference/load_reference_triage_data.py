import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Locusdbentity, Referencedeleted, \
                   Literatureannotation, CurationReference, Source, Taxonomy 
sys.path.insert(0, '../')
from database_session import get_nex_session
from .promote_reference_triage_from_file import add_paper

__author__ = 'sweng66'

taxon = "TAX:4932"
reason_deleted = "Deleted via triage."

def load_references(infile, logfile):
 
    nex_session = get_nex_session()
    
    name_to_locus_id = {}
    for x in nex_session.query(Locusdbentity).all():
        name_to_locus_id[x.systematic_name] = x.dbentity_id
        if x.gene_name:
            name_to_locus_id[x.gene_name] = x.dbentity_id

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id
    
    tax = nex_session.query(Taxonomy).filter_by(taxid=taxon).one_or_none()
    taxonomy_id = tax.taxonomy_id

    fw = open(logfile, "w")

    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])

    load_papers(fw, infile, pmid_to_reference_id)

    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    pmid_to_refdeleted_id = dict([(x.pmid, x.referencedeleted_id) for x in nex_session.query(Referencedeleted).all()])

    key_in_annotation = {}
    key_in_curation = {}
    for x in nex_session.query(Literatureannotation).all():
        dbentity_id = None
        if x.dbentity_id:
            dbentity_id = x.dbentity_id
        key_in_annotation[(x.reference_id, dbentity_id, x.topic)] = 1
        
    for x in nex_session.query(CurationReference).all():
        locus_id = None
        if x.locus_id:
            locus_id = x.locus_id
            key_in_curation[(x.reference_id, locus_id, x.curation_tag)] = 1 

    f = open(infile)
    
    header = []

    for line in f:

        line = line.replace("Homology Disease", "Homology/Disease")

        pieces = line.strip().split("\t")
        
        if pieces[0] in ['PMID', 'pmid', 'pubmed', '']:
            header = pieces
            continue

        pmid = int(pieces[0])
        created_by = pieces[1]
        date_created = pieces[15]

        if pieces[2] == '1':
            # add to DB only - reference has been loaded so skip this one
            print("Add to DB only: ", pieces[0])
            continue
        if pieces[3] == '1':
            print("Discard this paper")
            if pmid in pmid_to_refdeleted_id:
                print("The row for PMID: ", pmid, " is in the REFERENCEDELETED table.")
                continue
            insert_referencedeleted(nex_session, fw, pmid, created_by, date_created)
            continue
    
        reference_id = pmid_to_reference_id.get(pmid)
        if reference_id is None:
            print("The pmid: ", pmid, " is not in the database.")
            continue
        
        # curation tags
        for i in [4, 5, 7, 8, 9, 13, 14]:
            # if len(pieces) <= i:
            #    continue
            if pieces[i] != "":
                curation_tag = header[i].strip()
                if pieces[i] == '1':
                    locus_id = None
                    if (reference_id, locus_id, curation_tag) in key_in_curation:
                        print("The row for ", (reference_id, locus_id, curation_tag), " is already in the CURATION_REFERENCE table.")
                        continue
                    insert_curation_reference(nex_session, fw, reference_id, 
                                              locus_id, curation_tag, created_by, 
                                              date_created, source_id)
                    key_in_curation[(reference_id, locus_id, curation_tag)] = 1
                else:
                    names = pieces[i].strip().split(" ")
                    for name in names:
                        name = name.strip()
                        locus_id = name_to_locus_id.get(name)
                        if locus_id is None:
                            print("The gene name: ", name, " is not in the database.")
                            continue

                        if (reference_id, locus_id, curation_tag) in key_in_curation:
                            print("The row for ", (reference_id, locus_id, curation_tag), " is already in the CURATION_REFERENCE table.")
                            continue
                        insert_curation_reference(nex_session, fw, reference_id, 
                                                  locus_id, curation_tag, 
                                                  created_by, date_created, source_id)
                        key_in_curation[(reference_id, locus_id, curation_tag)] = 1
        # literature topics
        for i in [6, 7, 8, 9, 10, 11, 12]:
            # if len(pieces) <= i:
            #    continue
            if pieces[i] != "":
                topic = header[i].strip()
                if i in [7, 8, 9]:
                    topic = "Primary Literature"
                if pieces[i] == '1' or topic == 'Omics':
                    locus_id = None
                    if (reference_id, locus_id, topic) in key_in_annotation:
                        print("The row for ", (reference_id, locus_id, topic), " is already in the LITERATUREANNOTATION table.")
                        continue
                    insert_literatureannotation(nex_session, fw, reference_id, 
                                                taxonomy_id, locus_id, topic, 
                                                created_by, date_created, 
                                                source_id) 
                    key_in_annotation[(reference_id, locus_id, topic)] = 1
                else:
                    names = pieces[i].strip().split(" ")
                    for name in names:
                        name = name.strip()
                        locus_id = name_to_locus_id.get(name)
                        if locus_id is None:
                            print("The gene name: ", name, " is not in the database.")
                            continue
                        if (reference_id, locus_id, topic) in key_in_annotation:
                            print("The row for ", (reference_id, locus_id, topic), " is already in the LITERATUREANNOTATION table.")
                            continue
                        insert_literatureannotation(nex_session, fw, reference_id,
                                                    taxonomy_id, locus_id, topic,
                                                    created_by, date_created, 
                                                    source_id)
                        key_in_annotation[(reference_id, locus_id, topic)] = 1

    # nex_session.rollback()
    nex_session.commit()
    
    fw.close()
    f.close()


def load_papers(fw, infile, pmid_to_reference_id):

    f = open(infile)

    just_loaded = {}
    for line in f:

        pieces = line.strip().split("\t")
        
        if pieces[0] in ['PMID', 'pmid', 'pubmed', '']:
            continue

        if pieces[3] == '1':
            continue

        pmid = int(pieces[0])
        created_by = pieces[1]
        date_created = pieces[15]
        
        if pmid in pmid_to_reference_id:
            continue
        if pmid in just_loaded:
            continue
         
        print("Adding paper for pmid: ", pmid)

        add_paper(pmid, created_by, date_created)

        fw.write("Add paper for pmid: " + str(pmid) + "\n")

        just_loaded[pmid] =1 

    f.close()

def insert_literatureannotation(nex_session, fw, reference_id, taxonomy_id, locus_id, topic, created_by, date_created,source_id):

    print("NEW Literatureannotation:", reference_id, taxonomy_id, locus_id, topic, created_by, date_created, source_id)
    
    x = None
    if locus_id is None:
        x = Literatureannotation(source_id = source_id,
                                 taxonomy_id = taxonomy_id,
                                 reference_id = reference_id,
                                 topic = topic,
                                 date_created = date_created,
                                 created_by = created_by)
    else:
        x = Literatureannotation(dbentity_id = locus_id,
                                 source_id = source_id,
                                 taxonomy_id = taxonomy_id,
                                 reference_id =reference_id,
                                 topic = topic,
                                 date_created = date_created,
                                 created_by = created_by)
    nex_session.add(x)

    fw.write("Insert a new literature row for reference_id = " + str(reference_id) + ", dbentity_id = " + str(locus_id) + ", topic = " + topic + "\n")

def insert_curation_reference(nex_session, fw, reference_id, locus_id, curation_tag, created_by, date_created, source_id):

    print("NEW curation_reference:", reference_id, locus_id, curation_tag, created_by, date_created, source_id)

    x = None
    if locus_id is None:
        x = CurationReference(reference_id = reference_id, 
                              source_id = source_id,
                              curation_tag = curation_tag,
                              date_created = date_created,
                              created_by = created_by)
    else:
        x = CurationReference(reference_id = reference_id,
                              locus_id = locus_id,
                              source_id= source_id,
                              curation_tag = curation_tag,
                              date_created = date_created,
                              created_by = created_by)
    nex_session.add(x)
    
    fw.write("Insert a new curation_reference row for reference_id = " + str(reference_id) + ", locus_id = " + str(locus_id) + ", curation_tag = " + curation_tag + "\n")


def insert_referencedeleted(nex_session, fw, pmid, created_by, date_created):

    print("NEW referencedeleted: ", pmid, created_by, date_created)

    x = Referencedeleted(pmid = pmid,
                         reason_deleted = reason_deleted,
                         date_created = date_created,
                         created_by = created_by)
    nex_session.add(x)

    fw.write("Insert " + str(pmid) + " into referencedeleted.\n")
    

if __name__ == '__main__':

    infile = None
    if len(sys.argv) >= 2:
         infile = sys.argv[1]
    else:
        print("Usage:         python load_reference_triage_data.py triage_file")
        print("Usage example: python load_reference_triage_data.py data/frozenTriage4Shuai011717.txt")
        exit()
    
    logfile = "logs/" + infile.split('/')[1].replace(".txt", ".log")
    
    load_references(infile, logfile)



