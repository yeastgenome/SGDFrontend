'''
Created on Aug 20, 2013

@author: kpaskov
'''
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from sgdfrontend import link_maker
from sgdfrontend.link_maker import interaction_page_link, literature_page_link, \
    regulation_page_link
from sgdfrontend_test import browser, find_element, basic_page_tests, \
    close_browser
import requests
    
browser = browser
link_maker.frontend_start = 'http://localhost:6545'

def test_interaction_page(close_browser, bioent_type='LOCUS', identifier='YFL039C'):
    browser.get(interaction_page_link(identifier, bioent_type,)) # Load page
    assert "Interactions" in browser.title
    
    #Check that page meets basic outline
    basic_page_tests()
    find_element("summary", "can't find summary")
    find_element("interactions", "can't find interactions")
    find_element("network", "can't find network")
    find_element("resources", "can't find resources")   

    #Check that Analyze buttons in Summary work.    
    wait = WebDriverWait(browser, 10)
    phys_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'phys')))
    phys_button.click()
    assert "Analyze" in browser.title
    browser.back();
    
    gen_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'gen')))
    gen_button.click()
    assert "Analyze" in browser.title
    browser.back();
    
    intersect_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'phys_gen_intersect')))
    intersect_button.click()
    assert "Analyze" in browser.title
    browser.back();
    
    union_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'phys_gen_union')))
    union_button.click()
    assert "Analyze" in browser.title
    browser.back();
    
    #Check for png button in Summary
    png_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'save')))
    png_button.click()
    
    #Check Analyze button in Interactions
    analyze_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'evidence_table_analyze')))
    analyze_button.click()
    assert "Analyze" in browser.title
    browser.back();
    
    #Check for download button in Interactions
    download_button = wait.until(expected_conditions.element_to_be_clickable((By.ID,'evidence_table_download')))
    download_button.click()
    
def test_literature_page(close_browser, bioent_type='LOCUS', identifier='YFL039C'):
    browser.get(literature_page_link(identifier, bioent_type,)) # Load page
    assert "Literature" in browser.title
    
    basic_page_tests()
    find_element("primary", "can't find primary")
    find_element("network", "can't find network")
    find_element("additional", "can't find additional")
    find_element("reviews", "can't find reviews")  
    find_element("go", "can't find go")  
    find_element("phenotype", "can't find phenotype")  
    find_element("interaction", "can't find interaction")  
    find_element("regulation", "can't find regulation")  
    
    #Check for download button in Primary
    wait = WebDriverWait(browser, 10)
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_primary'))).click()
    
    #Check for download button in Additional
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_additional'))).click()
    
    #Check for download button in Reviews
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_reviews'))).click()
    
    #Check for download button in Go
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_go'))).click()
    
    #Check for download button in Phenotype
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_phenotype'))).click()
    
    #Check for download button in Interaction
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_interaction'))).click()
    
    #Check for download button in Regulation
    wait.until(expected_conditions.element_to_be_clickable((By.ID,'export_regulation'))).click()
    
def test_regulation_page(close_browser, bioent_type='LOCUS', identifier='YFL039C'):
    browser.get(regulation_page_link(identifier, bioent_type,)) # Load page
    assert "Regulation" in browser.title
    
    basic_page_tests()
    find_element("summary", "can't find summary")
    find_element("domains", "can't find domains")
    find_element("binding", "can't find binding")
    find_element("targets", "can't find targets")  
    find_element("enrichment", "can't find enrichment")  
    find_element("regulators", "can't find regulators")  
    find_element("network", "can't find network")  
    
    
 
