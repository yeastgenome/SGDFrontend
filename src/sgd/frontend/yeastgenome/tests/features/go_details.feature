@browser
Feature: GoDetails

    @basic
    Scenario: Visit page
        When I visit "/locus/?/go" for "ACT1"
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"
        And I should see an element with id "summary"
        And I should see an element with id "manual"
        And I should see an element with id "htp"
        And I should see an element with id "comp"
        And I should see an element with id "network"

        And the table with id "mc_bp_go_table" should have rows in it
        And the table with id "mc_mf_go_table" should have rows in it
        And the table with id "mc_cc_go_table" should have rows in it
        And the table with id "comp_mf_go_table" should have rows in it
        And the table with id "comp_cc_go_table" should have rows in it
        And the network with id "cy" should appear

    Scenario: Click download buttons
        When I visit "/locus/?/go" for "ACT1"
        And I click the button with id "go_download_all"
        Then I should download a file named "GAL4_go_annotations.txt"
        And I click the button with id "mc_bp_go_table_download"
        Then I should download a file named "GAL4_manual_bp_go.txt"
        And I click the button with id "cy_download"
        Then I should download a file named "network.png"