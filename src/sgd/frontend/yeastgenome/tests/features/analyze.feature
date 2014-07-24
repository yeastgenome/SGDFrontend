@browser
Feature: Analyze
    @basic
    Scenario: Visit page
        When I visit "/locus/?/interaction" for "ACT1"
        And I click the button with id "phys"
        Then I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "tools"
        And I should see an element with id "gene_list"
        And I should see an element with id "enrichment"
        And the table with id "gene_list_table" should have rows in it

    Scenario: Click download button
        When I visit "/locus/?/interaction" for "ACT1"
        And I click the button with id "phys"
        And I click the button with id "gene_list_table_download"
        Then I should download a file named "ACT1_physical_interactors.txt"
        And I click the button with id "enrichment_table_download"
        Then I should download a file named "ACT1_physical_interactors_go_enrichment.txt"