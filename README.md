# SGD Website Project

[![Build Status](https://travis-ci.org/yeastgenome/SGDFrontend.svg)](https://travis-ci.org/yeastgenome/SGDFrontend)

This project is a frontend webaplication used for the SGD Nextgen Redesign. It retreives data in JSON format from
SGDBackend, then creates the pages of the website.

## Building the app

Prerequisities, node.js > 4.2.0 and python 2.7.x. o manage python dependencies, configure a virtualenv for this project. See [virtualenv guide](http://docs.python-guide.org/en/latest/dev/virtualenvs/).


### Node packages issues and versions
You may run into issues with node version. Currently the build is using Node v6.10.2. Make sure you're on this version. We're working migrate packages management to yarn and webpack so all these legacy version issues might be resolved once we make that switch. See requirements below:

1. Ruby version, point to ruby-2.3
2. Node version, point to v6.10.2
3. Bower version, point to v1.8.4(latest). Run the following commands:
        $ npm install -g bower
        $ bower install


To build the application and install dependencies.

    $ make build

Set configuration variables in `src/sgd/frontend/config.py`, which doesn't exist at first, and is in the .gitignore.  To create with default values, run

    $ cp src/sgd/frontend/default_config.py src/sgd/frontend/config.py

To run off of a different backend: Set the backend_url parameter in the config file to the URL of the new backend. 
    
To start the application:

    $ make run

## Deploying Assets

In production, assets are served from Amazon Cloudfront.  Before deploying to a server, be sure to run 

    $ make deploy-assets

and then commit changes to git.

## Using the Development Task

In the production buildout, asset preparation tasks run from start to finish.  In development, however, there is an option to compile these assets, and then recompile them automatically when changes have been made.  To use this task, run:

    $ grunt dev

This will compile the JSX files and the SASS files in the client directory.  If you make any changes to these files while this task is running, they will automatically recompile.  Optionally, if you are using Chrome, you can install the [live reload plugin](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en), which will reload the browser once the changed files have finished compiling.  Another difference between the development and production compile is that the bundled application.js file will be unminified with source maps, to help debug.  To stop this task, type `ctrl + c`.

## Browserify

The bundled application.js is compiled using [browserify](http://browserify.org/).  Future client dependencies should be installed with NPM, and required using the CommonJS style.

## JSX and React

Many of the files that compose the bundled application.js are [JSX](http://jsx.github.io/) files, compiled using the harmony option, which allows some ES6 features.  Future additions to the client/jsx directory should also have a .jsx extension.  JSX features are optional in a JSX file.  While using supported ES6 features is encouraged, it is possible to write plain JavaScript in a JSX file.

Some pages are written using the [react](http://facebook.github.io/react/) framework.  The react components are stored in the client/jsx/components directory, and future react components should follow.

## Testing

Unit tests are in the test directory, and can be run with

    $ make tests

Integration tests are run using ghost inspector.  The tests are configured using their service.

Make sure the ghost inspector variables are in dev_deploy_variables.sh.  To run the tests on a remote server, run

    $ make ghost

By default, it will run with the start URL set to http://yeastgenome.org.  To run against another URL

    $ START_URL=http://myserver.com make ghost

This task will not send any alerts if it fails.  If you want to run with alerts (like maybe after a production deploy).  For this task, the credentials are configured in prod_deploy_variables.sh.

    $ make ghost-with-alert

### Test Locally

First, download ngrok (add URL) and start your ngrok server [https://ngrok.com/download](https://ngrok.com/download) This will tunnel requests from bgrok to your local development environment.

Then, run

    $ make ghost-local


## Docker

In the top level directory there is the Dockerfile for making a docker image for the Frontend.

The model, as of now, copies the contents of SGDFrontend into the image, rather than mounting a volume to the host. This can be easily done later if we want, for development purposes.

The image is based on Ubuntu 20.04 and building the image installs python 3.8, pip, ruby, node, and npm. All dependencies for the front end are then installed and pserve can then be run.

Build the image with (make sure you're in the top level repository directory):

```
docker build --rm -t frontend --frontend plain .
```

This will copy the contents of the repo into the image *including the `dev_deploy_variables.sh` file*. This will be used to run the dev frontend.

Running the image by default will start server by running `source dev_deploy_variables.sh && pserve sgdfrontend_development.ini` internally.

To run:

```
docker run --rm -it -p 6545:6545 frontend
```

will serve the front end, and going to `localhost:6545` will show the locally running front end on docker.
