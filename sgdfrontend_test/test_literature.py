'''
Created on Aug 20, 2013

@author: kpaskov
'''
from sgdfrontend_test import browser, create_url, find_element, basic_page_tests, close_browser
    
browser = browser

def test_literature_page(close_browser, bioent_type='LOCUS', identifier='YFL039C'):
    browser.get(create_url(bioent_type, identifier, 'literature')) # Load page
    assert "Literature" in browser.title
    
    basic_page_tests()
    find_element("primary", "can't find primary")
    find_element("network", "can't find network")
    find_element("additional", "can't find additional")
    find_element("reviews", "can't find reviews")   
    find_element("go", "can't find go")    
    find_element("phenotype", "can't find phenotype")