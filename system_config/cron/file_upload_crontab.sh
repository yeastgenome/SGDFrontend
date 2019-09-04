#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd3/bin/activate && source prod_variables.sh && CREATED_BY=fgondwe python scripts/loading/files/upload_files_fdb.py
