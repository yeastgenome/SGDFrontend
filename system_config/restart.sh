#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd/bin/activate
. prod_variables.sh
/usr/bin/make stop-prod
/usr/bin/make run-prod
