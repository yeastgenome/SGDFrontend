curator_id = {'Rama Balakrishnan'   : 'RAMA',
              'Selina Dwight'       : 'DWIGHT',
              'Rob Nash'            : 'NASH',
              'Stacia Engel'        : 'STACIA',
              'Marek Skrzypek'      : 'MAREK',
              'Maria Costanzo'      : 'MARIA',
              'Dianna Fisk'         : 'FISK',
              'Edith Wong'          : 'EDITH',
              'Paul Lloyd'          : 'PLLOYD',
              'Janos Demeter'       : 'JDEMETER',
              'Diane Inglis'        : 'DIANE',
              'Shuai Weng'          : 'SHUAI',
              'Jodi Hirschman'      : 'JODI',
              'Kara Dolinski'       : 'KARA',   
              'Chandra Theesfeld'   : 'CHANDRA',
              'Julie Park'          : 'JULIEP',
              'Karen Christie'      : 'KCHRIS',
              'Anand Sethuraman'    : 'ANAND',
              'Laurie Issel-Traver' : 'LAURIE',
              'Midori Harris'       : 'MIDORI',
              'Eurie Hong'          : 'EURIE',
              'Cynthia Krieger'     : 'CINDY',
              'Rose Oughtred'       : 'ROSE'}

computational_created_by = 'OTTO'
email_receiver = ['sweng@stanford.edu']
email_subject = 'GPAD loading summary from pastry'

go_db_code_mapping = {
    'EC'                 : ['IUBMB', 'EC number'],
    'EMBL'               : ['GenBank/EMBL/DDBJ', 'DNA accession ID'],
    'ENSEMBL'            : ['ENSEMBL', 'Gene ID'],
    'FLYBASE'            : ['FLYBASE', 'Gene ID'],
    'GO'                 : ['GO Consortium', 'GOID'],
    'HAMAP'              : ['EXPASY', 'HAMAP'],
    'HUGO'               : ['HUGO', 'Gene ID'],
    'InterPro'           : ['EBI', 'InterPro'],
    'MGI'                : ['MGI', 'Gene ID'],
    'PANTHER'            : ['PANTHER', 'PANTHER'],
    'PDB'                : ['PDB', 'PDB ID'],
    'PomBase'            : ['PomBase', 'Gene ID'],
    'Prosite'            : ['Prosite', 'Prosite ID'],
    'RGD'                : ['RGD', 'Gene ID'],
    'SGD'                : ['SGD', 'DBID Primary'],
    'UniProtKB-KW'       : ['EBI', 'UniProtKB Keyword'],
    'UniProtKB-SubCell'  : ['EBI', 'UniProtKB Subcellular Location'],
    'TAIR'               : ['TAIR', 'Gene ID'],
    'UniProtKB'          : ['EBI', 'UniProt/Swiss-Prot ID'],
    'WB'                 : ['WB', 'Gene ID'],
    'protein_id'         : ['GenBank/EMBL/DDBJ', 'Protein version ID'],
    'UniPathway'         : ['UniPathway', 'UniPathway ID'],
    'HAMAP'              : ['HAMAP', 'HAMAP ID']
}


go_ref_mapping = {
    'GO_REF:0000002' : 'S000124036', 
    'GO_REF:0000003' : 'S000124037',
    'GO_REF:0000004' : 'S000124038',
    'GO_REF:0000015' : 'S000069584',
    'GO_REF:0000020' : 'S000181932',
    'GO_REF:0000023' : 'S000125578',
    'GO_REF:0000036' : 'S000147045',
    'GO_REF:0000037' : 'S000148669',
    'GO_REF:0000038' : 'S000148670',
    'GO_REF:0000039' : 'S000148671',
    'GO_REF:0000040' : 'S000148672',
    'GO_REF:0000041' : 'S000150560'
}

current_go_qualifier = ['NOT', 'colocalizes_with', 'contributes_to']

    
