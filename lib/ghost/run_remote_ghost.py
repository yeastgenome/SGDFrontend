# uses ENV variables to ping the ghost inspector API and run test suite for 'SGD Acceptance.'
import os
import requests

DEFAULT_START_URL = 'http://yeastgenome.org'

ghost_suite_id = os.environ.get('GHOST_SUITE_ID')
ghost_key = os.environ.get('GHOST_API_KEY')
start_url = os.environ.get('START_URL')
# default start url
if start_url is None:
	start_url = DEFAULT_START_URL

# construct ghost API url and ping to run test
ghost_url = 'https://api.ghostinspector.com/v1/suites/' + ghost_suite_id + '/execute/?apiKey=' + ghost_key + '&immediate=1&startUrl=' + start_url
requests.get(ghost_url)
