@browser
Feature: LSP
    @basic
    Scenario: Visit page
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I should not see a loader
        And I should see an element with id "navbar-container"
        And I should see an element with id "summary_paragraph"
        And I should see an element with class_name "reference-list"
	And I should see an element with class_name "reference-list-item"
	And I should see an element with id "genetic_position"
        And I should see the text "cytoskeleton"
	
    Scenario: Visit page with pathways
	When I visit "/locus/?/overview" for "SIR2"
	And I wait 2 seconds
	And I should see an element with css_selector "a[href='#pathway']"
    
    Scenario: Visit page without regulation data
        When I visit "/locus/?/overview" for "MATALPHA"
	And I should not see an element with id "regulation"	