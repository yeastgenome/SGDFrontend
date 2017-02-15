import json
import loading.load_summaries as ls

filename = 'loading/data/16-11phenoSummaries.txt'
datatype = 'Phenotype'

data = ls.load_summaries(datatype, filename)

print json.dumps(data, sort_keys=True, indent=4)
