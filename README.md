#SGD Website Project

This project is a frontend webaplication used for the SGD Nextgen Redesign. It retreives data in JSON format from
SGDBackend, then creates the pages of the website.

There is only one package in this project...

1. **sgdfrontend**

 This package contains the templates and code for the SGDNextGen site.
 
Instructions
Dependencies:
* Pyramid
* Waitress
* simplejson
(The above are all python packages.)

To start the application:

$ pserve development.ini

To run off of a different backend:
Set the backend_url parameter in the config file to the URL of the new backend.