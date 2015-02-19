__author__ = 'kpaskov'

import re
from behave import step
from selenium.common.exceptions import NoSuchElementException

@step('I visit "{url}" for "{obj}"')
def visit_page_for(context, url, obj):
    context.browser.get(context.base_url + url.replace('?', obj))

@step('I click the button with id "{button_id}"')
def click_button_with_id(context, button_id):
    try:
        button = context.browser.find_element_by_id(button_id)
        button.click()
    except NoSuchElementException:
        assert 0, 'No element with id ' + button_id

@step('I should see an element with id "{element_id}"')
def should_see_element_with_id(context, element_id):
    try:
        context.browser.find_element_by_id(element_id)
    except NoSuchElementException:
        assert 0, 'No element with id ' + element_id

@step('I should not see an element with id "{element_id}"')
def should_see_element_with_id(context, element_id):
    try:
        context.browser.find_element_by_id(element_id)
        assert 0, 'Element with id ' + element_id + ' is present.'
    except NoSuchElementException:
        pass

@step('I should see an element with class_name "{element_class}"')
def should_see_element_with_class_name(context, element_class):
    try:
        context.browser.find_element_by_class_name(element_class)
    except NoSuchElementException:
        assert 0, 'No element with class ' + element_class

@step('I should see an element with css_selector "{css_selector}"')
def should_see_element_with_css_selector(context, css_selector):
        try:
            context.browser.find_element_by_css_selector(css_selector)
        except:
            assert 0, 'No element with CSS selector ' + css_selector

@step('I should see an element "{element_id}" with text "{text}"')
def should_see_element_with_id_with_text(context, element_id, text):
    try:
        element = context.browser.find_element_by_id(element_id)
        assert element.text == text, 'Text does not match: ' + element.text
    except NoSuchElementException:
        assert 0, 'No element with id ' + element_id

@step('the title should be "{title}"')
def title_should_be(context, title):
    assert context.browser.title == title, 'Wrong title'

@step('the table with id "{table_id}" should have rows in it')
def table_should_have_rows(context, table_id):
    try:
        num_rows = len(context.browser.find_elements_by_xpath("//table[@id='" + table_id + "']/tbody/tr"))
        assert num_rows > 0, 'Only ' + str(num_rows) + ' entries in table.'
    except NoSuchElementException:
        assert 0, 'No element with id.'

@step('the reference list with id "{reference_list_id}" should have rows in it')
def reference_list_should_have_rows(context, reference_list_id):
    try:
        num_rows = len(context.browser.find_elements_by_xpath("//ul[@id='" + reference_list_id + "']/li"))
        assert num_rows > 1, 'Only ' + str(num_rows) + ' entries in reference list.'
    except NoSuchElementException:
        assert 0, 'No element with id.'

@step('the resource list with id "{resource_list_id}" should have rows in it')
def resource_list_should_have_rows(context, resource_list_id):
    try:
        num_rows = len(context.browser.find_elements_by_xpath("//p[@id='" + resource_list_id + "']/a"))
        assert num_rows > 0, 'Only ' + str(num_rows) + ' entries in resource list.'
    except NoSuchElementException:
        assert 0, 'No element with id.'

@step('the network with id "{network_id}" should appear')
def network_should_appear(context, network_id):
    try:
        assert len(context.browser.find_elements_by_xpath("//div[@id='" + network_id + "']/div/canvas")) == 5, 'Network not drawn.'
    except NoSuchElementException:
        assert 0, 'No element with id.'

@step('the button with id "{button_id}" should be disabled')
def button_with_id_should_be_disabled(context, button_id):
    try:
        button = context.browser.find_element_by_id(button_id)
        assert button.get_attribute('disabled'), 'Button is not disabled.'

        old_title = context.browser.title
        button.click()
        assert context.browser.title == old_title, 'Disabled button took us to a different page.'

    except NoSuchElementException:
        assert 0, 'No element with id ' + button_id

@step('I should download a file named "{filename}"')
def download_a_file_named(context, filename):
    pass

@step('I wait {num_sec} seconds')
def wait(context, num_sec):
    from time import sleep
    sleep(float(num_sec))
    assert True

@step('I should not see a loader')
def should_not_see_a_loader(context):
    try:
        context.browser.find_element_by_class_name('loader')
        assert 0, 'Loader is still visible.'
    except NoSuchElementException:
        pass

@step('I should see the text "{text}"')
def should_see_text(context, text):
    src = context.browser.page_source
    text_found = re.search(text, src)
    if text_found:
        pass
    else:
        assert 0, 'Text not present.'

@step('I search {query}')
def type_text(context, query,):
    search_container = context.browser.find_element_by_id('searchform')
    input_el = search_container.find_element_by_id('txt_search_container').find_element_by_id('txt_search')
    search_button = search_container.find_element_by_id('search-submit-btn')
    input_el.click()
    input_el.send_keys(query.strip('"'))
    search_button.click()
    pass

@step('I should be at {desired_url}')
def test_url(context, desired_url):
    desired_url = desired_url.strip('"')
    current_url = context.browser.current_url
    if current_url == desired_url:
        pass
    else:
        assert 0, "Current URL doesn't match desired URL."
