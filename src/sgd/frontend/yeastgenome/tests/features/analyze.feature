@browser
Feature: Analyze

    @basic
    Scenario Outline: Visit page
        When I visit "/locus/?/interaction" for "ACT1"
        And I click the button with id "phys"
        Then I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "tools"
        And I should see an element with id "gene_list"
        And I should see an element with id "enrichment"
        And I should see an element "gene_list_table_header" with text <gene_list_header_text>
        And I should see an element "enrichment_table_header" with text <enrichment_header_text>

    Scenario Outline: Click download button
        When I visit "/locus/?/interaction" for "ACT1"
        And I click the button with id "phys"
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | button                        | filename                                      |
        | "gene_list_table_download"    | "ACT1_physical_interactors.txt"               |
        | "enrichment_table_download"   | "ACT1_physical_interactors_go_enrichment.txt" |
