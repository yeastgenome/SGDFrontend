deploy-assets:
	. dev_deploy_variables.sh && grunt deployAssets

dev-deploy:
	. dev_deploy_variables.sh && grunt deployAssets && cap dev deploy

qa-deploy:
	. dev_deploy_variables.sh && grunt deployAssets && cap qa deploy

qa-deploy-test:
	. dev_deploy_variables.sh && grunt deployAssetsTest && cap qa deploy

staging-deploy:
	. prod_deploy_variables.sh && grunt deployAssets && cap staging deploy

prod-deploy:
	. prod_deploy_variables.sh && grunt deployAssets && cap prod deploy

preview-deploy:
	. dev_deploy_variables.sh && grunt deployAssets && cap preview deploy

run-prod:
	pserve sgdfrontend_production.ini --daemon --pid-file=/var/run/pyramid/frontend.pid

stop-prod:
	-pserve sgdfrontend_production.ini --stop-daemon --pid-file=/var/run/pyramid/frontend.pid

build: dependencies grunt
	pip install -r requirements.txt
	python setup.py develop

build-deploy:
	pip install -r requirements.txt
	python setup.py develop

grunt:
	grunt

dependencies:
	npm install
	npm install -g grunt-cli
	bundle install

run:
	. dev_deploy_variables.sh && pserve sgdfrontend_development.ini --reload

tests:
	nosetests test/

# add START_URL env variable to point at non-production environment
ghost:
	. dev_deploy_variables.sh && python lib/ghost/run_remote_ghost.py && open $$GHOST_SUITE_BROWSER_URL

ghost-dev:
	. dev_deploy_variables.sh  && START_URL=http://$$DEV_SERVER python lib/ghost/run_remote_ghost.py && open $$GHOST_SUITE_BROWSER_URL

ghost-with-alert:
	. prod_deploy_variables.sh && python lib/ghost/run_remote_ghost.py && open $$GHOST_SUITE_BROWSER_URL

ghost-local:
	. dev_deploy_variables.sh && python lib/ghost/run_local_ghost.py && open $$GHOST_SUITE_BROWSER_URL

dev-deploy-ghost: dev-deploy ghost-dev
