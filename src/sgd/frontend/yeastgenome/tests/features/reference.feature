@browser
Feature: Reference
    @basic
    Scenario: Visit page
        When I visit "/reference/?/overview" for "S000053564"
        And I should see an element with id "title"
        And I should see an element with id "sidebar"

        And I should see an element with id "overview"
        And I should see an element with id "go"
        And I should see an element with id "phenotype"
        And I should see an element with id "interaction"
        And I should see an element with id "regulation"
        And I should see an element with id "expression"

        And the table with id "go_table" should have rows in it
        And the table with id "phenotype_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/reference/?/overview" for "S000053564"
        And I click the button with id "go_table_download"
        Then I should download a file named "Bi_E_et_al_1996_go.txt"
        And I click the button with id "phenotype_table_download"
        Then I should download a file named "Bi_E_et_al_1996_phenotype.txt"
        And I click the button with id "go_table_analyze"
        Then the table with id "gene_list_table" should have rows in it