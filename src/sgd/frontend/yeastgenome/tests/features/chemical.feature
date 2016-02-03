@browser
Feature: Chemical
    @basic
    Scenario: Visit page
        When I visit "/chemical/?/overview" for "benomyl"
        And I should see an element with class_name "key-value"
        And the table with id "phenotype_table" should have rows in it

    Scenario: Click download button
        When I visit "/chemical/?/overview" for "benomyl"
        And I click the button with id "phenotype_table_download"
        Then I should download a file named "benomyl_annotations.txt"
