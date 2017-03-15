deploy-assets:
	. dev_deploy_variables.sh && grunt deployAssets

dev-deploy:
	. dev_deploy_variables.sh && AWS_ENV=true cap dev deploy

qa-deploy:
	. dev_deploy_variables.sh && AWS_ENV=true cap qa deploy

beta-deploy:
	. dev_deploy_variables.sh && cap beta deploy

staging-deploy:
	. prod_deploy_variables.sh && cap staging deploy

# to deploy to both production instances at once, remember Uncle Ben ...
#prod-deploy:
#	. prod_deploy_variables.sh && cap prod deploy

aws-dev-deploy:
	. dev_deploy_variables.sh && AWS_ENV=true cap aws_dev deploy

curate-qa-deploy:
	. dev_deploy_variables.sh && AWS_ENV=true cap aws_curate_qa deploy

run-prod:
	pserve sgdfrontend_aws.ini --daemon --pid-file=/var/run/pyramid/frontend.pid

stop-prod:
	pserve sgdfrontend_aws.ini --stop-daemon --pid-file=/var/run/pyramid/frontend.pid

prod1-deploy:
	. prod_deploy_variables.sh && cap prod1 deploy

prod2-deploy:
	. prod_deploy_variables.sh && cap prod2 deploy

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
	. dev_deploy_variables.sh  && START_URL=http://$$SERVER python lib/ghost/run_remote_ghost.py && open $$GHOST_SUITE_BROWSER_URL

ghost-with-alert:
	. prod_deploy_variables.sh && python lib/ghost/run_remote_ghost.py && open $$GHOST_SUITE_BROWSER_URL

ghost-local:
	. dev_deploy_variables.sh && python lib/ghost/run_local_ghost.py && open $$GHOST_SUITE_BROWSER_URL

dev-deploy-ghost: dev-deploy ghost-dev
