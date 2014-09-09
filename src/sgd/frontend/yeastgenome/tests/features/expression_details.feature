@browser
Feature: RegulationDetails
    @basic
    Scenario: Visit page
        When I visit "/locus/?/expression" for "GAL4"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "overview"
        And I should see an element with id "annotations"
        And I should see an element with id "network"
        And I should see an element with id "resources"

        And the table with id "expression_table" should have rows in it
        And the network with id "cy" should appear
        And the resource list with id "resource_list" should have rows in it

    Scenario: Click download buttons
        When I visit "/locus/?/expression" for "GAL4"
        And I click the button with id "expression_table_download"
        Then I should download a file named "GAL4_datasets.txt"