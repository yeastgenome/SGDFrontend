import os

heritage_url = 'http://heritage.yeastgenome.org'
secret_key = 'secret key here'
sender = 'email address here'
author_response_file = 'file with full path here'
compute_url = 'http://compute.yeastgenome.org/'
log_directory = None

# elasticsearch
try:
	elasticsearch_address = os.environ['ELASTICSEARCH_ADDRESS']
except:
	elasticsearch_address = 'http://localhost:9200'
	
# backend data from production API by default
try:
	backend_url = os.environ['BACKEND_URL']
except:
	backend_url = 'http://www.yeastgenome.org/webservice'

# by default, read assets from cloudfront
try:
	use_cloudfront_assets = (os.environ['USE_CLOUDFRONT_ASSETS'] in ['True', 'true', '1'])
except:
	use_cloudfront_assets = True
