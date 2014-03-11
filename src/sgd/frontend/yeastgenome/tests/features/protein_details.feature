@browser
Feature: ProteinDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/protein" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "domain"
        And I should see an element with id "experiment"
        And I should see an element with id "sequence"
        And I should see an element with id "external_ids"
        And I should see an element with id "resources"

        And I should see an element "domain_table_header" with text <domain_header_text>
        And I should see an element "phosphorylation_table_header" with text <phosphorylation_header_text>
        And I should see an element "alias_table_header" with text <alias_header_text>

    Examples:
        | gene    | title                           | domain_header_text            | phosphorylation_header_text   | alias_header_text             |
        | "GAL4"  | "GAL4 Protein"                  | "11 entries for 11 domains"   | "4 entries for 4 sites"       | "41 entries for 10 sources"   |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/protein" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button                          | filename                      |
        | "GAL4"  | "domain_table_download"         | "GAL4_domains.txt"            |
        | "GAL4"  | "sequence_download"             | "GAL4_sequence.txt"           |
        | "GAL4"  | "phosphorylation_table_download"| "GAL4_phosphorylation.txt"    |
        | "GAL4"  | "alias_table_download"          | "GAL4_external_ids.txt"       |