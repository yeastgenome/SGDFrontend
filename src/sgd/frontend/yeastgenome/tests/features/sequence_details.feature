@browser
Feature: SequenceDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/sequence" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "reference"
        And I should see an element with id "alternative"
        And I should see an element with id "other"
        And I should see an element with id "resources"

        And I should see an element "subfeature_table_header" with text <header_text>

    Examples:
        | gene    | title                           | header_text           |
        | "ACT1"  | "ACT1 Sequence"                 | "3 entries"           |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/sequence" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button                          | filename              |
        | "ACT1"  | "subfeature_table_download"     | "ACT1_subfeatures.txt"|
        | "ACT1"  | "reference_download"            | "ACT1_S288C.txt"      |
        | "ACT1"  | "alternative_download"          | "ACT1_alternative.txt"|
        | "ACT1"  | "other_download"                | "ACT1_other.txt"      |