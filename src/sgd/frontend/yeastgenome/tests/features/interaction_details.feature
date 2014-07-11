@browser
Feature: InteractionDetails
    @basic
    Scenario: Visit page
        When I visit "/locus/?/interaction" for "ACT1"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "summary"
        And I should see an element with id "annotations"
        And I should see an element with id "network"
        And I should see an element with id "resources"

        And the table with id "interaction_table" should have rows in it
        And the network with id "cy" should appear
        And the resource list with id "resources_list" should have rows in it

    Scenario: Click download buttons
        When I visit "/locus/?/interaction" for "ACT1"
        And I click the button with id "interaction_table_download"
        Then I should download a file named "ACT1_interactions.txt"

    Scenario Outline: Click analyze button
        When I visit "/locus/?/interaction" for "ACT1"
        And I click the button with id <button>
        Then the table with id "gene_list_table" should have rows in it

    Examples:
        | button                          |
        | "interaction_table_analyze"     |
        | "phys"                          |
        | "gen"                           |
        | "phys_gen_intersect"            |
        | "phys_gen_union"                |

    Scenario Outline: Click disabled buttons
        When I visit "/locus/?/interaction" for <gene>
        Then the button with id <button> should be disabled

    Examples:
        | gene    | button                          |
        | "YEA6"  | "phys"                          |
        | "HIS2"  | "gen"                           |
        | "DOG1"  | "phys_gen_intersect"            |
