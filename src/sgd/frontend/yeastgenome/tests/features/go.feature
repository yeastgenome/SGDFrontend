@browser
Feature: Go

    Scenario Outline: Visit page
        When I visit "/go/?/overview" for <go>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "ontology"
        And I should see an element with id "annotations"

        And I should see an element "go_table_header" with text <header_text>

    Examples:
        | go            | title                              | header_text                      |
        | "GO:0000910"  | "cytokinesis"                      | "1 entry for 1 gene"             |

    Scenario Outline: Click download buttons
        When I visit "/go/?/overview" for <go>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | go            | button                             | filename                         |
        | "GO:0000910"  | "go_table_download"                | "cytokinesis_annotations.txt"    |

    Scenario Outline: Click analyze button
        When I visit "/go/?/overview" for <go>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | go            | button                             | num_rows                         |
        | "GO:0000910"  | "go_table_analyze"                 | 1                                |

    Scenario Outline: Click child terms button
        When I visit "/go/?/overview" for <go>
        And I click the button with id <button>
        Then the title should be <title>
        And the limited table with id "go_table" should have <num_rows> rows
        And I should see an element "go_table_header" with text <header_text>

    Examples:
        | go            | button                             | title                            | num_rows  | header_text                   |
        | "GO:0000910"  | "go_table_show_children"           | "cytokinesis"                    | 151       | "151 entries for 103 genes"   |
