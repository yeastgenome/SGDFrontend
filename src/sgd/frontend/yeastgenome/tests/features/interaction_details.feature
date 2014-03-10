@browser
Feature: InteractionDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/interaction" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "annotations"
        And I should see an element with id "network"
        And I should see an element with id "resources"

        And I should see an element "interaction_table_header" with text <header_text>

    Examples:
        | gene    | title                           | header_text                   |
        | "ACT1"  | "ACT1 Interactions"             | "1013 entries for 692 genes"  |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/interaction" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button                          | filename                      |
        | "ACT1"  | "interaction_table_download"    | "ACT1_interactions.txt"       |

    Scenario Outline: Click analyze button
        When I visit "/locus/?/interaction" for <gene>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | gene    | button                          | num_rows                      |
        | "ACT1"  | "interaction_table_analyze"     | 692                           |
        | "ACT1"  | "phys"                          | 141                           |
        | "ACT1"  | "gen"                           | 592                           |
        | "ACT1"  | "phys_gen_intersect"            | 41                            |
        | "ACT1"  | "phys_gen_union"                | 692                           |

    Scenario Outline: Click disabled buttons
        When I visit "/locus/?/interaction" for <gene>
        Then the button with id <button> should be disabled

    Examples:
        | gene    | button                          |
        | "YEA6"  | "phys"                          |
        | "HIS2"  | "gen"                           |
        | "DOG1"  | "phys_gen_intersect"            |
