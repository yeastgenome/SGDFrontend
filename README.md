# SGDBackend-Nex2

A restful Flask+Gevent web service for the Saccharomyces Genome Database (SGD) NEX 2.

## How to install

Run:

<pre>
  mkvirtualenv sgd2
  make
</pre>

You might experience problems installing the lib gevent on Mac. In case of problems, install it manually by running:

<pre>
CFLAGS='-std=c99' pip install gevent==1.0.2
</pre>
