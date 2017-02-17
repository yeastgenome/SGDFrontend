import json
import csv
import loading.load_summaries as ls

filename = 'loading/data/16-11phenoSummaries.txt'
datatype = 'Phenotype'

f = open(filename, 'r')
datareader = csv.reader(f, delimiter='\t')
data = ls.load_summaries(datatype, datareader)

print json.dumps(data, sort_keys=True, indent=4)
