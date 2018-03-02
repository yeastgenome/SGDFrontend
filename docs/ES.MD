ES indexing process
===================

Production elastic-search index is: searchable_items_prod. For safety reasons, you can only index this index when you're in the curate_staging_server. Please note access to the server is restricted.

Development elastic-search index is: searchable_items_dev. indexing this is similiar to above and also restricted.

Testing elastic-search index is: searchable_items_test. This is used for sanity checks if changes to mapping or index script is changed. It's recommended to have things run in you local first before messing around with this. Writing to index is similar to the above. 

Local elactic-search is: searchable_items_local. This is the only place you can do as you please. You have full access since its your own sandbox.

How to index in Curate Staging Server(s)
----------------------------------------
* Deploy backend to the curate-staging server. Make sure you have set appropriate variables for the index.
* SSH into the curate-staging-server. 
* Run the indexing script
* Check back to your local web-application to make sure you're getting the desired results
* Run ghost inspector against your sand-box to make sure the tests are passing
