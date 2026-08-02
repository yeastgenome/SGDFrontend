deploy-assets:
	. dev_deploy_variables.sh && npm run build && npm run upload

dev-deploy:
	. dev_deploy_variables.sh && npm run build && npm run upload && cap dev deploy

qa-deploy:
	. dev_deploy_variables.sh && npm run build && npm run upload && cap qa deploy

qa-deploy-test:
	. dev_deploy_variables.sh && npm run build && npm run upload && cap qa deploy

staging-deploy:
	. prod_deploy_variables.sh && npm run build && npm run upload && cap staging deploy

prod-deploy:
	. prod_deploy_variables.sh && npm run build && npm run upload && cap prod deploy

preview-deploy:
	. dev_deploy_variables.sh && npm run build && npm run upload && cap preview deploy

run-prod:
	pserve sgdfrontend_production.ini --daemon --pid-file=/var/run/pyramid/frontend.pid

stop-prod:
	-pserve sgdfrontend_production.ini --stop-daemon --pid-file=/var/run/pyramid/frontend.pid

build: dependencies build-assets
	pip install -r requirements.txt
	python setup.py develop

build-deploy:
	pip install -r requirements.txt
	python setup.py develop

build-assets:
	npm run build

dependencies:
	npm install
	bundle install
	npm run format
	# npm run lint

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
