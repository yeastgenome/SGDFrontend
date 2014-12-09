@browser
Feature: Chemical
    @basic
    Scenario: Visit page
        When I visit "/chemical/?/overview" for "benomyl"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "phenotype"
        And the table with id "phenotype_table" should have rows in it

    Scenario: Click download button
        When I visit "/chemical/?/overview" for "benomyl"
        And I click the button with id "phenotype_table_download"
        Then I should download a file named "benomyl_annotations.txt"
        And I click the button with id "phenotype_table_analyze"
        And I wait 2 seconds
        Then the table with id "gene_list_table" should have rows in it