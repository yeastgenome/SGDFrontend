FROM alpine:latest

#WORKDIR /data/www
RUN apk add build-base \
        git \
        make \
        nodejs \
	npm \
        py3-pip \
        ruby \
        ruby-dev \
    && gem install bundler \
    && git clone https://github.com/yeastgenome/SGDFrontend.git

WORKDIR /data/www/SGDFrontend
RUN git checkout master_docker

WORKDIR /data/www/SGDFrontend/src/sgd/frontend
COPY config.py .

WORKDIR /data/www/SGDFrontend
RUN npm install -g bower \
    && bower install --force \
    && pip3 install virtualenv \
    && virtualenv /data/www/SGDFrontend/venv \
    && . /data/www/SGDFrontend/venv/bin/activate \
    && pip3 install -U setuptools==57.5.0 \
    && make build 

WORKDIR /data/www/logs

WORKDIR /

CMD ["sh", "-c", ". /data/www/SGDFrontend/venv/bin/activate && pserve $INI_FILE --reload"]
