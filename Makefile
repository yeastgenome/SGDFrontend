.PHONY: test lib config

build:
	python setup.py develop
	npm install
	webpack
	export ORACLE_HOME=/data/tools/oracle_instant_client/instantclient_11_2/ && export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ORACLE_HOME && pip install -r requirements.txt

run:
	source dev_variables.sh && webpack && pserve development.ini --reload

celery:
	source dev_variables.sh && celery worker -A pyramid_celery.celery_app --ini development.ini

flower:
	source dev_variables.sh && celery flower -A pyramid_celery.celery_app --address=127.0.0.1 --port=5555 --ini development.ini

tests:
	source test_variables.sh && nosetests -s

deploy:
	source dev_variables.sh && cap dev deploy

prod-deploy:
	source prod_variables.sh && cap prod deploy

run-prod:
	pserve production.ini --daemon --pid-file=/var/run/pyramid/pyramid.pid

stop-prod:
	-pserve production.ini --stop-daemon --pid-file=/var/run/pyramid/pyramid.pid

index-es:
	source dev_variables.sh && python scripts/index_elastic_search.py
