@browser
Feature: PhenotypeOntology

    @basic
    Scenario: Visit page
        When I visit "/ontology/phenotype/?/overview" for "ypo"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "overview"
        And I should see an element with id "network"

        And the network with id "cy" should appear
