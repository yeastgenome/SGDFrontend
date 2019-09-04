#!/bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd3/bin/activate 
source prod_variables.sh 
python scripts/loading/ontology/ec.py
python scripts/loading/dbxref/update_ec.py
python scripts/loading/ontology/ro.py
python scripts/loading/ontology/disease.py
python scripts/loading/ontology/eco.py
python scripts/loading/ontology/edam.py
python scripts/loading/ontology/efo.py
python scripts/loading/ontology/obi.py
python scripts/loading/ontology/psimi.py
python scripts/loading/ontology/psimod.py
python scripts/loading/ontology/so.py
python scripts/loading/ontology/taxonomy.py
