@browser
Feature: Tag
    @basic
    Scenario: Visit page
        When I visit "/tag/?/overview" for "cell_morphogenesis"
        And I should see an element with id "sidebar"
        And I should see an element with id "overview"
        And I should see an element with id "datasets"
        And I should see an element with id "additional_categories"

        And the table with id "expression_table" should have rows in it

    Scenario: Click download buttons
        When I visit "/tag/?/overview" for "cell_morphogenesis"
        And I click the button with id "expression_table_download"
        Then I should download a file named "cell_morphogenesis_datasets.txt"
