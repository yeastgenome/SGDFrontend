import os

author_response_file = 'file with full path here'
compute_url = 'http://compute.yeastgenome.org/'
heritage_url = 'http://heritage.yeastgenome.org'
log_directory = None

# google recaptcha key
try:
	secret_key = os.environ['SECRET_KEY']
except:
	secret_key = 'secret key here'

# sending email address for help line
try:
	sender = os.environ['SENDER']
except:
	sender = ''

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
