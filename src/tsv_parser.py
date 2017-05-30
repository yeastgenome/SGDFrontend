import csv
from loading.load_summaries_sync import load_summaries
import tinys3
import os

S3_ACCESS_KEY = os.environ['S3_ACCESS_KEY']
S3_SECRET_KEY = os.environ['S3_SECRET_KEY']
S3_BUCKET = os.environ['S3_BUCKET']

# takes a TSV file and returns an array of annotations
def parse_tsv_annotations(db_session, tsv_file, filename, template_type, username):
    raw_file_content = csv.reader(tsv_file, delimiter='\t')
    annotations = load_summaries(db_session, raw_file_content, username)
    conn = tinys3.Connection(S3_ACCESS_KEY,S3_SECRET_KEY,tls=True)
    s3_file_path = username + '/' + filename
    conn.upload(s3_file_path, tsv_file, S3_BUCKET)
    return annotations
