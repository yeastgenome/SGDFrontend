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
* requests
(The above are all python packages.)

To build the application:

    $ python bootstrap.py
    $ bin/buildout
    
To start the application:

    $ bin/pserve sgdfrontend_development.ini

To run off of a different backend:
Set the backend_url parameter in the config file to the URL of the new backend.

##Notes on SASS/Compass

[SASS](http://sass-lang.com/) and [Compass](http://compass-style.org/) are being used. Before running to app, you need to builld the css files by starting 'compass watch' or doing a 'compass compile' (see below).

###Installing

Both can be installed via Ruby gems:

    $ gem install sass
    $ gem install compass

###Compiling "on the fly"


Compass can watch for any changes made to .scss files and instantly compile them to .css. To start this, from the root of the project (where config.rb is) do:

    $ compass watch

You can specify whether the compiled CSS is minified or not in config.rb. (Currently, it is set to minify.)

###Force compiling

    $ compass compile

Again, you can specify whether the compiled CSS is minified or not in config.rb.

Also see the [Compass Command Line Documentation](http://compass-style.org/help/tutorials/command-line/) and the [Configuration Reference](http://compass-style.org/help/tutorials/configuration-reference/).

And of course:

    $ compass help
