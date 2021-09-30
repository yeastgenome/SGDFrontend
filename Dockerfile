FROM ubuntu:20.04 AS base
# To use multiple FROM, use `export DOCKER_BUILDKIT=1`

# see https://github.com/docker-library/python/blob/master/3.8/bullseye/Dockerfile#L13
ENV LANG C.UTF-8

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=America/Los_Angeles

RUN apt-get update && apt-get install -y --no-install-recommends \
        sudo \
        software-properties-common \
        tk-dev \
        uuid-dev \
        wget \
        build-essential \
        libssl-dev \
        libffi-dev \
        git \
        python3-dev \
        python3.8 \
        python3.8-venv \
        python3-pip \
        nodejs \
        npm \
        ruby-full

# Symlink python to installed python3
RUN cd /usr/bin && ln -s python3 python


RUN npm install -g bower -g grunt-cli

COPY . /frontend
WORKDIR /frontend

# Create frontend default config
RUN cp src/sgd/frontend/default_config.py src/sgd/frontend/config.py

# Other Dependencies
RUN gem install bundler
RUN npm install
RUN bundle install
RUN npm run format
RUN grunt --force
RUN pip install -r requirements.txt
RUN python setup.py develop

EXPOSE 6545
CMD ["/bin/bash", "-c", "source dev_deploy_variables.sh && pserve sgdfrontend_development.ini"]

FROM base as vagrant
# Much of this is inspired from https://github.com/dholth/vagrant-docker/blob/master/Dockerfile
# which essentially installs SSH capabilities onto the container

RUN apt-get install -y --no-install-recommends \
    openssh-server \
    openssh-client


# Create vagrant user
RUN useradd --create-home -s /bin/bash vagrant
RUN echo -n 'vagrant:vagrant' | chpasswd
RUN echo 'vagrant ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/vagrant
RUN chmod 440 /etc/sudoers.d/vagrant

WORKDIR /home/vagrant

# Allow vagrant to login, SSH config
RUN mkdir .ssh
RUN chmod 700 .ssh
RUN echo "ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA6NF8iallvQVp22WDkTkyrtvp9eWW6A8YVr+kz4TjGYe7gHzIw+niNltGEFHzD8+v1I2YJ6oXevct1YeS0o9HZyN1Q9qgCgzUFtdOKLv6IedplqoPkcmF0aYet2PkEDo3MlTBckFXPITAMzF8dJSIFo9D8HfdOV0IAdx4O7PtixWKn5y2hMNG0zQPyUecp4pzC6kivAIhyfHilFR61RGL+GPXQ2MWZWFYbAGjyiYJnAmCP3NOTd0jMZEnDkbUvxhMmBYSdETk1rRgm+R4LOzFUGaHqHDLKLX+FIPKcF96hrucXzcWyLbIbEgE98OHlnVYCzRdK8jlqm8tehUc9c9WhQ==" > /home/vagrant/.ssh/authorized_keys
RUN chown -R vagrant:vagrant .ssh
RUN chmod 600 .ssh/authorized_keys

RUN sed -i -e 's~\(.*\) requiretty$~#\1requiretty~' /etc/sudoers

RUN sed -i \
    -e 's~^#PermitRootLogin yes~PermitRootLogin no~g' \
    -e 's~^PasswordAuthentication yes~PasswordAuthentication no~g' \
    -e 's~^#UseDNS yes~UseDNS no~g' \
    -e 's/\(UsePAM \)yes/\1 no/' \
    /etc/ssh/sshd_config

RUN mkdir -p /run/sshd
RUN chmod 0755 /run/sshd

# Disable annoying log messages (though they cannot be filtered from journalctl)
# RUN echo ":msg, contains, \"Time has been changed\" ~" > /etc/rsyslog.d/time_msgs.conf

EXPOSE 22

# Start ssh in the foreground
CMD ["/usr/sbin/sshd", "-D"]


# FROM base as prod
# do production stuff
