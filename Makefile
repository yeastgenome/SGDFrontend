build:
	@pip install -r requirements.txt

run:
	@python src/app.py

tests:
	@nosetests
