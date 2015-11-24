build:
	@pip install -r requirements.txt

run:
	@python src/app.py

tests:
	@nosetests

dev-deploy:
	. dev_deploy_variables.sh && cap dev deploy

prod-deploy:
	. prod_deploy_variables.sh && cap prod deploy
