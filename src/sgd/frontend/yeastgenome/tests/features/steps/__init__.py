__author__ = 'kpaskov'

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

@step('I should see an element "{element_id}" with text "{text}"')
def should_see_element_with_id_with_text(context, element_id, text):
    try:
        element = context.browser.find_element_by_id(element_id)
        assert element.text == text, 'Text does not match.'
    except NoSuchElementException:
        assert 0, 'No element with id ' + element_id

@step('the title should be "{title}"')
def title_should_be(context, title):
    assert context.browser.title == title, 'Wrong title'

@step('the table with id "{table_id}" should have {num_rows} rows')
def table_should_have_num_rows(context, table_id, num_rows):
    try:
        context.browser.find_element_by_id(table_id)
        table_info = context.browser.find_element_by_id(table_id + '_info')
        assert table_info.text == 'Showing 1 to ' + "{:,}".format(int(num_rows)) + ' of ' + "{:,}".format(int(num_rows)) + ' entries', 'Wrong number of rows in table: ' + table_info.text
        summary_info = context.browser.find_element_by_id(table_id + '_header')
        assert summary_info.text == str(num_rows), 'Wrong count in header.'
    except NoSuchElementException:
        assert 0, 'No element with id.'

@step('the limited table with id "{table_id}" should have {num_rows} rows')
def limited_table_should_have_num_rows(context, table_id, num_rows):
    try:
        context.browser.find_element_by_id(table_id)
        table_info = context.browser.find_element_by_id(table_id + '_info')
        assert table_info.text == 'Showing 1 to 10 of ' + num_rows + ' entries', 'Wrong number of rows in table.'
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
