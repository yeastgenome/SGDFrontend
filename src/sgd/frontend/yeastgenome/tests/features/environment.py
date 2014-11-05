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
USERNAME = os.environ['SAUCE_USERNAME']
ACCESS_KEY = os.environ['SAUCE_ACCESS_KEY']

sauce = SauceClient(USERNAME, ACCESS_KEY)

def before_feature(context, feature):
    if 'browser' in feature.tags:
        sauce_url = "http://%s:%s@ondemand.saucelabs.com:80/wd/hub"
        context.browser = webdriver.Remote(
            desired_capabilities={'username': USERNAME, 'access-key': ACCESS_KEY, 'platform': 'Mac OS X 10.9', 'browserName': 'chrome', 'version': '31'},
            command_executor=sauce_url % (USERNAME, ACCESS_KEY)
        )
        context.browser.implicitly_wait(30)

        context.base_url = BASE_URL

def after_feature(context, feature):
    if 'browser' in feature.tags:
        print("Link to your job: https://saucelabs.com/jobs/%s" % context.browser.session_id)
        try:
            if sys.exc_info() == (None, None, None):
                sauce.jobs.update_job(context.browser.session_id, passed=True)
            else:
                sauce.jobs.update_job(context.browser.session_id, passed=False)
        finally:
            context.browser.quit()