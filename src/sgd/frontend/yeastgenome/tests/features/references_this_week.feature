@browser
Feature: ReferencesThisWeek
    @basic
    Scenario: Visit page
        When I visit "/reference/?" for "recent"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "references"
        And I should see an element with id "references_header"

    # Commented because dev mode doesn't have data expected to make this work here.

        # And the reference list with id "references_list" should have rows in it

    # Scenario: Click download buttons
    #     When I visit "/reference/?" for "recent"
    #     And I click the button with id "references_list_download"
    #     Then I should download a file named "Bi_E_citations.nbib"