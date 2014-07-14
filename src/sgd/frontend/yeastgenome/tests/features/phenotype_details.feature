@browser
Feature: PhenotypeDetails
    @basic
    Scenario: Visit page
        When I visit "/locus/?/phenotype" for "ACT1"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "annotations"
        And I should see an element with id "network"
        And I should see an element with id "resources"

        And the table with id "phenotype_table" should have rows in it
        And the network with id "cy" should appear
        And the resource list with id "mutant_resources_list" should have rows in it
        And the resource list with id "phenotype_resources_list" should have rows in it
        And the resource list with id "ontology_resources_list" should have rows in it

    Scenario: Click download buttons
        When I visit "/locus/?/phenotype" for "ACT1"
        And I click the button with id "phenotype_table_download"
        Then I should download a file named "ACT1_phenotype_annotations.txt"
        And I click the button with id "cy_download"
        Then I should download a file named "network.png"