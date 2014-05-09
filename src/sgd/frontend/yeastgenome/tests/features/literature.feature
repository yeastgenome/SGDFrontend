@browser
Feature: Literature

    Scenario Outline: Visit page
        When I visit "literature" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "tab"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "primary"
        And I should see an element with id "network"
        And I should see an element with id "additional"
        And I should see an element with id "reviews"
        And I should see an element with id "go"
        And I should see an element with id "phenotype"
        And I should see an element with id "interaction"
        And I should see an element with id "regulation"

    Examples:
        | gene      | title               |
        | "ABF1"    | "ABF1 Literature"   |
        | "DOG1"    | "DOG1 Literature"   |
        | "ACT1"    | "ACT1 Literature"   |