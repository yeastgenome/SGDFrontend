@browser
Feature: Contig
    @basic
    Scenario: Visit page
        When I visit "/contig/?/overview" for "BY4742_chr03"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "summary"
        And I should see an element with id "feature"

        And the table with id "chromosomal_coord_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/contig/?/overview" for "BY4742_chr03"
        And I click the button with id "sequence_download"
        Then I should download a file named "BY4742_chr03_BY4742_chr03_sequence.txt"
        And I click the button with id "chromosomal_coord_table_download"
        Then I should download a file named "chr03_features.txt"
        And I click the button with id "chromosomal_coord_table_analyze"
        Then the table with id "gene_list_table" should have rows in it