from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException

import pytest
from tests.sgdfrontend import conftest

browser = webdriver.Firefox()

def find_element(element_id, message):
    try:
        return browser.find_element_by_id(element_id)
    except NoSuchElementException:
        assert 0, message
        
def basic_page_tests():
    find_element("layout-page-header", "can't find header")
    find_element("center_title", "can't find center title")  
    find_element("tab", "can't find tabs")
    find_element("sidebar", "can't find sidebar")
    
@pytest.fixture(scope="session")
def close_browser(request):
    def fin():
        browser.close()
    request.addfinalizer(fin)
