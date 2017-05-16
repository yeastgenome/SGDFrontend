.PHONY: test lib config

build:
	npm install
	npm run build
	pip install -r requirements.txt
	python setup.py develop

prod-build:
	pip install -r requirements.txt
	python setup.py develop

run:
	source dev_variables.sh && pserve development.ini --reload

celery:
	source dev_variables.sh && celery worker -A pyramid_celery.celery_app --ini development.ini

flower:
	source dev_variables.sh && celery flower -A pyramid_celery.celery_app --address=127.0.0.1 --port=5555 --ini development.ini

tests:
	npm test
	source test_variables.sh && nosetests -s

qa-deploy:
	source dev_variables.sh && NEX2_URI=$$QA_NEX2_URI && cap qa deploy

qa-restart:
	source dev_variables.sh && NEX2_URI=$$QA_NEX2_URI && cap qa deploy:restart

curate-deploy:
	npm run build && source dev_variables.sh && NEX2_URI=$$CURATE_NEX2_URI && cap curate_dev deploy

curate-qa-deploy:
	source dev_variables.sh && NEX2_URI=$$CURATE_NEX2_URI && cap curate_qa deploy

deploy:
	npm run build && source dev_variables.sh && cap dev deploy

staging-deploy:
	source prod_variables.sh && cap staging deploy

curate-staging-deploy:
	npm run build && source prod_variables.sh && NEX2_URI=$$CURATE_NEX2_URI && cap staging deploy

prod-deploy:
	npm run build && source prod_variables.sh && cap prod deploy

run-prod:
	pserve production.ini --daemon --pid-file=/var/run/pyramid/backend.pid

stop-prod:
	-pserve production.ini --stop-daemon --pid-file=/var/run/pyramid/backend.pid

lint:
	eslint src/client/js/

refresh-cache:
	source dev_variables.sh && python src/loading/refresh.py

refresh-prod-cache:
	export WORKON_HOME=/data/envs/ && source virtualenvwrapper.sh && workon sgd && source prod_variables.sh && python src/loading/refresh.py

index-es:
	source dev_variables.sh && python scripts/search/index_elastic_search.py
