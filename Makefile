build: write-config
	@pip install -r requirements.txt

run:
	@python src/app.py

tests:
	@nosetests

write-config:
	. dev_deploy_variables.sh && rake -f lib/capistrano/tasks/deploy.rake deploy:local_write_config

dev-deploy:
	. dev_deploy_variables.sh && cap dev deploy

prod-deploy:
	. prod_deploy_variables.sh && cap prod deploy
