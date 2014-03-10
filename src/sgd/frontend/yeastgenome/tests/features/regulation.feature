@browser
Feature: Regulation

    Scenario Outline: Visit page
        When I visit "regulation" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "tab"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "domains"
        And I should see an element with id "binding"
        And I should see an element with id "targets"
        And I should see an element with id "enrichment"
        And I should see an element with id "regulators"
        And I should see an element with id "network"

    Examples:
        | gene      | title               |
        | "ABF1"    | "ABF1 Regulation"   |
        | "DOG1"    | "DOG1 Regulation"   |
        | "ACT1"    | "ACT1 Regulation"   |

    Scenario Outline: Click analyze buttons
        When I visit "regulation" for <gene>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | gene      | button                        | num_rows  |
        | "ABF1"    | "targ"                        | 494       |
        | "ABF1"    | "reg"                         | 142       |
        | "ABF1"    | "targets_table_analyze"       | 494       |
        | "ABF1"    | "regulators_table_analyze"    | 142       |

    Scenario Outline: Click disabled buttons
        When I visit "regulation" for <gene>
        Then the button with id <button> should be disabled

    Examples:
        | gene      | button                    |
        | "ACT1"    | "targ"                    |

    Scenario Outline: Click download buttons
        When I visit "regulation" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene      | button                        | filename                                  |
        | "ABF1"    | "save"                        | "ABF1_targets_and_regulators.png"         |
        | "ABF1"    | "domains_table_download"      | "ABF1_domains.txt"                        |
        | "ABF1"    | "targets_table_download"      | "ABF1_targets.txt"                        |
        | "ABF1"    | "enrichment_table_download"   | "ABF1_targets_go_process_enrichment.txt"  |
        | "ABF1"    | "regulators_table_download"   | "ABF1_regulators.txt"  |