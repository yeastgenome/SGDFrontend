@browser
Feature: Interaction

    Scenario Outline: Visit page
        When I visit "interaction" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "tab"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "interactions"
        And I should see an element with id "network"
        And I should see an element with id "resources"

    Examples:
        | gene      | title                 |
        | "ABF1"    | "ABF1 Interactions"   |
        | "DOG1"    | "DOG1 Interactions"   |
        | "ACT1"    | "ACT1 Interactions"   |

    Scenario Outline: Click analyze buttons
        When I visit "interaction" for <gene>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | gene      | button                    | num_rows  |
        | "ABF1"    | "phys"                    | 16        |
        | "ABF1"    | "gen"                     | 23        |
        | "ABF1"    | "phys_gen_intersect"      | 2         |
        | "ABF1"    | "phys_gen_union"          | 37        |
        | "ABF1"    | "evidence_table_analyze"  | 37        |


    Scenario Outline: Click disabled buttons
        When I visit "interaction" for <gene>
        Then the button with id <button> should be disabled

    Examples:
        | gene      | button                    |
        | "YEA6"    | "phys"                    |
        | "HIS2"    | "gen"                     |
        | "DOG1"    | "phys_gen_intersect"      |

    Scenario Outline: Click download buttons
        When I visit "interaction" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene      | button                    | filename                          |
        | "ABF1"    | "save"                    | "ABF1_interaction_summary.png"    |
        | "ABF1"    | "evidence_table_download" | "ABF1_interactions.txt"           |