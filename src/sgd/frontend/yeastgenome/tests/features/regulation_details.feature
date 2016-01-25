@browser
Feature: RegulationDetails
    @basic
    Scenario: Visit page
        When I visit "/locus/?/regulation" for "GAL4"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "domain"
        And I should see an element with id "binding"
        And I should see an element with id "targets"
        And I should see an element with id "enrichment"
        And I should see an element with id "regulators"
        And I should see an element with id "network"

        And the table with id "domain_table" should have rows in it
        And the table with id "target_table" should have rows in it
        And the table with id "enrichment_table" should have rows in it
        And the table with id "regulator_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/locus/?/regulation" for "GAL4"
        And I click the button with id "domain_table_download"
        Then I should download a file named "GAL4_domains.txt"
        And I click the button with id "target_table_download"
        Then I should download a file named "GAL4_targets.txt"
        And I click the button with id "enrichment_table_download"
        Then I should download a file named "GAL4_target_enrichment.txt"
        And I click the button with id "regulator_table_download"
        Then I should download a file named "GAL4_regulators.txt"
        And I click the button with id "analyze_targets"
        Then the table with id "gene_list_table" should have rows in it