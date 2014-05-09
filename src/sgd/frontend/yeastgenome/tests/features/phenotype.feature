@browser
Feature: Observable

    Scenario Outline: Visit page
        When I visit "/phenotype/?/overview" for <phenotype>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "annotations"

        And I should see an element "phenotype_table_header" with text <header_text>

    Examples:
        | phenotype                             | title                                 | header_text                                           |
        | "increased_resistance_to_benomyl"     | "resistance to benomyl: increased"    | "28 entries for 23 genes"                             |
        | "abnormal_cytoskeleton_morphology"    | "cytoskeleton morphology: abnormal"   | "16 entries for 14 genes"                             |

    Scenario Outline: Click download buttons
        When I visit "/phenotype/?/overview" for <phenotype>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | phenotype                             | button                                | filename                                              |
        | "increased_resistance_to_benomyl"     | "phenotype_table_download"            | "increased_resistance_to_benomyl_annotations.txt"     |
        | "abnormal_cytoskeleton_morphology"    | "phenotype_table_download"            | "abnormal_cytoskeleton_morphology_annotations.txt"    |

    Scenario Outline: Click analyze button
        When I visit "/phenotype/?/overview" for <phenotype>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | phenotype                             | button                                | num_rows                                              |
        | "increased_resistance_to_benomyl"     | "phenotype_table_analyze"             | 23                                                    |
        | "abnormal_cytoskeleton_morphology"    | "phenotype_table_analyze"             | 14                                                    |
