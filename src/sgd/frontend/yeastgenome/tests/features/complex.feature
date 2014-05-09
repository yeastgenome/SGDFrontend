@browser
Feature: Chemical

    Scenario Outline: Visit page
        When I visit "/complex/?/overview" for <complex>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "gene_list"
        And I should see an element with id "enrichment"
        And I should see an element with id "network"
        And I should see an element with id "annotations"

        And I should see an element "gene_list_table_header" with text <gene_list_header_text>
        And I should see an element "enrichment_table_header" with text <enrichment_header_text>
        And I should see an element "go_table_header" with text <go_header_text>

    Examples:
        | complex               | title                         | gene_list_header_text                     | enrichment_header_text    | go_header_text            |
        | "prefoldin_complex"   | "prefoldin complex"           | "7"                                       | "25"                      | "19 entries for 7 genes"  |

    Scenario Outline: Click download buttons
        When I visit "/complex/?/overview" for <complex>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | complex               | button                        | filename                                  |
        | "prefoldin_complex"   | "gene_list_table_download"    | "prefoldin_complex_genes.txt"             |
        | "prefoldin_complex"   | "gene_list_table_download"    | "prefoldin_complex_go_enrichment.txt"     |
        | "prefoldin_complex"   | "go_table_download"           | "prefoldin_complex_go_annotations.txt"    |

    Scenario Outline: Click analyze button
        When I visit "/complex/?/overview" for <complex>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | complex               | button                        | num_rows                                  |
        | "prefoldin_complex"   | "gene_list_table_analyze"     | 7                                         |
        | "prefoldin_complex"   | "go_table_analyze"            | 7                                         |