@browser
Feature: Strain
    @basic
    Scenario: Visit page
        When I visit "/strain/?/overview" for "S288C"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "summary"
        And I should see an element with id "resources"