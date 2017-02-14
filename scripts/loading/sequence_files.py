__author__ = 'sweng66'

sequence_files = [    ("src/sgd/convert/data/strains/AWRI1631_ABSV01000000.gff", "src/sgd/convert/data/strains/AWRI1631_ABSV01000000_cds.fsa.txt", 'AWRI1631'),
                      ("src/sgd/convert/data/strains/AWRI796_ADVS01000000.gff", "src/sgd/convert/data/strains/AWRI796_ADVS01000000_cds.fsa.txt", 'AWRI796'),
                      ("src/sgd/convert/data/strains/CBS7960_AEWL01000000.gff", "src/sgd/convert/data/strains/CBS7960_AEWL01000000_cds.fsa.txt", 'CBS7960'),
                      ("src/sgd/convert/data/strains/CLIB215_AEWP01000000.gff", "src/sgd/convert/data/strains/CLIB215_AEWP01000000_cds.fsa.txt", 'CLIB215'),
                      ("src/sgd/convert/data/strains/EC1118_PRJEA37863.gff", "src/sgd/convert/data/strains/EC1118_PRJEA37863_cds.fsa.txt", 'EC1118'),
                      ("src/sgd/convert/data/strains/EC9-8_AGSJ01000000.gff", "src/sgd/convert/data/strains/EC9-8_AGSJ01000000_cds.fsa.txt", 'EC9-8'),
                      ("src/sgd/convert/data/strains/FostersB_AEHH01000000.gff", "src/sgd/convert/data/strains/FostersB_AEHH01000000_cds.fsa.txt", "FostersB"),
                      ("src/sgd/convert/data/strains/FostersO_AEEZ01000000.gff", "src/sgd/convert/data/strains/FostersO_AEEZ01000000_cds.fsa.txt", "FostersO"),
                      ("src/sgd/convert/data/strains/JAY291_ACFL01000000.gff", "src/sgd/convert/data/strains/JAY291_ACFL01000000_cds.fsa.txt", 'JAY291'),
                      ("src/sgd/convert/data/strains/Kyokai7_BABQ01000000.gff", "src/sgd/convert/data/strains/Kyokai7_BABQ01000000_cds.fsa.txt", 'Kyokai7'),
                      ("src/sgd/convert/data/strains/LalvinQA23_ADVV01000000.gff", "src/sgd/convert/data/strains/LalvinQA23_ADVV01000000_cds.fsa.txt", 'LalvinQA23'),
                      ("src/sgd/convert/data/strains/PW5_AFDC01000000.gff", "src/sgd/convert/data/strains/PW5_AFDC01000000_cds.fsa.txt", 'PW5'),
                      ("src/sgd/convert/data/strains/T7_AFDE01000000.gff", "src/sgd/convert/data/strains/T7_AFDE01000000_cds.fsa.txt", 'T7'),
                      ("src/sgd/convert/data/strains/UC5_AFDD01000000.gff", "src/sgd/convert/data/strains/UC5_AFDD01000000_cds.fsa.txt", 'UC5'),
                      ("src/sgd/convert/data/strains/Vin13_ADXC01000000.gff", "src/sgd/convert/data/strains/Vin13_ADXC01000000_cds.fsa.txt", 'VIN13'),
                      ("src/sgd/convert/data/strains/VL3_AEJS01000000.gff", "src/sgd/convert/data/strains/VL3_AEJS01000000_cds.fsa.txt", 'VL3'),
                      ("src/sgd/convert/data/strains/YJM269_AEWN01000000.gff", "src/sgd/convert/data/strains/YJM269_AEWN01000000_cds.fsa.txt", 'YJM269'),
                      ("src/sgd/convert/data/strains/YJM789_AAFW02000000.gff", "src/sgd/convert/data/strains/YJM789_AAFW02000000_cds.fsa.txt", 'YJM789'),
                      ("src/sgd/convert/data/strains/ZTW1_AMDD00000000.gff", "src/sgd/convert/data/strains/ZTW1_AMDD00000000_cds.fsa.txt", 'ZTW1')]


