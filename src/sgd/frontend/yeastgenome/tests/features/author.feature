@browser
Feature: Author

    Scenario Outline: Visit page
        When I visit "/author/?/overview" for <author>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "references"
        And I should see an element "references_header" with text <header_text>

    Examples:
        | author        | title                  | header_text          |
        | "Bi_E"        | "Bi E"                 | "46"                 |

    Scenario Outline: Click download button
        When I visit "/author/?/overview" for <author>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | author        | button                | filename              |
        | "Bi_E"        | "export_references"   | "Bi_E_citations.nbib" |
