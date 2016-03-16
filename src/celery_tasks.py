from pyramid_celery import celery_app as app
import transaction

import boto
from boto.s3.key import Key

import os
from .helpers import md5

from .models import DBSession, Filedbentity
	
@app.task(bind=True, default_retry_delay=60)
def upload_to_s3(self, local_file_path, sgdid, file_extension, s3_access_key, s3_secret_key, s3_bucket):
    try:
        conn = boto.connect_s3(s3_access_key, s3_secret_key)
        bucket = conn.get_bucket(s3_bucket)

        k = Key(bucket)
        k.key = str(sgdid) + "." + file_extension
        k.set_contents_from_filename(local_file_path)
        k.make_public()

        md5_local = md5(local_file_path)
        file_s3 = bucket.get_key(k.key)
        etag_md5_s3 = file_s3.etag.strip('"').strip("'")

        if (md5_local == etag_md5_s3):
            fdb = DBSession.query(Filedbentity).filter(Filedbentity.sgdid == sgdid).one_or_none()
            fdb.md5sum = etag_md5_s3
            fdb.s3_url = file_s3.generate_url(expires_in=0, query_auth=False)

            DBSession.flush()

            transaction.commit()

	    os.remove(local_file_path)
        else:
            raise Exception('MD5sum check failed for: ' + local_file_path)
    except Exception as exc:
        raise self.retry(exc=exc)
