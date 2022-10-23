FROM ubuntu:20.04

WORKDIR /data/www
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
	git \
        make \
        nodejs \
	npm \
        python3-pip \
        ruby \
        ruby-dev \
	tzdata \
    && gem install bundler \
    && git clone https://github.com/yeastgenome/SGDFrontend.git

WORKDIR /data/www/SGDFrontend
RUN git checkout master_docker \
    && npm install -g bower \
    && bower install --force \
    && pip3 install virtualenv \
    && virtualenv /data/www/SGDFrontend/venv \
    && . /data/www/SGDFrontend/venv/bin/activate \
    && pip3 install -U setuptools==57.5.0 \
    && make build 

WORKDIR /data/www/logs

WORKDIR /

CMD ["sh", "-c", ". /data/www/SGDFrontend/venv/bin/activate && pserve $INI_FILE --reload"]
