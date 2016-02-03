@browser
Feature: ProteinDetails
    @basic
    Scenario: Visit page
        When I visit "/locus/?/protein" for "ACT1"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "domain"
        And I should see an element with id "experiment"
        And I should see an element with id "sequence"
        And I should see an element with id "external_ids"
        And I should see an element with id "resources"

        And the table with id "domain_table" should have rows in it
        And the table with id "phosphorylation_table" should have rows in it
        And the table with id "alias_table" should have rows in it
        And the table with id "amino_acid_table" should have rows in it
        And the table with id "physical_details_table" should have rows in it
        And the table with id "coding_region_table" should have rows in it
        And the table with id "extinction_coeff_table" should have rows in it
        And the table with id "atomic_table" should have rows in it
        And the network with id "cy" should appear
        And the resource list with id "homolog_resources_list" should have rows in it
        And the resource list with id "protein_databases_resources_list" should have rows in it
        And the resource list with id "localization_resources_list" should have rows in it
        And the resource list with id "modifications_resources_list" should have rows in it

    Scenario: Click download buttons
        When I visit "/locus/?/protein" for "ACT1"
        And I click the button with id "domain_table_download"
        Then I should download a file named "ACT1_domains.txt"
        And I click the button with id "cy_download"
        Then I should download a file named "network.txt"
        And I click the button with id "cy_txt_download"
        Then I should download a file named "ACT1_domains_network.txt"
        And I click the button with id "sequence_download"
        Then I should download a file named "ACT1_sequence.txt"
        And I click the button with id "phosphorylation_table_download"
        Then I should download a file named "ACT1_phosphorylation.txt"
        And I click the button with id "protein_properties_download"
        Then I should download a file named "ACT1_protein_properties.txt"
        And I click the button with id "alias_table_download"
        Then I should download a file named "ACT1_external_identifiers.txt"