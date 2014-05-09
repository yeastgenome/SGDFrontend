@browser
Feature: ReferencesThisWeek

    Scenario Outline: Visit page
        When I visit "/references/?" for <page>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "references"
        And I should see an element with id "references_header"

    Examples:
        | page          | title                                 |
        | "this_week"   | "Literature Recently Added to SGD"    |

    Scenario Outline: Click download buttons
        When I visit "/references/?" for <page>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | page          | button                                | filename              |
        | "this_week"   | "export_references"                   | "recently_added.txt"  |