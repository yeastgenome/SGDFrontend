@browser
Feature: Contig

    Scenario Outline: Visit page
        When I visit "/contig/?/overview" for <contig>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "feature"

        And I should see an element "chromosomal_coord_table_header" with text <header_text>

    Examples:
        | contig           | title                              | header_text                               |
        | "BY4742_chr03"   | "chr03"                            | "200"                                     |

    Scenario Outline: Click download buttons
        When I visit "/contig/?/overview" for <contig>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | contig           | button                             | filename                                  |
        | "BY4742_chr03"   | "sequence_download"                | "BY4742_chr03_BY4742_chr03_sequence.txt"  |
        | "BY4742_chr03"   | "chromosomal_coord_table_download" | "chr03_features.txt"                      |

    Scenario Outline: Click analyze button
        When I visit "/contig/?/overview" for <contig>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | contig           | button                             | num_rows                                  |
        | "BY4742_chr03"   | "chromosomal_coord_table_analyze"  | 200                                       |
