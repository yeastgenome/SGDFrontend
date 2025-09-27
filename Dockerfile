FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Etc/UTC \
    HOME=/root \
    LANG=C.UTF-8

WORKDIR /data/www

# --- Base system deps ----------------------------------------------------------------
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl gnupg \
      git make build-essential \
      ruby ruby-dev \
      emboss \
      tzdata \
      xz-utils \
      libffi-dev pkg-config \
 && rm -rf /var/lib/apt/lists/*

# --- Install Python 3.10 from deadsnakes (24.04 default is 3.12) ----------------------
# (We only need python3.10; virtualenv will supply pip in the venv.)
RUN set -eux; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xBA6932366A755776" \
      | gpg --dearmor > /etc/apt/keyrings/deadsnakes.gpg; \
    echo "deb [signed-by=/etc/apt/keyrings/deadsnakes.gpg] http://ppa.launchpad.net/deadsnakes/ppa/ubuntu noble main" \
      > /etc/apt/sources.list.d/deadsnakes-ppa.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends python3.10 python3.10-dev python3.10-distutils; \
    rm -rf /var/lib/apt/lists/*

# --- Node 16 (stable for legacy Bower/Grunt stacks) -----------------------------------
ENV NODE_VERSION=v16.20.2 \
    NODE_DIST=node-v16.20.2-linux-x64 \
    NODE_HOME=/usr/local/node16
RUN curl -fsSL https://nodejs.org/dist/${NODE_VERSION}/${NODE_DIST}.tar.xz -o /tmp/node.tar.xz \
 && mkdir -p ${NODE_HOME} \
 && tar -xJf /tmp/node.tar.xz -C ${NODE_HOME} --strip-components=1 \
 && ln -sf ${NODE_HOME}/bin/node /usr/local/bin/node \
 && ln -sf ${NODE_HOME}/bin/npm  /usr/local/bin/npm \
 && ln -sf ${NODE_HOME}/bin/npx  /usr/local/bin/npx \
 && rm -f /tmp/node.tar.xz
ENV PATH="${NODE_HOME}/bin:${PATH}" \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_unsafe_perm=true
RUN node -v && npm -v && npm install -g bower@1.8.14 grunt-cli

# --- Ruby toolchain (Compass on Ruby 3.2 needs tiny shim) ------------------------------
RUN gem install --no-document bundler -v 2.4.22 \
 && gem install --no-document compass sass \
 && mkdir -p /usr/local/lib/ruby/compat \
 && printf '%s\n' \
    'class << File; alias exists? exist? unless respond_to?(:exists?); end' \
    'class << Dir;  alias exists? exist? unless respond_to?(:exists?); end' \
    > /usr/local/lib/ruby/compat/file_exists_patch.rb
ENV RUBYLIB=/usr/local/lib/ruby/compat \
    RUBYOPT=-rfile_exists_patch

# --- App checkout + runtime dirs ------------------------------------------------------
RUN git clone https://github.com/yeastgenome/SGDFrontend.git \
 && mkdir -p /data/www/logs /data/www/tmp
WORKDIR /data/www/SGDFrontend
RUN git checkout master_docker \
 && git config --global url."https://".insteadOf git://

# Bundler (ffi uses system libffi)
ENV BUNDLE_SILENCE_ROOT_WARNING=1 \
    BUNDLE_WITHOUT="development test" \
    BUNDLE_PATH=vendor/bundle \
    BUNDLE_JOBS=4 \
    BUNDLE_BUILD__FFI="--enable-system-libffi"
RUN bundle update ffi rb-inotify --conservative || true \
 && bundle install --retry 3

# --- Frontend JS deps BEFORE Makefile (so we can skip re-running them there) ----------
RUN bower install --force --allow-root \
 && npm install --legacy-peer-deps

# --- Python venv (use Python 3.10 explicitly) ----------------------------------------
RUN curl -fsSL https://bootstrap.pypa.io/virtualenv.pyz -o /tmp/virtualenv.pyz \
 && python3.10 /tmp/virtualenv.pyz /data/www/SGDFrontend/venv \
 && rm -f /tmp/virtualenv.pyz

# Pin pip/setuptools for older build chains
RUN /data/www/SGDFrontend/venv/bin/pip install --no-cache-dir "pip<25" "setuptools<70" wheel \
 && /data/www/SGDFrontend/venv/bin/pip install --no-cache-dir -r requirements.txt

# Use venv python/pip by default; enable legacy/compat editable install
ENV VENV=/data/www/SGDFrontend/venv \
    PATH="/data/www/SGDFrontend/venv/bin:${PATH}" \
    PIP_NO_BUILD_ISOLATION=1 \
    SETUPTOOLS_USE_DISTUTILS=local \
    SETUPTOOLS_ENABLE_FEATURES=legacy-editable

# Install project in editable mode BEFORE running make (replaces setup.py develop)
RUN pip install -e . --no-build-isolation --config-settings editable_mode=compat

# --- Patch Makefile to avoid global installs / setup.py develop -----------------------
RUN set -eux; \
  sed -i -E 's|^([[:space:]]*)npm[[:space:]]+install\b.*|\1@true # skipped: handled in Dockerfile|g' Makefile || true; \
  sed -i -E 's|^([[:space:]]*)bower[[:space:]]+install\b.*|\1@true # skipped: handled in Dockerfile|g' Makefile || true; \
  sed -i -E 's|^([[:space:]]*)python([0-9\.]*)?[[:space:]]+setup\.py[[:space:]]+develop.*|\1@true # skipped: handled in Dockerfile|g' Makefile || true

# --- Build (runs grunt/compass via your Makefile) -------------------------------------
RUN make build

# --- Emboss step (unchanged) ----------------------------------------------------------
WORKDIR /data/www/SGDFrontend/src/sgd/tools/seqtools/emboss
RUN /usr/bin/rebaseextract -infile withrefm.809 -protofile proto.809

# --- Serve the Pyramid app ------------------------------------------------------------
WORKDIR /
ENV INI_FILE=/data/www/SGDFrontend/development.ini
EXPOSE 6543
CMD ["sh", "-c", ". /data/www/SGDFrontend/venv/bin/activate && pserve $INI_FILE --reload"]

