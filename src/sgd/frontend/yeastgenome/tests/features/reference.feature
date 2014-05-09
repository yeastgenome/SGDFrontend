@browser
Feature: Reference

    Scenario Outline: Visit page
        When I visit "/reference/?/overview" for <reference>
        Then the title should be <title>
        And I should see an element with id "title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "go"
        And I should see an element with id "phenotype"
        And I should see an element with id "interaction"
        And I should see an element with id "regulation"

        And I should see an element <header_id> with text <header_text>

    Examples:
        | reference     | title                                 | header_id                                         | header_text               |
        | "S000053564"  | "Bi E, et al. (1998)"                 | "go_table_header"                                 | "8 entries for 2 genes"   |
        | "S000053564"  | "Bi E, et al. (1998)"                 | "phenotype_table_header"                          | "2 entries for 1 gene"    |
        | "S000146169"  | "Kilchert C and Spang A (2011)"       | "interaction_table_header"                        | "1 entry for 2 genes"     |

    Scenario Outline: Click download buttons
        When I visit "/reference/?/overview" for <reference>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | reference     | button                                | filename                                          |
        | "S000053564"  | "go_table_download"                   | "Bi_E_et_al_1996_go.txt"                          |
        | "S000053564"  | "phenotype_table_download"            | "Bi_E_et_al_1996_phenotype.txt"                   |
        | "S000146169"  | "interaction_table_download"          | "Kilchart_C_and_Spang_A_2011_interactions.txt"    |

    Scenario Outline: Click analyze button
        When I visit "/reference/?/overview" for <reference>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | reference     | button                                | num_rows                                          |
        | "S000053564"  | "go_table_analyze"                    | 2                                                 |
        | "S000053564"  | "phenotype_table_analyze"             | 1                                                 |
        | "S000146169"  | "interaction_table_analyze"           | 2                                                 |
