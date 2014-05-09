@browser
Feature: PhenotypeDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/phenotype" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "annotations"
        And I should see an element with id "network"
        And I should see an element with id "resources"

        And I should see an element "phenotype_table_header" with text <header_text>

    Examples:
        | gene    | title                       | header_text                       |
        | "ACT1"  | "ACT1 Phenotypes"           | "42 entries for 25 phenotypes"    |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/phenotype" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button                      | filename                          |
        | "GAL4"  | "phenotype_table_download"  | "ACT1_phenotype_annotations.txt"  |
