@browser
Feature: GenomeSnapshot
    @basic
    Scenario: Visit page
        When I visit "/genomesnapshot" for " "
        And I wait 1 seconds
        And I should not see a loader
        And I should see an element with id "navbar-container"
        And I should see an element with class_name "bar-nodes-container"
        And I should see an element with class_name "toggle-bar-chart"
