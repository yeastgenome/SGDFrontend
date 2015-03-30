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
		And I should see the text "contributes to"
	
	Scenario: Visit page with pathways and paralogs
		When I visit "/locus/?/overview" for "SIR2"
		And I wait 2 seconds
		And I should see the text "Paralog"
		And I should see an element with css_selector "a[href='#pathway']"

	Scenario: Visit page without regulation data
		When I visit "/locus/?/overview" for "MATALPHA"
		And I should not see an element with id "regulation"

	Scenario: Visit page of a deleted ORF
		When I visit "/locus/?/overview" for "YCRX17W"
		And I should see the text ", Deleted"

	Scenario: Visit page of a reserved gene name
		When I visit "/locus/?/overview" for "S000003902"
		And I should see the text "This name is reserved"
		And I should see the text "Reserved Name:"
