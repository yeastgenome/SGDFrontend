import csv
import os
from loading.load_summaries_sync import load_summaries
from helpers import upload_file

# takes a TSV file and returns an array of annotations
def parse_tsv_annotations(db_session, tsv_file, filename, template_type, username):
    raw_file_content = csv.reader(tsv_file, delimiter='\t')
    annotations = load_summaries(db_session, raw_file_content, username)
    upload_file(
    	username, tsv_file,
    	filename=filename,
    	data_id=248375,
		topic_id=250482,
		format_id=248824,
		file_extension='tsv',
		display_name=filename,
		format_name='TSV',
		description='summary upload'
    )
    return annotations
