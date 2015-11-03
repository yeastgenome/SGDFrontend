BOOTSTRAP = bootstrap.py
BUILDOUT_DEPLOY = buildout_deploy.cfg

dev-deploy:
	. dev_deploy_variables.sh && cap dev deploy

prod-deploy:
	. prod_deploy_variables.sh && cap prod deploy

build: bootstrap dependencies grunt
	.bin/buildout

build-deploy: bootstrap
	./bin/buildout -c $(BUILDOUT_DEPLOY)

bootstrap:
	python $(BOOTSTRAP)

grunt:
	grunt

dependencies:
	npm install -g grunt-cli
	sudo gem install sass
	sudo gem install compass -v 0.12.7

run:
	bin/pserve sgdfrontend_development.ini
