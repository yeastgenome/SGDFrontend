import csv
import os
import logging
from src.models import DBSession, Dbentity, Disease, Diseaseannotation, Diseasesupportingevidence, EcoAlias, Ro, Referencedbentity, Source, Taxonomy
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker, scoped_session
from scripts.loading.reference.promote_reference_triage import add_paper
from zope.sqlalchemy import ZopeTransactionExtension

import transaction
import traceback
import sys

'''
    Process a TSV file of disease annotation
    example
        $ source dev_variables.sh && CREATED_BY=STACIA INPUT_FILE_NAME=/data/nex2/disease_associationSGD1.0.1.txt  python scripts/loading/disease/load_disease_data.py
'''

INPUT_FILE_NAME = os.environ.get('INPUT_FILE_NAME')
NEX2_URI = os.environ.get('NEX2_URI')
CREATED_BY = os.environ.get('CREATED_BY')
ANNOTATION_TYPE = 'manually curated'
GROUP_ID = 1
OBJ_URL = 'http://www.alliancegenome.org/gene/'
EVIDENCE_TYPE = 'with'

logging.basicConfig(level=logging.INFO)

# temp_engine = create_engine(NEX2_URI)
# session_factory = sessionmaker(bind=temp_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
# db_session = scoped_session(session_factory)

def upload_db(obj, row_num):

    try:
        temp_engine = create_engine(NEX2_URI)
        session_factory = sessionmaker(bind=temp_engine, extension=ZopeTransactionExtension(), expire_on_commit=False)
        db_session = scoped_session(session_factory)
        disease_id = db_session.query(Disease.disease_id).filter(Disease.doid == obj['doid']).one_or_none()[0]
        if disease_id:
            try:
                tax_id = db_session.query(Taxonomy.taxonomy_id).filter(Taxonomy.taxid==obj['taxon']).one_or_none()[0]
                ref_id = db_session.query(Referencedbentity.dbentity_id).filter(Referencedbentity.pmid == obj['pmid']).one_or_none()
                if ref_id is None:
                    ref = add_paper(obj['pmid'], CREATED_BY)
                    ref_id = ref[0]
                    logging.info('PMID added' + ref_id)
                ro_id = db_session.query(Ro.ro_id).filter(Ro.display_name == obj['association']).one_or_none()[0]
                dbentity_id = db_session.query(Dbentity.dbentity_id).filter(Dbentity.sgdid == obj['sgdid']).one_or_none()[0]
                source_id = db_session.query(Source.source_id).filter(Source.display_name == obj['source']).one_or_none()[0]
            except TypeError:
                logging.error('invalid ids ' + str(row_num) +  ' ' + str(disease_id) + ' ' + str(tax_id) + '  '+ str(ref_id) +'  '+ str(dbentity_id))
                return
            if len(obj['evidence_codes']):
                codes = obj['evidence_codes'].split(',')
                for code in codes:
                    code = code.strip()
                    eco_id = db_session.query(EcoAlias.eco_id).filter(EcoAlias.display_name == code).one_or_none()[0]
                    annotation_id = db_session.query(Diseaseannotation.annotation_id).filter(and_(Diseaseannotation.disease_id == disease_id,
                                                                                                  Diseaseannotation.eco_id == eco_id, Diseaseannotation.reference_id == ref_id,
                                                                                                  Diseaseannotation.dbentity_id == dbentity_id)).one_or_none()
                    if eco_id:
                        if not annotation_id :
                            new_daf_row = Diseaseannotation(
                                dbentity_id=dbentity_id,
                                source_id=source_id,
                                taxonomy_id=tax_id,
                                reference_id=ref_id,
                                disease_id=disease_id,
                                eco_id=eco_id,
                                annotation_type=ANNOTATION_TYPE,
                                association_type=ro_id,
                                created_by=CREATED_BY,
                                date_assigned=obj['date_assigned']
                            )
                            db_session.add(new_daf_row)
                            transaction.commit()
                            db_session.flush()
                            annotation_id = new_daf_row.annotation_id
                        else:
                            annotation_id = annotation_id

                        daf_evidence_row = Diseasesupportingevidence(
                            annotation_id=annotation_id,
                            group_id = GROUP_ID,
                            dbxref_id=obj['hgnc'],
                            obj_url=OBJ_URL+obj['hgnc'],
                            evidence_type = 'with',
                            created_by=CREATED_BY
                        )
                    db_session.add(daf_evidence_row)
                    transaction.commit()
                    db_session.flush()
        logging.info('finished ' + obj['sgdid'] + ', line ' + str(row_num))
    except:
        logging.error('error with ' + obj['sgdid']+ ' in row ' + str(row_num) + ' ' +obj['doid'] + ' ' + obj['pmid'] )
        traceback.print_exc()
        db_session.rollback()
        db_session.close()
        sys.exit()

def load_csv_disease_dbentities():
    engine = create_engine(NEX2_URI, pool_recycle=3600)
    DBSession.configure(bind=engine)

    o = open(INPUT_FILE_NAME,'rU')
    reader = csv.reader(o, delimiter='\t')
    for i, val in enumerate(reader):
        if i > 0:
            if val[0] == '':
                logging.info('Found a blank value, DONE!')
                return
            obj = {
                'taxon': val[0].strip().replace("taxon:","TAX:"),
                'sgdid': val[2].strip().replace("SGD:", ""),
                'symbol': val[3].strip(),
                'association': val[8].strip(),
                'doid': val[10].strip(),
                'hgnc': val[11].strip(),
                'evidence_codes': val[16],
                'pmid': val[18].strip().replace("PMID:", ""),
                'date_assigned': val[19].strip(),
                'source': val[20]
            }
            upload_db(obj, i)

if __name__ == '__main__':
    load_csv_disease_dbentities()