new_sequence_files = [("src/sgd/convert/data/strains/Sigma1278b-10560-6B_JRIQ00000000_SGD.gff", 'src/sgd/convert/data/strains/Sigma1278b-10560-6B_JRIQ00000000_SGD_cds.fsa', 'Sigma1278b'),
                      ("src/sgd/convert/data/strains/BC187_JRII00000000.gff", "src/sgd/convert/data/strains/BC187_JRII00000000_cds.fsa", 'BC187'),
                      ("src/sgd/convert/data/strains/BY4741_JRIS00000000.gff", "src/sgd/convert/data/strains/BY4741_JRIS00000000_cds.fsa", 'BY4741'),
                      ("src/sgd/convert/data/strains/BY4742_JRIR00000000.gff", "src/sgd/convert/data/strains/BY4742_JRIR00000000_cds.fsa", 'BY4742'),
                      ("src/sgd/convert/data/strains/CEN.PK2-1Ca_JRIV01000000_SGD.gff", "src/sgd/convert/data/strains/CEN.PK2-1Ca_JRIV01000000_SGD_cds.fsa", 'CENPK'),
                      ("src/sgd/convert/data/strains/D273-10B_JRIY00000000_SGD.gff", "src/sgd/convert/data/strains/D273-10B_JRIY00000000_SGD_cds.fsa", 'D273-10B'),
                      ("src/sgd/convert/data/strains/DBVPG6044_JRIG00000000.gff", "src/sgd/convert/data/strains/DBVPG6044_JRIG00000000_cds.fsa", 'DBVPG6044'),
                      ("src/sgd/convert/data/strains/FL100_JRIT00000000_SGD.gff", "src/sgd/convert/data/strains/FL100_JRIT00000000_SGD_cds.fsa", 'FL100'),
                      ("src/sgd/convert/data/strains/FY1679_JRIN00000000.gff", "src/sgd/convert/data/strains/FY1679_JRIN00000000_cds.fsa", 'FY1679'),
                      ("src/sgd/convert/data/strains/JK9-3d_JRIZ00000000_SGD.gff", "src/sgd/convert/data/strains/JK9-3d_JRIZ00000000_SGD_cds.fsa", 'JK9-3d'),
                      ("src/sgd/convert/data/strains/K11_JRIJ00000000.gff", "src/sgd/convert/data/strains/K11_JRIJ00000000_cds.fsa", 'K11'),
                      ("src/sgd/convert/data/strains/L1528_JRIK00000000.gff", "src/sgd/convert/data/strains/L1528_JRIK00000000_cds.fsa", 'L1528'),
                      ("src/sgd/convert/data/strains/RedStar_JRIL00000000.gff", "src/sgd/convert/data/strains/RedStar_JRIL00000000_cds.fsa", 'RedStar'),
                      ("src/sgd/convert/data/strains/RM11-1A_JRIP00000000_SGD.gff", "src/sgd/convert/data/strains/RM11-1A_JRIP00000000_SGD_cds.fsa", 'RM11-1a'),
                      ("src/sgd/convert/data/strains/SEY6210_JRIW00000000_SGD.gff", "src/sgd/convert/data/strains/SEY6210_JRIW00000000_SGD_cds.fsa", 'SEY6210'),
                      ("src/sgd/convert/data/strains/SK1_JRIH00000000_SGD.gff", "src/sgd/convert/data/strains/SK1_JRIH00000000_SGD_cds.fsa", 'SK1'),
                      ("src/sgd/convert/data/strains/UWOPS05-217-3_JRIM00000000.gff", "src/sgd/convert/data/strains/UWOPS05-217-3_JRIM00000000_cds.fsa", 'UWOPSS'),
                      ("src/sgd/convert/data/strains/W303_JRIU00000000_SGD.gff", "src/sgd/convert/data/strains/W303_JRIU00000000_SGD_cds.fsa", 'W303'),
                      ("src/sgd/convert/data/strains/X2180-1A_JRIX00000000_SGD.gff", "src/sgd/convert/data/strains/X2180-1A_JRIX00000000_SGD_cds.fsa", 'X2180-1A'),
                      ("src/sgd/convert/data/strains/Y55_JRIF00000000_SGD.gff", "src/sgd/convert/data/strains/Y55_JRIF00000000_SGD_cds.fsa", 'Y55'),
                      ("src/sgd/convert/data/strains/YJM339_JRIE00000000.gff", "src/sgd/convert/data/strains/YJM339_JRIE00000000_cds.fsa", 'YJM339'),
                      ("src/sgd/convert/data/strains/YPH499_JRIO00000000.gff", "src/sgd/convert/data/strains/YPH499_JRIO00000000_cds.fsa", 'YPH499'),
                      ("src/sgd/convert/data/strains/YPS128_JRID00000000.gff", "src/sgd/convert/data/strains/YPS128_JRID00000000_cds.fsa", 'YPS128'),
                      ("src/sgd/convert/data/strains/YPS163_JRIC00000000.gff", "src/sgd/convert/data/strains/YPS163_JRIC00000000_cds.fsa", 'YPS163'),
                      ("src/sgd/convert/data/strains/YS9_JRIB00000000.gff", "src/sgd/convert/data/strains/YS9_JRIB00000000_cds.fsa", 'YS9'),

]


