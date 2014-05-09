@browser
Feature: Domain

    Scenario Outline: Visit page
        When I visit "/domain/?/overview" for <domain>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "annotations"

        And I should see an element "domain_table_header" with text <header_text>

    Examples:
        | domain        | title                              | header_text                  |
        | "PTHR11937"   | "PTHR11937"                        | "11 entries for 11 genes"    |

    Scenario Outline: Click download buttons
        When I visit "/domain/?/overview" for <domain>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | domain        | button                             | filename                     |
        | "PTHR11937"   | "domain_table_download"            | "PTHR11937_annotations.txt"  |

    Scenario Outline: Click analyze button
        When I visit "/domain/?/overview" for <domain>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | domain        | button                             | num_rows                     |
        | "PTHR11937"   | "domain_table_analyze"             | 11                           |
