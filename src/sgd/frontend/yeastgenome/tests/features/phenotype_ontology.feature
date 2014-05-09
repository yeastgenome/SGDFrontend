@browser
Feature: PhenotypeOntology

    Scenario Outline: Visit page
        When I visit "/ontology/phenotype/?/overview" for <ontology>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "network"

    Examples:
        | ontology  | title                         |
        | "ypo"     | "Yeast Phenotype Ontology"    |