protein_sequence_files_for_alt_strains = [
                      ('src/sgd/convert/data/strains/Sigma1278b-10560-6B_JRIQ00000000_SGD_pep.fsa', 'Sigma1278b'),
                      ('src/sgd/convert/data/strains/CEN.PK2-1Ca_JRIV01000000_SGD_pep.fsa', 'CENPK'),
                      ('src/sgd/convert/data/strains/D273-10B_JRIY00000000_SGD_pep.fsa', 'D273-10B'),
                      ('src/sgd/convert/data/strains/FL100_JRIT00000000_SGD_pep.fsa', 'FL100'),
                      ('src/sgd/convert/data/strains/JK9-3d_JRIZ00000000_SGD_pep.fsa', 'JK9-3d'),
                      ('src/sgd/convert/data/strains/RM11-1A_JRIP00000000_SGD_pep.fsa', 'RM11-1a'),
                      ('src/sgd/convert/data/strains/SEY6210_JRIW00000000_SGD_pep.fsa', 'SEY6210'),
                      ('src/sgd/convert/data/strains/SK1_JRIH00000000_SGD_pep.fsa', 'SK1'),
                      ('src/sgd/convert/data/strains/W303_JRIU00000000_SGD_pep.fsa', 'W303'),
                      ('src/sgd/convert/data/strains/X2180-1A_JRIX00000000_SGD_pep.fsa', 'X2180-1A'),
                      ('src/sgd/convert/data/strains/Y55_JRIF00000000_SGD_pep.fsa', 'Y55')]


protein_sequence_files = [
                      ("src/sgd/convert/data/strains/orf_trans_all.fasta", 'S288C'),
                      ('src/sgd/convert/data/strains/Sigma1278b-10560-6B_JRIQ00000000_SGD_pep.fsa', 'Sigma1278b'),
                      ("src/sgd/convert/data/strains/AWRI1631_ABSV01000000_pep.fsa.txt", 'AWRI1631'),
                      ("src/sgd/convert/data/strains/AWRI796_ADVS01000000_pep.fsa.txt", 'AWRI796'),
                      ('src/sgd/convert/data/strains/BC187_JRII00000000_pep.fsa', 'BC187'),
                      ('src/sgd/convert/data/strains/BY4741_JRIS00000000_pep.fsa', 'BY4741'),
                      ('src/sgd/convert/data/strains/BY4742_JRIR00000000_pep.fsa', 'BY4742'),
                      ("src/sgd/convert/data/strains/CBS7960_AEWL01000000_pep.fsa.txt", 'CBS7960'),
                      ('src/sgd/convert/data/strains/CEN.PK2-1Ca_JRIV01000000_SGD_pep.fsa', 'CENPK'),
                      ("src/sgd/convert/data/strains/CLIB215_AEWP01000000_pep.fsa.txt", 'CLIB215'),
                      ('src/sgd/convert/data/strains/D273-10B_JRIY00000000_SGD_pep.fsa', 'D273-10B'),
                      ('src/sgd/convert/data/strains/DBVPG6044_JRIG00000000_pep.fsa', 'DBVPG6044'),
                      ("src/sgd/convert/data/strains/EC1118_PRJEA37863_pep.fsa.txt", 'EC1118'),
                      ("src/sgd/convert/data/strains/EC9-8_AGSJ01000000_pep.fsa.txt", 'EC9-8'),
                      ('src/sgd/convert/data/strains/FL100_JRIT00000000_SGD_pep.fsa', 'FL100'),
                      ("src/sgd/convert/data/strains/FostersB_AEHH01000000_pep.fsa.txt", 'FostersB'),
                      ("src/sgd/convert/data/strains/FostersO_AEEZ01000000_pep.fsa.txt", 'FostersO'),
                      ('src/sgd/convert/data/strains/FY1679_JRIN00000000_pep.fsa', 'FY1679'),
                      ("src/sgd/convert/data/strains/JAY291_ACFL01000000_pep.fsa.txt", 'JAY291'),
                      ('src/sgd/convert/data/strains/JK9-3d_JRIZ00000000_SGD_pep.fsa', 'JK9-3d'),
                      ('src/sgd/convert/data/strains/K11_JRIJ00000000_pep.fsa', 'K11'),
                      ("src/sgd/convert/data/strains/Kyokai7_BABQ01000000_pep.fsa.txt", 'Kyokai7'),
                      ('src/sgd/convert/data/strains/L1528_JRIK00000000_pep.fsa', 'L1528'),
                      ("src/sgd/convert/data/strains/LalvinQA23_ADVV01000000_pep.fsa.txt", 'LalvinQA23'),
                      ("src/sgd/convert/data/strains/PW5_AFDC01000000_pep.fsa.txt", 'PW5'),
                      ('src/sgd/convert/data/strains/RedStar_JRIL00000000_pep.fsa', 'RedStar'),
                      ('src/sgd/convert/data/strains/RM11-1A_JRIP00000000_SGD_pep.fsa', 'RM11-1a'),
                      ('src/sgd/convert/data/strains/SEY6210_JRIW00000000_SGD_pep.fsa', 'SEY6210'),
                      ('src/sgd/convert/data/strains/SK1_JRIH00000000_SGD_pep.fsa', 'SK1'),
                      ("src/sgd/convert/data/strains/T7_AFDE01000000_pep.fsa.txt", 'T7'),
                      ("src/sgd/convert/data/strains/UC5_AFDD01000000_pep.fsa.txt", 'UC5'),
                      ('src/sgd/convert/data/strains/UWOPS05-217-3_JRIM00000000_pep.fsa', 'UWOPSS'),
                      ('src/sgd/convert/data/strains/W303_JRIU00000000_SGD_pep.fsa', 'W303'),
                      ("src/sgd/convert/data/strains/Vin13_ADXC01000000_pep.fsa.txt", 'VIN13'),
                      ("src/sgd/convert/data/strains/VL3_AEJS01000000_pep.fsa.txt", 'VL3'),
                      ('src/sgd/convert/data/strains/X2180-1A_JRIX00000000_SGD_pep.fsa', 'X2180-1A'),
                      ('src/sgd/convert/data/strains/Y55_JRIF00000000_SGD_pep.fsa', 'Y55'),
                      ("src/sgd/convert/data/strains/YJM269_AEWN01000000_pep.fsa.txt", 'YJM269'),
                      ('src/sgd/convert/data/strains/YJM339_JRIE00000000_pep.fsa', 'YJM339'),
                      ("src/sgd/convert/data/strains/YJM789_AAFW02000000_pep.fsa.txt", 'YJM789'),
                      ('src/sgd/convert/data/strains/YPH499_JRIO00000000_pep.fsa', 'YPH499'),
                      ('src/sgd/convert/data/strains/YPS128_JRID00000000_pep.fsa', 'YPS128'),
                      ('src/sgd/convert/data/strains/YPS163_JRIC00000000_pep.fsa', 'YPS163'),
                      ('src/sgd/convert/data/strains/YS9_JRIB00000000_pep.fsa', 'YS9'),
                      ("src/sgd/convert/data/strains/ZTW1_AMDD00000000_pep.fsa.txt", 'ZTW1')]


