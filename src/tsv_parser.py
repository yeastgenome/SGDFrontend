import csv

from loading.load_summaries import load_summaries

# takes a TSV file and returns an array of annotations
def parse_tsv_annotations(db_session, tsv_file, template_type, username):
    raw_file_content = csv.reader(tsv_file, delimiter='\t')
    annotations = load_summaries(db_session, raw_file_content, username)
    return annotations
