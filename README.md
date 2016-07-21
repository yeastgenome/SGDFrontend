#SGD Website Project

This project is a frontend webaplication used for the SGD Nextgen Redesign. It retreives data in JSON format from
SGDBackend, then creates the pages of the website.

##Building the app

To build the application (make sure you have node.js > 4.20 and python 2.7.x):

    $ make build

Set configuration variables in `src/sgd/frontend/config.py`, which doesn't exist at first, and is in the .gitignore.  To create with default values, run

    $ cp src/sgd/frontend/default_config.py src/sgd/frontend/config.py

To run off of a different backend: Set the backend_url parameter in the config file to the URL of the new backend. 
    
To start the application:

    $ make run

##Deploying Assets

In production, assets are served from Amazon Cloudfront.  Before deploying to a server, be sure to run 

    $ make deploy-assets

and then commit changes to git.

##Using the Development Task

In the production buildout, asset preparation tasks run from start to finish.  In development, however, there is an option to compile these assets, and then recompile them automatically when changes have been made.  To use this task, run:

    $ grunt dev

This will compile the JSX files and the SASS files in the client directory.  If you make any changes to these files while this task is running, they will automatically recompile.  Optionally, if you are using Chrome, you can install the [live reload plugin](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en), which will reload the browser once the changed files have finished compiling.  Another difference between the development and production compile is that the bundled application.js file will be unminified with source maps, to help debug.  To stop this task, type `ctrl + c`.

##Browserify

The bundled application.js is compiled using [browserify](http://browserify.org/).  Future client dependencies should be installed with NPM, and required using the CommonJS style.

##JSX and React

Many of the files that compose the bundled application.js are [JSX](http://jsx.github.io/) files, compiled using the harmony option, which allows some ES6 features.  Future additions to the client/jsx directory should also have a .jsx extension.  JSX features are optional in a JSX file.  While using supported ES6 features is encouraged, it is possible to write plain JavaScript in a JSX file.

Some pages are written using the [react](http://facebook.github.io/react/) framework.  The react components are stored in the client/jsx/components directory, and future react components should follow.

##Testing

Integration tests are run using ghost inspector.  The tests are configured using their service.

Make sure the ghost inspector variables are in dev_deploy_variables.sh

### Test Production

By running

    $ make prod-test

This command will email all the developers if a test fails.  To run a silent test that sends no emails, run

    $ make silent-test

the test suite will run against http://yeastgenome.org.  To run on a different server (such as staging) run

    $ START_URL=http://your-server.edu make remote-test

### Test Locally

First, download ngrok (add URL) and start your ngrok server [https://ngrok.com/download](https://ngrok.com/download) This will tunnel requests from bgrok to your local development environment.

Then, run

    $ make local-test
