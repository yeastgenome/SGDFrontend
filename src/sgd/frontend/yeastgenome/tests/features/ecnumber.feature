@browser
Feature: EC Number
    @basic
    Scenario: Visit page
        When I visit "/ecnumber/?/overview" for "2.4.1.-"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "annotations"
        And I should see an element with id "resources"
        And the table with id "gene_list_table" should have rows in it
        And the resource list with id "resource_list" should have rows in it

    Scenario: Click download buttons
        When I visit "/ecnumber/?/overview" for "2.4.1.-"
        And I click the button with id "gene_list_table_download"
        Then I should download a file named "2_4_1__annotations.txt"
        And I click the button with id "gene_list_table_analyze"
        Then the table with id "gene_list_table" should have rows in it
