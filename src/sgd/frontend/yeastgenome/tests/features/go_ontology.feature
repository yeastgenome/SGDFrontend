@browser
Feature: GoOntology

    Scenario Outline: Visit page
        When I visit "/ontology/go/?/overview" for <ontology>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "ontology"
        And I should see an element with id "annotations"

        And I should see an element "go_table_header" with text <header_text>

    Examples:
        | ontology              | title                 | header_text                           |
        | "biological_process"  | "biological process"  | "1908 entries for 1908 genes"          |

    Scenario Outline: Click download buttons
        When I visit "/ontology/go/?/overview" for <ontology>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | ontology              | button                | filename                              |
        | "biological_process"  | "go_table_download"   | "biological_process_annotations.txt"  |

    Scenario Outline: Click analyze button
        When I visit "/ontology/go/?/overview" for <ontology>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | ontology              | button                | num_rows                              |
        | "biological_process"  | "go_table_analyze"    | 1908                                  |
