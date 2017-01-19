import csv
import time

# takes a TSV file and returns an array of annotations
def parse_tsv_annotations(tsv_file, template_type):
    time.sleep(1)
    raw_content = csv.reader(tsv_file, delimiter='\t')
    return [
        {
            'type': 'locus',
            'values': {
                'name': 'RAD54',
                'href': 'http://www.yeastgenome.org/locus/rad54/overview',
                'type': 'protein summary',
                'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
            }
        }
    ]
