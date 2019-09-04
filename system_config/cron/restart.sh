#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd3/bin/activate
. prod_variables.sh
/usr/bin/make stop-prod >/dev/null
/usr/bin/make run-prod >/dev/null
