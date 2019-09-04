#! /bin/sh

cd /data/www/SGDBackend-NEX2/current
source /data/envs/sgd3/bin/activate && source prod_variables.sh && python src/loading/scrapy/pages/spiders/pages_spider.py
