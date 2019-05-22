from datetime import datetime
import json
import logging
import csv
import sys
import transaction
import os
import re
from sqlalchemy import create_engine, and_, not_
from src.models import DBSession, Locussummary, LocussummaryReference,\
     Locusdbentity, Referencedbentity, Source, CuratorActivity
from src.helpers import link_gene_names, file_upload_to_dict, update_curate_activity
from src.curation_helpers import ban_from_cache

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
SGD_SOURCE_ID = 834
logger = logging.getLogger(__name__)
logger.setLevel(level=logging.INFO)

def validate_file_content_and_process(file_content, nex_session, username):
    ''' Check file content, process and save to db

    Parameters
    ----------
    file_content: csv-reader object
                  csv-reader reads a tvs file and returns an object
    nex_session: database_session object
    username: str
              authorized user to make CRUD operations

    Returns
    -------
    dictionary
        number of entries
        number of updates
        database entries(dictionary)

    Note:
    Accepted summary types: Phenotype, Regulation, Disease, Interaction
                            Sequence, Protein
    Checks correct number of columns in the header and valid IDs
    '''

    header_literal = [
                        '# Feature',
                        'Summary Type (phenotype, regulation, disease, interaction, sequence, protein )',
                        'Summary', 'PMIDs'
                    ]
    accepted_summary_types = [
        'Phenotype', 'Regulation', 'Disease',
        'Interaction', 'Sequence', 'Protein'
        ]
    file_gene_ids = []
    file_pmids = []
    copied = []
    already_used_genes = []
    clear_target_urls = []
    # use regex to get keys from dictionary
    key_feature = re.compile(r".*feature$", re.IGNORECASE)
    key_summary_type = re.compile(r"^summary type.*", re.IGNORECASE)

    # use regex to get keys from dictionary
    key_feature = re.compile(r".*feature$", re.IGNORECASE)
    key_summary_type = re.compile(r"^summary type.*", re.IGNORECASE)

    try:
        for item in file_content:
            if (len(item) != len(header_literal)):
                raise ValueError('Row or header has incorrect number of columns.')
            #TODO: abstract the loop below in the next release
            gene_id = ''
            summary_type = ''
            for k, v in item.iteritems():
                if key_feature.match(k):
                    gene_id = item.get(k)
                if key_summary_type.match(k):
                    summary_type = item.get(k)

            pmid_temp = item.get('PMIDs', None)
            if pmid_temp:
                pmids = str(pmid_temp).replace(' ', '').replace('0.0', '')
            else:
                pmids = ''
            summary_text = item.get('Summary', '')

            if gene_id:
                file_gene_ids.append(gene_id.strip()) 
            if summary_type:
                gene_id_with_summary = gene_id + summary_type
                if gene_id_with_summary in already_used_genes:
                    raise ValueError(
                        'The same gene summary cannot be updated twice in the same\
                        file: ' + str(gene_id))
                already_used_genes.append(gene_id_with_summary)
                if summary_type.lower() not in ''.join(accepted_summary_types).lower():
                    raise ValueError('Unaccepted summary type. Must be one of ' + ', '.join(accepted_summary_types))
            if len(pmids) > 0:
                pmids = re.split('\||,', pmids)
                for pmid in pmids:
                    file_pmids.append(str(pmid))

            copied.append(item)
    except IndexError:
        raise ValueError(
            'The file is not a valid TSV with the correct number of columns. Check the file and try again.'
        )

    nex_session.execute('SET LOCAL ROLE ' + username)

    # check that gene names are valid
    valid_genes = nex_session.query(Locusdbentity.format_name).filter(Locusdbentity.format_name.in_(file_gene_ids)).all()
    valid_genes = [ str(d[0]) for d in valid_genes ]
    invalid_genes = [d for d in file_gene_ids if d not in valid_genes]
    if len(invalid_genes):
        raise ValueError('Invalid gene identifier: ' + ', '.join(invalid_genes))
    # must be valid PMIDs in last column or nothing
    matching_refs = nex_session.query(Referencedbentity).filter(Referencedbentity.pmid.in_(file_pmids)).all()
    temp_matching_refs = [ str(d.pmid) for d in matching_refs ]
    invalid_refs = [d for d in file_pmids if d not in temp_matching_refs]
    if len(invalid_refs):
        # raise ValueError('Invalid PMID: ' + ', '.join(invalid_refs) + '. Must be a pipe-separated list of PMIDs from SGD.')
        print len(invalid_refs)
    # update
    receipt_entries = []
    locus_names_ids = nex_session.query(Locusdbentity.display_name, Locusdbentity.sgdid).all()
    inserts = 0
    updates = 0

    for item in copied:
        if item:
            for k, v in item.iteritems():
                if key_feature.match(k):
                    file_id = item.get(k)
                if key_summary_type.match(k):
                    file_summary_type = item.get(k)
            #file_id = item.get('# Feature', '')
            #file_summary_type = item.get(
            #      'Summary Type (phenotype, regulation)', '')
            file_summary_val = item.get('Summary', '')

            file_summary_html = link_gene_names(file_summary_val, locus_names_ids)
            if file_id:
                gene = nex_session.query(Locusdbentity).filter_by(format_name=file_id).one_or_none()
            if file_summary_type:
                summaries = nex_session.query(Locussummary.summary_type, Locussummary.summary_id, Locussummary.html, Locussummary.date_created).filter_by(locus_id=gene.dbentity_id, summary_type=file_summary_type).all()
                # update
                summary = None
                if len(summaries):
                    summary = summaries[0]
                    nex_session.query(Locussummary).filter_by(summary_id=summary.summary_id).update({'text': file_summary_val, 'html': file_summary_html})
                    updates += 1
                else:
                    mod_summary_type = file_summary_type.lower().capitalize()
                    new_summary = Locussummary(
                        locus_id=gene.dbentity_id,
                        summary_type=mod_summary_type,
                        text=file_summary_val,
                        html=file_summary_html,
                        created_by=username,
                        source_id=SGD_SOURCE_ID
                    )
                    nex_session.add(new_summary)
                    inserts += 1
                
                summary = nex_session.query(Locussummary.summary_type, Locussummary.summary_id, Locussummary.html, Locussummary.date_created).filter_by(
                    locus_id=gene.dbentity_id, summary_type=mod_summary_type).all()[0]
                # add LocussummaryReference(s)
            if item:
                if item.get('PMIDs'):
                    pmids = item.get('PMIDs').replace(' ', '')
                else:
                    pmids = ''
                if len(pmids) > 0:
                    pmids = re.split('\||,', pmids)
                    for idx, pmid in enumerate(pmids):
                        matching_ref = [x for x in matching_refs if x.pmid == int(pmid)][0]
                        summary_id = summary.summary_id
                        reference_id = matching_ref.dbentity_id
                        order = _idx + 1
                        # look for matching LocussummaryReference
                        matching_locussummary_refs = nex_session.query(LocussummaryReference).filter_by(summary_id=summary_id, reference_id=reference_id).all()
                        if len(matching_locussummary_refs):
                            nex_session.query(LocussummaryReference).filter_by(summary_id=summary_id,reference_id=reference_id).update({ 'reference_order': order })
                        else:
                            new_locussummaryref = LocussummaryReference(
                                summary_id=summary_id,
                                reference_id=reference_id,
                                reference_order=order,
                                source_id=SGD_SOURCE_ID,
                                created_by=username
                            )
                            nex_session.add(new_locussummaryref)

            # add receipt
            summary_type_url_segment = file_summary_type.lower()
            if summary_type_url_segment not in ['phenotype', 'regulation', 'interaction', 'sequence', 'disease', 'protein']:
                summary_type_url_segment = ''
            preview_url = '/locus/' + gene.sgdid + '/' + summary_type_url_segment
            clear_target_urls.append(preview_url)
            if summary:
                summary_obj = {
                    'display_name': gene.format_name,
                    'obj_url': preview_url,
                    'activity_category': summary.summary_type,
                    'json': json.dumps({ 'summary_data': item}),
                    'created_by': username,
                    'dbentity_id': gene.dbentity_id
                }
                message = 'added'
                new_curate_activity = CuratorActivity(
                    display_name=summary_obj['display_name'],
                    obj_url=summary_obj['obj_url'],
                    activity_category=summary_obj['activity_category'],
                    dbentity_id=summary_obj['dbentity_id'],
                    message=message,
                    json=summary_obj['json'],
                    created_by=summary_obj['created_by']
                )
                nex_session.add(new_curate_activity)
            receipt_entries.append({
                'category': 'locus',
                'href': preview_url,
                'name': gene.display_name,
                'type': file_summary_type,
                'value': file_summary_val
            })
    transaction.commit()
    nex_session.close()
    if len(clear_target_urls) > 0:
        ban_from_cache(clear_target_urls)
    return {
        'inserts': inserts,
        'updates': updates,
        'entries': receipt_entries
    }

def load_summaries(nex_session, file_content, username, summary_type=None):
    annotation_summary = validate_file_content_and_process(file_content, nex_session, username)
    return annotation_summary

if __name__ == '__main__':
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)
    with open('test/example_files/example_summary_upload.tsv') as tsvfile:
        tsvreader = csv.reader(tsvfile, delimiter="\t")
        load_summaries(DBSession, tsvreader, 'USER')