def get_dna_sequence_library(gff3_file, remove_spaces=False):
    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    for line in gff3_file:
        line = line.replace("\r\n","").replace("\n", "")
        if not on_sequence and line.startswith('>'):
            on_sequence = True
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[current_id] = ''.join(current_sequence)
            current_id = line[1:]
            if remove_spaces:
                current_id = current_id.split(' ')[0]
            current_sequence = []
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[current_id] = ''.join(current_sequence)

    return id_to_sequence

def reverse_complement(residues):
    basecomplement = {'A': 'T', 'C': 'G', 'G': 'C', 'T': 'A', 't': 'a', 'a': 't', 'c': 'g', 'g': 'c', 'n': 'n',
                      'W': 'W', 'Y': 'R', 'R': 'Y', 'S': 'S', 'K':'M', 'M':'K', 'B':'V', 'D':'H', 'H':'D', 'V':'B', 'N':'N'}
    letters = list(residues)
    letters = [basecomplement[base] for base in letters][::-1]
    return ''.join(letters)

def get_sequence_library_fsa(fsa_file):
    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    for line in fsa_file:
        line = line.replace("\r\n","").replace("\n", "")
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[current_id] = ''.join(current_sequence)
            current_id = line[1:]
            if '_' in current_id:
                current_id = current_id[0:current_id.index('_')]
            if ' ' in current_id:
                current_id = current_id[0:current_id.index(' ')]
            current_sequence = []
            on_sequence = True
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[current_id] = ''.join(current_sequence)

    return id_to_sequence

def get_sequence(parent_id, start, end, strand, sequence_library):
    if parent_id in sequence_library:
        residues = sequence_library[parent_id][start-1:end]
        if strand == '-':
            residues = reverse_complement(residues)
        return residues
    else:
        print 'Parent not found: ' + parent_id
