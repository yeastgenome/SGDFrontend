@browser
Feature: SEARCH
    @basic
    Scenario: go to LSP for an ORF name
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
    	And I search "YJR065C"        
    	And I wait 2 seconds
    	And I should be at "http://localhost:6545/locus/S000003826/overview"

    Scenario: go to LSP for an ORF name with lowercase letters
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "yjr065C"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000003826/overview"

    Scenario: go to LSP for a primary SGDID
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "S000006778"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000006778/overview"

   Scenario: go to LSP for a secondary SGDID
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "L000003770"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000006778/overview"

    Scenario: go to LSP for a standard gene name
        When I visit "/locus/?/overview" for "ACT1"
	And I wait 2 seconds
        And I search "BUD2"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000001575/overview"

    Scenario: go to LSP for an alias name
        When I visit "/locus/?/overview" for "ACT1"
	And I wait 2 seconds
        And I search "ACT4"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000003826/overview"

    Scenario: go to "old" lucene search page for a gene name which is an alias for another gene 
        When I visit "/locus/?/overview" for "ACT1"
	And I wait 2 seconds
        And I search "SME1"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/cgi-bin/search/luceneQS.fpl?query=SME1"

    Scenario: go to LSP for gene name with punctuation
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "DUR1,2"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000000412/overview"

    Scenario: go to LSP for gene name with punctuation
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "ARS603.5"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000007645/overview" 

    Scenario: go to LSP for a tRNA name 
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "tY(GUA)F1"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000006779/overview"
    
    
    Scenario: go to "old" lucene search for a keyword search (eg, kinase) 
        When I visit "/locus/?/overview" for "ACT1"
	And I wait 2 seconds
	And I search "kinase"
	And I wait 2 seconds
	And I should be at "http://localhost:6545/cgi-bin/search/luceneQS.fpl?query=kinase"

     Scenario: go to "old" lucene search for wildcard search (eg, act*)
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "act*"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/cgi-bin/search/luceneQS.fpl?query=act*"
	
     Scenario: go to "old" lucene search for "eurie' wildcard search (eg, 1,*)
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "1,*"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/cgi-bin/search/luceneQS.fpl?query=1,*"

      Scenario: go to LSP for a short gene name (eg, HO)
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "HO"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/locus/S000002386/overview"
    
      Scenario: go to reference page for a pmid
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "2121369"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/reference/S000044948/overview"

      Scenario: go to reference page for a ref SGDID
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "S000044948"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/reference/S000044948/overview"

      Scenario: go to GO term page for a GOID
        When I visit "/locus/?/overview" for "ACT1"
        And I wait 2 seconds
        And I search "7533"
        And I wait 2 seconds
        And I should be at "http://localhost:6545/go/GO:0007533/overview"

   
