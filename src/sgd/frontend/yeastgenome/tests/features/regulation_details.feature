@browser
Feature: RegulationDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/regulation" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "domain"
        And I should see an element with id "binding"
        And I should see an element with id "targets"
        And I should see an element with id "enrichment"
        And I should see an element with id "regulators"
        And I should see an element with id "network"

        And I should see an element "domain_table_header" with text <domain_header_text>
        And I should see an element "target_table_header" with text <target_header_text>
        And I should see an element "enrichment_table_header" with text <enrichment_header_text>
        And I should see an element "regulator_table_header" with text <regulator_header_text>

    Examples:
        | gene    | title                       | domain_header_text            | target_header_text            | enrichment_header_text    | regulator_header_text     |
        | "GAL4"  | "GAL4 Regulation"           | "11 entries for 11 domains"   | "1554 entries for 963 genes"  | "8 entries for 963 genes" | "87 entries for 56 genes" |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/regulation" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button                      | filename                      |
        | "GAL4"  | "domain_table_download"     | "GAL4_domains.txt"            |
        | "GAL4"  | "target_table_download"     | "GAL4_targets.txt"            |
        | "GAL4"  | "enrichment_table_download" | "GAL4_target_enrichment.txt"  |
        | "GAL4"  | "regulator_table_download"  | "GAL4_regulators.txt"         |

    Scenario Outline: Click analyze button
        When I visit "/locus/?/regulation" for <gene>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | gene    | button                      | num_rows                      |
        | "GAL4"  | "analyze_targets"           | 963                           |
        | "GAL4"  | "analyze_regulators"        | 56                            |
        | "GAL4"  | "target_table_analyze"      | 963                           |
        | "GAL4"  | "regulator_table_analyze"   | 56                            |

    Scenario Outline: Click disabled buttons
        When I visit "/locus/?/regulation" for <gene>
        Then the button with id <button> should be disabled

    Examples:
        | gene    | button                      |
        | "ACT1"  | "analyze_targets"           |
