@browser
Feature: Observable

    Scenario Outline: Visit page
        When I visit "/observable/?/overview" for <observable>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "ontology"
        And I should see an element with id "annotations"

        And I should see an element "phenotype_table_header" with text <header_text>

    Examples:
        | observable                | title                             | header_text                               |
        | "resistance_to_benomyl"   | "resistance to benomyl"           | "429 entries for 320 genes"               |
        | "cytoskeleton_morphology" | "cytoskeleton morphology"         | "16 entries for 14 genes"                 |

    Scenario Outline: Click download buttons
        When I visit "/observable/?/overview" for <observable>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | observable                | button                            | filename                                  |
        | "resistance_to_benomyl"   | "phenotype_table_download"        | "resistance_to_benomyl_annotations.txt"   |
        | "cytoskeleton_morphology" | "phenotype_table_download"        | "cytoskeleton_morphology_annotations.txt" |

    Scenario Outline: Click analyze button
        When I visit "/observable/?/overview" for <observable>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | observable                | button                            | num_rows                                  |
        | "resistance_to_benomyl"   | "phenotype_table_analyze"         | 320                                       |
        | "cytoskeleton_morphology" | "phenotype_table_analyze"         | 14                                        |

    Scenario Outline: Click child terms button
        When I visit "/observable/?/overview" for <observable>
        And I click the button with id <button>
        Then the title should be <title>
        And the limited table with id "phenotype_table" should have <num_rows> rows
        And I should see an element "phenotype_table_header" with text <header_text>

    Examples:
        | observable                | button                             | title                                    |num_rows   | header_text                   |
        | "cytoskeleton_morphology" | "phenotype_table_show_children"    | "cytoskeleton morphology"                |231        | "231 entries for 170 genes"   |
