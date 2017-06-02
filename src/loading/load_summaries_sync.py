from datetime import datetime
import json
import logging
import csv
import sys
import transaction
import os
from sqlalchemy import create_engine, and_
from src.models import DBSession, Locussummary, LocussummaryReference, Locusdbentity, Referencedbentity, Source
from src.helpers import link_gene_names
                             
__author__ = 'tshepp'

'''
* validate file
* Read in the summary text for each gene from the upload file and compare the 
  text with the info in the memory.
  * The summary for this gene for the given type (eg, Regulation or Phenotype) 
    is not in the database,
       * insert the summay text into the LOCUSSUMMARY table
       * insert any associated reference(s) into LOCUSSUMMARY_REFERENCE table 
         (eg, for regulation summaries)
  * The summary for this gene for the given type is in the database.
       * if the summary text is updated, update the LOCUSSUMMARY.text/html; 
         otherwise noneed todo anything to theLOCUSSUMMARY table
       * check to see if there is any referenceupdate, if yes, updatethe 
         LOCUSSUMMARY_REFERENCE table
'''
PREVIEW_HOST = 'https://curate.qa.yeastgenome.org'
SGD_SOURCE_ID = 834
logger = logging.getLogger(__name__)
logger.setLevel(level=logging.INFO)
# has correct columns in header
# checks IDs to make sure real IDs
def validate_file_content(file_content, nex_session, username):
    header_literal = ['# Feature', 'Summary Type (phenotype, regulation, protein, or sequence)', 'Summary', 'PMIDs']
    accepted_summary_types = ['Gene', 'Phenotype', 'Regulation']
    file_gene_ids = []
    file_pmids = []
    copied = []
    for i, val in enumerate(file_content):
        # match header
        if i is 0:
            is_header_match = header_literal == val
            if not is_header_match:
                raise ValueError('File header does not match expected format.') 
        else:
            file_gene_ids.append(val[0])
            # match summary types
            if val[1] not in accepted_summary_types:
                raise ValueError('Unaccepted summary type. Must be one of ' + str(accepted_summary_types))
            # collect PMIDs
            pmids = val[3].replace(' ', '')
            if len(pmids):
                pmids = pmids.split(',')
                for d in pmids:
                    file_pmids.append(str(d)) 
        # match length of each row
        if len(val) != len(header_literal):
            raise ValueError('Row has incorrect number of columns.')
        copied.append(val)
    # check that gene names are valid
    matching_genes = nex_session.query(Locusdbentity).filter(Locusdbentity.format_name.in_(file_gene_ids)).count()
    is_correct_gene_match_num = matching_genes == len(file_gene_ids)
    if not is_correct_gene_match_num:
        raise ValueError('Invalid gene identifier in ', str(file_gene_ids))
    # must be valid PMIDs in last column or nothing
    matching_refs = nex_session.query(Referencedbentity).filter(Referencedbentity.pmid.in_(file_pmids)).all()
    is_correct_ref_match_num = len(matching_refs) == len(file_pmids)
    if not is_correct_ref_match_num:
        raise ValueError('PMIDs must be a comma-separated list of valid PMIDs from SGD.')

    # update
    receipt_object = []
    locus_names_ids = nex_session.query(Locusdbentity.display_name, Locusdbentity.sgdid).all()
    for i, val in enumerate(copied):
        if i != 0:
            file_id = val[0]
            file_summary_type = val[1]
            file_summary_val = val[2]
            file_summy_html = link_gene_names(file_summary_val, locus_names_ids)
            gene = nex_session.query(Locusdbentity).filter(Locusdbentity.format_name.match(file_id)).all()[0]
            summaries = nex_session.query(Locussummary.summary_type, Locussummary.summary_id, Locussummary.html, Locussummary.date_created).filter_by(locus_id=gene.dbentity_id, summary_type=file_summary_type).all()
            # update
            summary = None
            if len(summaries):
                summary = summaries[0]
                nex_session.query(Locussummary).filter_by(summary_id=summary.summary_id).update({ 'text': file_summary_val, 'html': file_summy_html })
            else:
                new_summary = Locussummary(
                    locus_id = gene.dbentity_id, 
                    summary_type = file_summary_type, 
                    text = file_summary_val, 
                    html = file_summy_html, 
                    created_by = username,
                    source_id = SGD_SOURCE_ID
                )
                nex_session.add(new_summary)
            summary = nex_session.query(Locussummary.summary_type, Locussummary.summary_id, Locussummary.html, Locussummary.date_created).filter_by(locus_id=gene.dbentity_id, summary_type=file_summary_type).all()[0]
            # add LocussummaryReference(s)
            pmids = val[3].replace(' ', '')
            if len(pmids):
                pmids = pmids.split(',')
                for _i, p in enumerate(pmids):
                    matching_ref = [x for x in matching_refs if x.pmid == int(p)][0]
                    summary_id = summary.summary_id
                    reference_id = matching_ref.dbentity_id
                    order = _i
                    # look for matching LocussummaryReference
                    matching_locussummary_refs = nex_session.query(LocussummaryReference).filter_by(summary_id=summary_id, reference_id=reference_id).all()
                    if len(matching_locussummary_refs):
                        nex_session.query(LocussummaryReference).filter_by(summary_id=summary_id,reference_id=reference_id).update({ 'reference_order': order })
                    else:
                        new_locussummaryref = LocussummaryReference(
                            summary_id = summary_id, 
                            reference_id = reference_id, 
                            reference_order = order, 
                            source_id = SGD_SOURCE_ID, 
                            created_by = username
                        )
                        nex_session.add(new_locussummaryref)

            # add receipt
            summary_type_url_segment = file_summary_type.lower()
            preview_url = PREVIEW_HOST + '/locus/' + gene.sgdid + '/' + summary_type_url_segment
            receipt_object.append({
                'category': 'locus', 
                'href': preview_url, 
                'name': gene.display_name, 
                'type': file_summary_type, 
                'value': file_summary_val 
            })
            transaction.commit()
    return receipt_object

def load_summaries(nex_session, file_content, username, summary_type=None):
    annotation_summary = validate_file_content(file_content, nex_session, username)
    return annotation_summary

if __name__ == '__main__':
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)
    with open('test/example_files/example_summary_upload.tsv') as tsvfile:
        tsvreader = csv.reader(tsvfile, delimiter="\t")
        load_summaries(DBSession, tsvreader, 'USER')
