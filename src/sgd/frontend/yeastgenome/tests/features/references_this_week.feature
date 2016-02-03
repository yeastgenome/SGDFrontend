@browser
Feature: ReferencesThisWeek
    @basic
    Scenario: Visit page
        When I visit "/reference/?" for "recent"
        And I should see an element with id "sidebar"
        And I should see an element with id "references"
        And I should see an element with id "references_header"
