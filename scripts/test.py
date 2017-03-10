import json
import csv
import loading.load_summaries as ls
from loading.database_session import get_dev_session
nex_session = get_dev_session()

filename = 'summary_test.txt'

f = open(filename, 'r')
datareader = csv.reader(f, delimiter='\t')
data = ls.load_summaries(nex_session, datareader)

print json.dumps(data, sort_keys=True, indent=4)
