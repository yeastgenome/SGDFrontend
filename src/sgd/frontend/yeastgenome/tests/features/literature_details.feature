@browser
Feature: InteractionDetails

    @basic
    Scenario: Visit page
        When I visit "/locus/?/literature" for "ACT1"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "overview"
        And I should see an element with id "primary"
        And I should see an element with id "network"
        And I should see an element with id "additional"
        And I should see an element with id "reviews"
        And I should see an element with id "go"
        And I should see an element with id "phenotype"
        And I should see an element with id "interaction"
        And I should see an element with id "regulation"

        And the reference list with id "primary_list" should have rows in it
        And the reference list with id "additional_list" should have rows in it
        And the reference list with id "review_list" should have rows in it
        And the reference list with id "go_list" should have rows in it
        And the reference list with id "phenotype_list" should have rows in it
        And the reference list with id "interaction_list" should have rows in it
        And the reference list with id "regulation_list" should have rows in it
        And the network with id "cy" should appear

    Scenario: Click download buttons
        When I visit "/locus/?/literature" for "ACT1"
        And I click the button with id "primary_list_download"
        Then I should download a file named "ACT1_primary_citations.nbib"
        And I click the button with id "additional_list_download"
        Then I should download a file named "ACT1_additional_citations.nbib"
        And I click the button with id "review_list_download"
        Then I should download a file named "ACT1_review_citations.nbib"
        And I click the button with id "go_list_download"
        Then I should download a file named "ACT1_go_citations.nbib"
        And I click the button with id "phenotype_list_download"
        Then I should download a file named "ACT1_phenotype_citations.nbib"
        And I click the button with id "interaction_list_download"
        Then I should download a file named "ACT1_interaction_citations.nbib"
        And I click the button with id "regulation_list_download"
        Then I should download a file named "ACT1_regulation_citations.nbib"
        And I click the button with id "cy_download"
        Then I should download a file named "network.png"