# SGDBackend-Nex2

A restful Flask+Gevent web service for the Saccharomyces Genome Database (SGD) NEX 2.

## How to install

For security purposes we mantain config files in the shell environment and we do not integrate them into our code. To build the project you will need to have the following environment variables set:

<pre>
NEX2_URI  -  database connection URI
</pre>

Then, execute the following commands:

<pre>
  mkvirtualenv sgd2
  make
</pre>

You might experience problems installing the lib gevent on Mac. In case of problems, install it manually by running:

<pre>
CFLAGS='-std=c99' pip install gevent==1.0.2
</pre>

## How to run:

For a development environment running the Flask server only:

<pre>
make run
</pre>

For a production environemnt running Gevent-WSGI server:

<pre>
make run-prod
</pre>
