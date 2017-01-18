from elasticsearch import helpers
from elasticsearch import Elasticsearch

CLIENT_ADDRESS = 'http://localhost:9200'
SRC_INDEX = 'sequence_objects'
INDEX = 'sequence_objects2'
DOC_TYPE = 'sequence_object'
RESET_INDEX = False
# TEMP, trigger runscope test, should be ENV var with default to False
TEST = False
RUNSCOPE_TRIGGER_URL = ''

es = Elasticsearch(CLIENT_ADDRESS)

codon_table = {'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
               'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
               'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
               'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
               'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
               'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
               'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
               'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
               'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
               'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
               'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
               'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
               'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
               'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
               'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
               'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'}

def setup_index():
	exists = es.indices.exists(INDEX)
	if RESET_INDEX and exists:
		es.indices.delete(INDEX)
		es.indices.create(INDEX)
		put_mapping()
	elif not exists:
		es.indices.create(INDEX)
		put_mapping()
	return

def put_mapping():
	other_mapping_settings = {
		'properties': {
			'contig_name': {
				'type': 'string',
				'index': 'not_analyzed'
			}
		}
	}
	full_settings = {}
	full_settings[DOC_TYPE] = other_mapping_settings
	es.indices.put_mapping(index=INDEX, body=full_settings, doc_type=DOC_TYPE)

def index_locus(old_data):
	# calc variant data
	# get introns in { start, end } format
	locus_id = old_data['sgdid']
	print 'reindexing ' + locus_id
	old_data = es.get(index=SRC_INDEX, id=locus_id)['_source']
	block_starts = old_data['block_starts']
	block_sizes = old_data['block_sizes']

	if len(block_starts) <= 1:
		introns = []
	else:
		introns = []
		i = 0
		for b_size in block_sizes:
			if i == len(block_sizes) - 1:
				continue
			b_start = block_starts[i]
			next_b_start = block_starts[i + 1]
			_start = b_start + b_size
			_end = next_b_start - 1
			obj = { 'start': _start, 'end': _end }
			introns.append(obj)
			start = b_start + b_size
			i += 1

	_variant_data_dna = calculate_variant_data('DNA', old_data['aligned_dna_sequences'], introns)
	_variant_data_protein = calculate_variant_data('Protein', old_data['aligned_protein_sequences'], [])

	old_data['variant_data_dna'] = _variant_data_dna
	old_data['variant_data_protein'] = _variant_data_protein
	es.index(index=INDEX, doc_type=DOC_TYPE, id=old_data['sgdid'], body=old_data)

# fetch all the loci, index in index_locus
def index_loci():
        # fetch all
        body = {'query': {'match_all': {}}}
	res = es.search(index=SRC_INDEX, body=body, size=7000)
	for hit in res['hits']['hits']:
		data = hit['_source']
		try:
			index_locus(data)
		except:
			print 'error redoing ' + data['sgdid']

def translate(codon):
    if codon in codon_table:
        return codon_table[codon]
    else:
        return None


def check_snp_type(index, intron_indices, ref_seq, aligned_seq):
    #Check if SNP is in intron
    pre_introns = []
    post_introns = []
    aligned_seq_coding = ''
    ref_seq_coding = ''
    seq_index = 0
    for start, end in intron_indices:
        aligned_seq_coding += aligned_seq[seq_index:start]
        ref_seq_coding += ref_seq[seq_index:start]
        seq_index = end+1
        if index < start:
            post_introns.append((start, end))
        elif index > end:
            pre_introns.append((start, end))
        else:
            return 'Intron SNP'
    aligned_seq_coding += aligned_seq[seq_index:len(aligned_seq)]
    ref_seq_coding += ref_seq[seq_index:len(ref_seq)]
    index_coding = index - sum([end-start+1 for start, end in pre_introns])

    #Introns have been removed, now deal with insertions/deletions and find frame
    index_to_frame = {}
    codon = []
    for i, letter in enumerate(ref_seq_coding):
        if letter == '-':
            pass
        else:
            codon.append(i)
        if len(codon) == 3:
            for index in codon:
                index_to_frame[index] = codon
            codon = []

    codon = index_to_frame[index_coding]
    ref_amino_acid = translate(''.join([ref_seq_coding[i] for i in codon]))
    aligned_amino_acid = translate(''.join([aligned_seq_coding[i] for i in codon]))

    if ref_amino_acid is None or aligned_amino_acid is None:
        return 'Untranslatable SNP'
    elif ref_amino_acid == aligned_amino_acid:
        return 'Synonymous SNP'
    else:
        return 'Nonsynonymous SNP'


def calculate_variant_data(type, aligned_sequences, introns):
    intron_indices = [(int(x['start']), int(x['end'])) for x in introns]
    variants = dict()
    reference_alignment = [x['sequence'] for x in aligned_sequences if x['strain_id'] == 1]
    if len(reference_alignment) == 1:
        reference_alignment = reference_alignment[0]

        for strain in aligned_sequences:
            aligned_sequence = strain['sequence']


            #print aligned_sequence[0:int(introns[0]['start'])] + aligned_sequence[int(introns[0]['end'])+1:len(aligned_sequence)]

            state = 'No difference'
            state_start_index = 0
            for i, letter in enumerate(reference_alignment):
                #Figure out new state
                new_state = 'No difference'
                if aligned_sequence[i] != letter:
                    if letter == '-':
                        new_state = 'Insertion'
                    elif aligned_sequence[i] == '-':
                        new_state = 'Deletion'
                    else:
                        if type == 'DNA':
                            new_state = check_snp_type(i, intron_indices, reference_alignment, aligned_sequence)
                        else:
                            new_state = 'SNP'

                if state != new_state:
                    if state != 'No difference':
                        variant_key = (state_start_index+1, i+1, state)
                        if variant_key not in variants:
                            variants[variant_key] = 0
                        variants[variant_key] += 1

                    state = new_state
                    state_start_index = i

            if state != 'No difference':
                variant_key = (state_start_index+1, i+1, state)
                if variant_key not in variants:
                    variants[variant_key] = 0
                variants[variant_key] += 1

    variant_data = []
    for variant, score in variants.iteritems():
        obj_json = {
            'start': variant[0],
            'end': variant[1],
            'score': score,
            'variant_type': 'SNP' if variant[2].endswith('SNP') else variant[2]
        }
        if variant[2].endswith('SNP'):
            obj_json['snp_type'] = variant[2][0:-4]
        #obj_json['sequence'] = []
        #for strain in aligned_sequences:
        #    obj_json['sequence'].append(strain['sequence'][variant[0]-1:variant[1]-1])

        variant_data.append(obj_json)
    return variant_data

def index_test_locus():
	example_id = 'S000004440'
	res = es.get(index='sequence_objects', id=example_id)['_source']
	index_locus(res)

def main():
	setup_index()
	index_loci()
	# index_test_locus()

	if TEST:
		requests.get(RUNSCOPE_TRIGGER_URL)
main()
