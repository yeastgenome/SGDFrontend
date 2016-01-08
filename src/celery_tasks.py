from pyramid_celery import celery_app as app

import boto
from boto.s3.key import Key

import os
from .helpers import md5
	
@app.task(bind=True, default_retry_delay=60)
def upload_to_s3(self, key, file_path, s3_access_key, s3_secret_key, s3_bucket):
    try:
        conn = boto.connect_s3(s3_access_key, s3_secret_key)
        bucket = conn.get_bucket(s3_bucket)

        k = Key(bucket)
        k.key = key
        k.set_contents_from_filename(file_path)
        k.make_public()

        md5_local = md5(file_path)
        file_s3 = bucket.get_key(key)
        etag_md5_s3 = file_s3.etag.strip('"').strip("'")

        if (md5_local == etag_md5_s3):
	    os.remove(file_path)
        else:
            # Retry the same upload will overwrite the file in S3. No need to delete it explicitly.
            raise Exception('MD5sum check failed for: ' + file_path)
    except Exception as exc:
        raise self.retry(exc=exc)
