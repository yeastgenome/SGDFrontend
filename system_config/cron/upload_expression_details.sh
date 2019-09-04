#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd3/bin/activate && source prod_variables.sh && python scripts/loading/upload_expression_details.py &>> /data/www/logs/expression_worker.log
