@browser
Feature: InteractionDetails

    Scenario Outline: Visit page
        When I visit "/locus/?/literature" for <gene>
        Then the title should be <title>
        And I should see an element with id "center_title"
        And I should see an element with id "sidebar"

        And I should see an element with id "summary"
        And I should see an element with id "primary"
        And I should see an element with id "network"
        And I should see an element with id "additional"
        And I should see an element with id "reviews"
        And I should see an element with id "go"
        And I should see an element with id "phenotype"
        And I should see an element with id "interaction"
        And I should see an element with id "regulation"

        And I should see an element "primary_header" with text <primary_header_text>
        And I should see an element "additional_header" with text <additional_header_text>
        And I should see an element "review_header" with text <reviews_header_text>
        And I should see an element "go_header" with text <go_header_text>
        And I should see an element "phenotype_header" with text <phenotype_header_text>
        And I should see an element "interaction_header" with text <interaction_header_text>
        And I should see an element "regulation_header" with text <regulation_header_text>

    Examples:
        | gene    | title               | primary_header_text               | additional_header_text    | reviews_header_text   | go_header_text    | phenotype_header_text | interaction_header_text   | regulation_header_text    |
        | "ACT1"  | "ACT1 Literature"   | "238"                             | "671"                     | "135"                 | "20"              | "6"                   | "204"                     | "9"                       |

    Scenario Outline: Click download buttons
        When I visit "/locus/?/literature" for <gene>
        And I click the button with id <button>
        Then I should download a file named <filename>

    Examples:
        | gene    | button              | filename                          |
        | "ACT1"  | "export_primary"    | "ACT1_primary_citations.nbib"     |
        | "ACT1"  | "export_additional" | "ACT1_additional_citations.nbib"  |
        | "ACT1"  | "export_review"    | "ACT1_review_citations.nbib"      |
        | "ACT1"  | "export_go"         | "ACT1_go_citations.nbib"          |
        | "ACT1"  | "export_phenotype"  | "ACT1_phenotype_citations.nbib"   |
        | "ACT1"  | "export_interaction"| "ACT1_interaction_citations.nbib" |
        | "ACT1"  | "export_regulation" | "ACT1_regulation_citations.nbib"  |

