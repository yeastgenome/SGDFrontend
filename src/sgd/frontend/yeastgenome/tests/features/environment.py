__author__ = 'kpaskov'

import os
import sys
import httplib
import base64
import json
import new
import unittest
import sauceclient
from selenium import webdriver
from sauceclient import SauceClient

# import env variables
USERNAME = os.environ.get('SAUCE_USERNAME')
ACCESS_KEY = os.environ.get('SAUCE_ACCESS_KEY')
# point at production
BASE_URL = "http://yeastgenome.org"

# parse env variable to maybe test remotely, defaults to local selenium connection
IS_REMOTE = False
if (os.environ.get('REMOTE') in ['True', 'true', '1']):
    IS_REMOTE = True
    sauce = SauceClient(USERNAME, ACCESS_KEY)

def before_feature(context, feature):
    if 'browser' in feature.tags:
        if (IS_REMOTE):
            sauce_url = "http://%s:%s@ondemand.saucelabs.com:80/wd/hub"
            context.browser = webdriver.Remote(
                desired_capabilities={'username': USERNAME, 'access-key': ACCESS_KEY, 'platform': 'Mac OS X 10.9', 'browserName': 'chrome', 'version': '31'},
                command_executor=sauce_url % (USERNAME, ACCESS_KEY)
            )
        else:
            context.browser = webdriver.Firefox()

        context.browser.implicitly_wait(5)
        context.base_url = BASE_URL

def after_feature(context, feature):
    if 'browser' in feature.tags:
        if (IS_REMOTE):
            print("Link to your job: https://saucelabs.com/jobs/%s" % context.browser.session_id)
            try:
                if sys.exc_info() == (None, None, None):
                    sauce.jobs.update_job(context.browser.session_id, passed=True)
                else:
                    sauce.jobs.update_job(context.browser.session_id, passed=False)
            finally:
                context.browser.quit()
        else:
            context.browser.close()
