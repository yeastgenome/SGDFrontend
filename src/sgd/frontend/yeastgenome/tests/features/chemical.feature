@browser
Feature: Chemical

    Scenario Outline: Visit page
        When I visit "/chemical/?/overview" for <chemical>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "phenotype"
        And I should see an element "phenotype_table_header" with text <header_text>

    Examples:
        | chemical          | title                         | header_text                       |
        | "benomyl"         | "benomyl"                     | "434 entries for 5 phenotypes"    |

    Scenario Outline: Click download button
        When I visit "/chemical/?/overview" for <chemical>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | chemical          | button                        | filename                          |
        | "benomyl"         | "phenotype_table_download"    | "benomyl_annotations.txt"         |

    Scenario Outline: Click analyze button
        When I visit "/chemical/?/overview" for <chemical>
        And I click the button with id <button>
        Then the title should be "Analyze"
        And the table with id "gene_list_table" should have <num_rows> rows

    Examples:
        | chemical          | button                        | num_rows                          |
        | "benomyl"         | "phenotype_table_analyze"     | 320                               |