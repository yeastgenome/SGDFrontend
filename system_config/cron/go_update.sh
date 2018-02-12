#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd/bin/activate 
source prod_variables.sh 
python scripts/loading/ontology/go.py
python scripts/loading/go/load_gpad.py 'manually curated'
python scripts/loading/go/load_gpad.py computational
python scripts/dumping/curation/dump_go_annotations.py 
