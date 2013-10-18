'''
Created on Aug 20, 2013

@author: kpaskov
'''
from sgdfrontend_test import browser, create_url, find_element, basic_page_tests, close_browser
    
browser = browser

def test_interaction_page(close_browser, bioent_type='LOCUS', identifier='YFL039C'):
    browser.get(create_url(bioent_type, identifier, 'interactions')) # Load page
    assert "Interactions" in browser.title
    
    basic_page_tests()
    find_element("summary", "can't find summary")
    find_element("interactions", "can't find interactions")
    find_element("network", "can't find network")
    find_element("resources", "can't find resources")    
