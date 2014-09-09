@browser
Feature: Observable
    @basic
    Scenario: Visit page
        When I visit "/phenotype/?/overview" for "increased_resistance_to_benomyl"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "overview"
        And I should see an element with id "annotations"

        And the table with id "phenotype_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/phenotype/?/overview" for "increased_resistance_to_benomyl"
        And I click the button with id "phenotype_table_download"
        Then I should download a file named "increased_resistance_to_benomyl_annotations.txt"
        And I click the button with id "phenotype_table_analyze"
        Then the table with id "gene_list_table" should have rows in it