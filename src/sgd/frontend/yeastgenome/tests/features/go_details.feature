@browser
Feature: GoDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/go" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "manual"
        And I should see an element with id "htp"
        And I should see an element with id "comp"
        And I should see an element with id "network"

        And I should see an element "mc_bp_go_table_header" with text <mc_bp_header_text>
        And I should see an element "mc_mf_go_table_header" with text <mc_mf_header_text>
        And I should see an element "mc_cc_go_table_header" with text <mc_cc_header_text>
        And I should see an element "htp_bp_go_table_header" with text <htp_bp_header_text>
        And I should see an element "htp_mf_go_table_header" with text <htp_mf_header_text>
        And I should see an element "htp_cc_go_table_header" with text <htp_cc_header_text>
        And I should see an element "comp_bp_go_table_header" with text <comp_bp_header_text>
        And I should see an element "comp_mf_go_table_header" with text <comp_mf_header_text>
        And I should see an element "comp_cc_go_table_header" with text <comp_cc_header_text>

    Examples:
        | gene    | title                          | mc_bp_header_text                     | mc_mf_header_text                     | mc_cc_header_text                     | htp_bp_header_text                    | htp_mf_header_text                    | htp_cc_header_text                    | comp_bp_header_text                   | comp_mf_header_text                   | comp_cc_header_text                  |
        | "GAL4"  | "GAL4 Gene Ontology"           | "3 entries for 2 Gene Ontology terms" | "8 entries for 4 Gene Ontology terms" | "1 entry for 1 Gene Ontology term"    | "0 entries for 0 Gene Ontology terms" | "1 entry for 1 Gene Ontology term"    | "0 entries for 0 Gene Ontology terms" | "7 entries for 5 Gene Ontology terms" | "5 entries for 4 Gene Ontology terms" | "3 entries for 1 Gene Ontology term" |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/go" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button                        | filename                              |
        | "GAL4"  | "go_download_all"             | "GAL4_go_annotations.txt"             |
        | "GAL4"  | "mc_bp_go_table_download"     | "GAL4_manual_bp_go.txt"               |
        | "GAL4"  | "mc_mf_go_table_download"     | "GAL4_manual_mf_go.txt"               |
        | "GAL4"  | "mc_cc_go_table_download"     | "GAL4_manual_cc_go.txt"               |
        | "GAL4"  | "htp_mf_go_table_download"    | "GAL4_htp_mf_go.txt"                  |
        | "GAL4"  | "comp_bp_go_table_download"   | "GAL4_computational_bp_go.txt"        |
        | "GAL4"  | "comp_mf_go_table_download"   | "GAL4_computational_mf_go.txt"        |
        | "GAL4"  | "comp_cc_go_table_download"   | "GAL4_computational_cc_go.txt"        |