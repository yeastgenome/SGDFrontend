@browser
Feature: Author
    @basic
    Scenario: Visit page
        When I visit "/author/?/overview" for "Bi_E"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "references"
        And the reference list with id "references_list" should have rows in it

    Scenario: Click download button
        When I visit "/author/?/overview" for "Bi_E"
        And I click the button with id "references_list_download"
        Then I should download a file named "Bi_E_citations.nbib"