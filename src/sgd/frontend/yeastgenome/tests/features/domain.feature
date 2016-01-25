@browser
Feature: Domain
    @basic
    Scenario: Visit page
        When I visit "/domain/?/overview" for "PTHR11937"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "annotations"
        And the table with id "domain_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/domain/?/overview" for "PTHR11937"
        And I click the button with id "domain_table_download"
        Then I should download a file named "PTHR11937_annotations.txt"
        And I click the button with id "domain_table_analyze"
