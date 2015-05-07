import os

author_response_file = 'file with full path here'
compute_url = 'http://compute.yeastgenome.org/'
heritage_url = 'http://heritage.yeastgenome.org'
log_directory = None

# google recaptcha key
secret_key = os.environ.get('SECRET_KEY', '')
# sending email address for help line
sender = os.environ.get('SENDER', '')
# elasticsearch URL
elasticsearch_address = os.environ.get('ELASTICSEARCH_ADDRESS', 'http://localhost:9200')	
# backend data from production API by default
backend_url = os.environ.get('BACKEND_URL', 'http://www.yeastgenome.org/webservice')

# by default, read assets from cloudfront
try:
	use_cloudfront_assets = (os.environ['USE_CLOUDFRONT_ASSETS'] in ['True', 'true', '1'])
except:
	use_cloudfront_assets = True
