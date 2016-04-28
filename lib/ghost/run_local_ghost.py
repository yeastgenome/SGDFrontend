# uses ENV variables to ping the ghost inspector API and run test suite for 'SGD Acceptance.'
import os
import requests

NGROK_URL = 'http://localhost:4040/api/tunnels'

ghost_suite_id = os.environ.get('GHOST_SUITE_ID')
ghost_key = os.environ.get('GHOST_API_KEY')

# get start URL from ngrok API
try:
  ngrok_response = requests.get(NGROK_URL).json()
  start_url = ngrok_response['tunnels'][0]['public_url']
except Exception, e:
  # TODO, give an error message instructing how to setup ngrok
  raise e

# construct ghost API url and ping to run test
ghost_url = 'https://api.ghostinspector.com/v1/suites/' + ghost_suite_id + '/execute/?apiKey=' + ghost_key + '&immediate=1&startUrl=' + start_url
requests.get(ghost_url)
