.PHONY: test lib config

build: config
	python setup.py develop
	export ORACLE_HOME=/data/tools/oracle_instant_client/instantclient_11_2/ && export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ORACLE_HOME && pip install -r requirements.txt

run:
	. dev_variables.sh && pserve development.ini --reload

celery:
	@celery worker -A pyramid_celery.celery_app --ini development.ini

flower:
	@celery flower -A pyramid_celery.celery_app --address=127.0.0.1 --port=5555 --ini development.ini

tests:
	. test_variables.sh && nosetests -s

config:
	. dev_variables.sh && rake -f lib/capistrano/tasks/deploy.rake deploy:local_write_config

deploy:
	. dev_variables.sh && cap dev deploy

prod-deploy:
	. prod_variables.sh && cap prod deploy
