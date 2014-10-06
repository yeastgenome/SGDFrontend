__author__ = 'kpaskov'

from selenium import webdriver

def before_feature(context, feature):
    if 'browser' in feature.tags:
        context.browser = webdriver.Firefox()
        context.browser.implicitly_wait(30) # seconds
        context.base_url = 'http://localhost:6545'

def after_feature(context, feature):
    if 'browser' in feature.tags:
        context.browser.quit()