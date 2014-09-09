@browser
Feature: Go
    @basic
    Scenario: Visit page
        When I visit "/go/?/overview" for "GO:0043234"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "ontology"
        And I should see an element with id "annotations"
        And the table with id "go_table" should have rows in it
        And the network with id "cy" should appear

    Scenario: Click download buttons
        When I visit "/go/?/overview" for "GO:0043234"
        And I click the button with id "go_table_download"
        Then I should download a file named "cytokinesis_annotations.txt"
        And I click the button with id "cy_download"
        Then I should download a file named "network.png"
        And I click the button with id "go_table_analyze"
        Then the table with id "gene_list_table" should have rows in it