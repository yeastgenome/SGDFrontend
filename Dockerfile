FROM ubuntu:20.04

# see https://github.com/docker-library/python/blob/master/3.8/bullseye/Dockerfile#L13
ENV LANG C.UTF-8

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles
RUN apt-get update && apt-get install -y --no-install-recommends \
        software-properties-common \
        libbluetooth-dev \
        tk-dev \
        uuid-dev \
        wget \
        build-essential \
        libssl-dev \
        libffi-dev \
        git

RUN add-apt-repository -y ppa:deadsnakes \
    && apt-get update

RUN apt-get install -y --no-install-recommends \
        python3-dev \
        python3.8 \
        python3.8-venv \
        python3-pip \
        nodejs \
        npm \
        ruby-full

# Symlink python to installed python3
RUN cd /usr/bin && ln -s python3 python

COPY . /frontend

RUN npm install -g bower -g grunt-cli

WORKDIR /frontend

RUN cp src/sgd/frontend/default_config.py src/sgd/frontend/config.py

# Dependencies
RUN gem install bundler
RUN npm install
RUN bundle install
RUN npm run format
RUN grunt --force
RUN pip install -r requirements.txt
RUN python setup.py develop

# gem install ffi -v '1.9.10' -- --with-cflags="-Wno-error=implicit-function-declaration"

RUN ruby --version

CMD ["/bin/bash", "-c", "source dev_deploy_variables.sh && pserve sgdfrontend_development.ini"]
