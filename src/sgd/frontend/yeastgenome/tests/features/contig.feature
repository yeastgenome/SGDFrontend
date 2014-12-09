@browser
Feature: Contig
    @basic
    Scenario: Visit page
        When I visit "/contig/?/overview" for "Chromosome_VI"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "feature"

        And the table with id "chromosomal_coord_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/contig/?/overview" for "Chromosome_VI"
        And I click the button with id "sequence_download"
        Then I should download a file named "S288C_Chromosome_6_sequence.txt"
        And I click the button with id "chromosomal_coord_table_download"
        Then I should download a file named "S288C_Chromosome_6_features.txt"
