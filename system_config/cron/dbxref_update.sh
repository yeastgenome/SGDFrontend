#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd/bin/activate 
source dev_variables.sh 
python scripts/loading/dbxref/update_dbxref.py

