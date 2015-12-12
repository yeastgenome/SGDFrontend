from pyramid_celery import celery_app as app

import boto
from boto.s3.key import Key

from common.helpers import md5
	
@app.task
def upload_to_s3(key, file_path):
    try:
#        conn = boto.connect_s3(app.config['S3_ACCESS_KEY'], app.config['S3_SECRET_KEY'])
#        bucket = conn.get_bucket(app.config['S3_BUCKET'])

#        k = Key(bucket)
#        k.key = key
#        k.set_contents_from_filename(file_path)
#        k.make_public()

#        md5_local = md5(file_path)
#        file_s3 = bucket.get_key(key)
#        etag_md5_s3 = file_s3.etag.strip('"').strip("'")

#        if (md5_local == etag_md5_s3):
		os.remove(file_path)
#        else:
		pass
    except Exception as exc:
        raise self.retry(exc=exc)
