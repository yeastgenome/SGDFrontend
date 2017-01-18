.PHONY: test lib config

build:
	npm install --production
	webpack
	pip install -r requirements.txt
	python setup.py develop

prod-build:
	pip install -r requirements.txt
	python setup.py develop

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
	pserve production.ini --daemon --pid-file=/var/run/pyramid/backend.pid

stop-prod:
	-pserve production.ini --stop-daemon --pid-file=/var/run/pyramid/backend.pid

lint:
	eslint src/client/js/

index-es:
	source dev_variables.sh && python scripts/search/index_elastic_search.py
