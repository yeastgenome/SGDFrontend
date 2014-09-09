@browser
Feature: Dataset
    @basic
    Scenario: Visit page
        When I visit "/dataset/?/overview" for "GSE8624_set2_family"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "summary"
        And I should see an element with id "conditions"
        And I should see an element with id "resources"

        And the resource list with id "resource_list" should have rows in it