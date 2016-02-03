@browser
Feature: Observable

    @basic
    Scenario: Visit page
        When I visit "/observable/?/overview" for "resistance_to_benomyl"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "ontology"
        And I should see an element with id "annotations"

        And the table with id "phenotype_table" should have rows in it
        And the network with id "cy" should appear

    Scenario: Click download buttons
        When I visit "/observable/?/overview" for "resistance_to_benomyl"
        And I click the button with id "phenotype_table_download"
        Then I should download a file named "resistance_to_benomyl_annotations.txt"
        And I click the button with id "cy_download"
        Then I should download a file named "network.png"
