@browser
Feature: Observable

    @basic
    Scenario: Visit page
        When I visit "/observable/?/overview" for "resistance_to_benomyl"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
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
        And I click the button with id "phenotype_table_analyze"
        Then the table with id "gene_list_table" should have rows in it

    Scenario: Click child terms button
        When I visit "/observable/?/overview" for "cytoskeleton_morphology"
        And I click the button with id "phenotype_table_show_children"
        And the table with id "phenotype_table" should have rows in it
        And I should see an element "phenotype_table_header" with text "235 entries for 172 genes"