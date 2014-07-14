@browser
Feature: SequenceDetails
    @basic
    Scenario: Visit page
        When I visit "/locus/?/sequence" for "ACT1"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "reference"
        And I should see an element with id "alternative"
        And I should see an element with id "other"
        And I should see an element with id "resources"

        And the table with id "subfeature_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/locus/?/sequence" for "ACT1"
        And I click the button with id "subfeature_table_download"
        Then I should download a file named "ACT1_subfeatures.txt"
        And I click the button with id "reference_download"
        Then I should download a file named "ACT1_S288C.txt"
        And I click the button with id "alternative_download"
        Then I should download a file named "ACT1_alternative.txt"
        And I click the button with id "other_download"
        Then I should download a file named "ACT1_other.txt"