#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
export WORKON_HOME=/data/envs/
source virtualenvwrapper.sh
workon sgd
. prod_variables.sh
/usr/bin/make stop-prod
/usr/bin/make run-prod
