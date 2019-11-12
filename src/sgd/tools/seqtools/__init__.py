import json
from pyramid.response import Response
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from src.sgd.frontend.yeastgenome import clean_cell
import os

seq_url = "https://www.yeastgenome.org/backend/locus/_REPLACE_NAME_HERE_/sequence_details"
contig_url = "https://www.yeastgenome.org/backend/contig/_REPLACE_CONTIG_NAME_HERE_"
validate_url = "https://www.yeastgenome.org/backend/locus/"

def do_seq_analysis(request):

    p = dict(request.params)

    if p.get('check'):
        data = validate_names(p)
        return Response(body=json.dumps(data), content_type='application/json')

    if p.get('emboss'):
        data = run_emboss(p)
        return Response(body=json.dumps(data), content_type='application/json')

    if p.get('chr'):
        data = get_sequence_for_chr(p)
        if p.get('format') is None:
            return Response(body=json.dumps(data), content_type='application/json')
        else:
            response = display_sequence_for_chr(p, data)
            return response
           
    if p.get('seq'):
        data = manipulate_sequence(p)
        return Response(body=json.dumps(data), content_type='application/json')

    data = get_sequence_for_genes(p)
    if p.get('format') is None:
        return Response(body=json.dumps(data), content_type='application/json')
    else:
        response = display_sequence_for_genes(p, data)
        return response
        

def run_emboss(p):

    emboss = p['emboss']
    seq = p.get('seq')
    seqname = p.get('seqname')

    ## get seq for seqname
    if seq is None and seqname is not None:
        url = seq_url.replace("_REPLACE_NAME_HERE_", seqname)
        res = _get_json_from_server(url)
        if res == 404:
            continue
        if len(res.get('genomic_dna')) == 0:
            continue
        if res.get('genomic_dna') is not None:
            [format_name, seq] = _extract_seq(strains, res['genomic_dna'], 1)

    inSeqFile = "/tmp/seq." + str(os.getpid()) + ".in"
    fw = open(inSeqFile, "w")
    fw.write(seq + "\n")
    fw.close()
    
    outSeqFile = "/tmp/seq." + emboss + "." + str(os.getpid()) + ".out"
    
    program = "/usr/bin/" + emboss
    cmd = ""
    if emboss == 'restrict':
        cmd = program + " -solofragment -sequence " + inSeqFile + " -enzyme all -sitelen 4 -outfile " + outSeqFile
    elif emboss == 'remap':
        cmd = program + " -sequence " + inSeqFile + " -enzyme all -sitelen 4 -outfile " + outSeqFile
    elif emboss == 'transeq':
        cmd = program + " " + inSeqFile + " " + outSeqFile + " -osformat2 'gcg'"
    
    try:
        os.system(cmd)
    except OSError:
        return { "content": cmd }

    f = open(outSeqFile)
    content = ""
    start = 0
    for line in f:
        if emboss == 'restrict' and " Start" in line:
            start = 1
        if emboss == 'restrict':
            if start == 1:
                content += line
        elif emboss == 'transeq' and ("AA_SEQUENCE" in line or "Length: " in line):
            continue
        else:
            content += line

    f.close()    

    try:
        os.remove(inSeqFile)
        os.remove(outSeqFile)
    except OSError:
        pass

    return { "content": content }
    

def return_plain_data(content):

    response = Response(content_type='application/html')
    headers = response.headers
    if not response.charset:
        response.charset = 'utf8'
    response.text = content
    headers['Content-Type'] = 'text/plain'

    return response

def display_sequence_for_chr(p, data):

    start = p['start']
    end = p['end']

    if p['rev'] == '1':
        (start, end) = (end, start)

    content =  ">chr" + _chrnum_to_chrom(data['chr']) + " coordinates " + start + " to " + end + "\n"

    if p.get('format') == 'gcg':
        content += format_gcg(data['residue']);
    else:
        content += format_fasta(data['residue']);

    filename = "chr" + _chrnum_to_chrom(data['chr'])
    if start != 'undefined':
        filename = filename + "_" +  start + "-" + end
        
    if p.get('format') == 'gcg':
        filename += ".gcg"
    else:
        filename += ".fsa"

    return set_download_file(filename, str(content))

def display_sequence_for_genes(p, data):

    type = p.get('type')
    if type is None or type == 'genomic':
        type = 'genomic_dna'
    elif type == 'coding':
        type = 'coding_dna'
    else:
        type = 'protein'

    content = ""
    geneCount = len(data);
    filename = ""
    for key in data:
        [gene, queryGene] = key.split("|"); 
        seqtypeInfo = data[key]
        for seqtype in seqtypeInfo:
            if seqtype != type:
                continue
            strainInfo = seqtypeInfo[seqtype]
            allStrains = list(strainInfo.keys())
            if 'S288C' in strainInfo:
                allStrains.remove('S288C')
                allStrains = ['S288C'] + sorted(allStrains)
            for strain in allStrains:
                locusInfo = strainInfo[strain]
                content +=  ">" + gene + "_" + strain + " " + str(locusInfo.get('display_name')) + " " + str(locusInfo.get('sgdid')) + " " + str(locusInfo.get('locus_type')) + " " + str(locusInfo.get('headline')) + "\n"
                if p.get('format') is not None and p['format'] == 'gcg':
                    content += format_gcg(locusInfo.get('residue')) + "\n"
                else:
                    content += format_fasta(locusInfo.get('residue')) + "\n" 
                if filename == '':
                    if geneCount == 1:
                        filename = gene
                    else:
                        filename = gene + "_etc_" + str(os.getpid())
    
    if filename == "":
        filename = str(os.getpid())

    if p.get('format') is not None and p['format'] == 'gcg':
        filename += "_" + type + ".gcg"
    else:
        filename += "_" + type + ".fsa"

    if content == "":
        content = "No sequence available." 

    return set_download_file(filename, str(content))


def set_download_file(filename, content):
    
    response = Response(content_type='application/file')
    headers = response.headers
    if not response.charset:
        response.charset = 'utf8'
    response.text = content
    headers['Content-Type'] = 'text/plain'
    headers['Content-Disposition'] = str('attachment; filename=' + '"' + filename + '"')
    headers['Content-Description'] = 'File Transfer'
    return response


def format_fasta(sequence):

    return clean_cell("\n".join([sequence[i:i+60] for i in range(0, len(sequence), 60)]))


def format_gcg(sequence):

    BASES_PER_LINE = 60
    BASES_PER_CHUNK = 10

    seqlen = len(sequence)
    maxIndexLen = len(str(seqlen))

    if len(sequence) <= BASES_PER_CHUNK:
        return "1 " + sequence + str(seqlen) + "\n"

    ## adding spaces between 10 bases chunks
    newseq = sequence[0:BASES_PER_CHUNK]
    sequence = sequence[BASES_PER_CHUNK:]

    while len(sequence) > BASES_PER_CHUNK:
        newseq += " " + sequence[0:BASES_PER_CHUNK]
        sequence = sequence[BASES_PER_CHUNK:]
    newseq += " " + sequence

    ## adding newlines and index label
    index = 1
    sequence = newseq
    j = int(BASES_PER_LINE + BASES_PER_LINE/BASES_PER_CHUNK)
    newseq = " "*(maxIndexLen-1) + "1 " + sequence[0:j] + "\n"
    if seqlen <= BASES_PER_LINE:
        return newseq 
    sequence = sequence[j:]        
    while len(sequence) > j:
        index += BASES_PER_LINE
        newseq += " "*(maxIndexLen-len(str(index))) + str(index) + " " + sequence[0:j] + "\n"
        sequence = sequence[j:]

    if sequence:
        index += BASES_PER_LINE
        newseq += " "*(maxIndexLen-len(str(index))) + str(index) + " " + sequence + "\n"
    
    return newseq


def validate_names(p):

    # http://0.0.0.0:6545/run_seqtools?check=ACT1|XXX6
    checkList = p.get('check') 
    if checkList is None:
        checkList = p.get('genes')
    if checkList is not None:
        names = checkList.split("|")
        badList = ""
        for name in names:
            gene = name
            name = name.upper()
            name = name.replace("SGD:", "")
            url = validate_url + name
            res =_check_gene_from_server(url)
            if res == 404:
                if badList != "":
                    badList += ", "
                badList += gene
        return badList
    return ""
        
def get_sequence_for_chr(p):

    # http://0.0.0.0:6545/run_seqtools?chr=6&start=54696&end=53260

    data = {}
    chr = p.get('chr')
    data["chr"] = chr
    strand = '+'
    start = p.get('start')
    end = p.get('end')
    if start is not None and start != 'undefined':
        data["start"] = start
        start = int(start)
    else:
        start = 1
    if end is not None and end != 'undefined':
        data["end"] =end
        end = int(end)
    else:
        end = 10000000 # get a whole chr seq
    if start > end:
        (start, end) = (end, start)
        strand = '-'

    contig = _map_contig_name_for_chr(chr)
    seq = _get_sequence_from_contig(contig, start, end, strand)

    rev = p.get('rev')
    if rev is not None and rev == '1':
        seq = _reverse_complement(seq)
        data['rev'] = 1

    if end == 10000000:
        data['start'] = 1
        data['end'] = len(seq)

    data['residue'] = seq
        
    return data


def manipulate_sequence(p):                                                                                                                
    # http://0.0.0.0:6545/run_seqtools?seq=ATGGATTCTGGTATGTTCTAGCGCTTGCACCATCCCATTTAACTGTAA&rev=1

    data = {}
    seq = p.get('seq')
    seq = seq.replace(" ", "")

    seq = ''.join([i for i in seq if not i.isdigit()])
    if p.get('seqtype') == 'Protein':
        data['residue'] = seq
        return data

    rev = p.get('rev')
    if rev is not None and rev == '1':
        seq = _reverse_complement(seq)
        data['rev'] = 1

    data['residue'] = seq

    return data

    ## do more stuff here

 
def _get_sequence_from_contig(contig, start, end, strand):

    url = contig_url.replace("_REPLACE_CONTIG_NAME_HERE_", contig)
    res = _get_json_from_server(url)
    contig_name = res['display_name']
    contig_seq = res['residues']
    seq = contig_seq[start-1:end]
    if strand == '-':
        seq = _reverse_complement(seq)
    return seq


def get_sequence_for_genes(p):

    # http://0.0.0.0:6545/run_seqtools?genes=ACT1|BUD2&strains=W303|S288C&type=nuc&up=10&down=10   
    # http://0.0.0.0:6545/run_seqtools?format=fasta&type=genomic&genes=ACT1|BUD2&strains=W303|S288C&type=nuc&up=10&down=10

    badGeneList = validate_names(p)
    
    if badGeneList != '':
        return { "ERROR": "These genes are not in the database: " + badGeneList }
    genes = p.get('genes')
    strains = p.get('strains')
    if strains is None or strains == '':
        strains = 'S288C'
    if genes is None:
        return { "ERROR": "NO GENE NAME PASSED IN" }
    genes = genes.split('|')
    strains = strains.replace("%20", "|").replace("+", "|").replace(" ", "|")
    strains = strains.split('|')
    rev = p.get('rev')
    if rev == '1':
        rev = 1
    up = p.get('up')
    down = p.get('down')
    if up is None or up == '':
        up = 0
    if down is None or down == '':
        down = 0

    data = {}

    for name in genes:
        gene = name
        name = name.upper()
        name = name.replace("SGD:", "")
        url = seq_url.replace("_REPLACE_NAME_HERE_", name)
        res = _get_json_from_server(url)        

        if res == 404:
            # data[name] = {}
            continue
        
        if len(res.get('genomic_dna')) == 0:
            # data[name] = {}
            continue

        allSeqData = {}
        format_name = None
        start = None
        end = None
        chr = None
        if res.get('protein') is not None:
            [format_name, proteinData] = _extract_seq(strains, res['protein'], 0)
            allSeqData['protein'] = proteinData
        if res.get('coding_dna') is not None:
            [format_name, codingData] = _extract_seq(strains, res['coding_dna'], rev)
            allSeqData['coding_dna'] = codingData

        if res.get('genomic_dna') is not None:
            if up == 0 and down == 0:
                [format_name, genomicData] = _extract_seq(strains, res['genomic_dna'], rev)
                allSeqData['genomic_dna'] = genomicData
            else:                
                [format_name, genomicData] = _extract_seq_with_up_down(strains, 
                                                                       res['genomic_dna'], 
                                                                       up, down, rev)
                allSeqData['genomic_dna'] = genomicData

            [start, end, chr, type] = _extract_chr_coordinates(res['genomic_dna'])
            allSeqData['chr_coords'] = { "start": start, 
                                         "end": end, 
                                         "chr": chr,
                                         "locus_type": type }
        if format_name is not None:
            data[format_name + "|" + gene] = allSeqData

    return data


def _extract_chr_coordinates(rows):
    
    start = None
    end = None
    chr = None
    locus_type = None
    for row in rows:
        strain = row['strain']
        strain_name = strain['display_name']
        if strain_name == 'S288C':
            start = row['start']
            end = row['end']
            chr = row['contig']['display_name'].replace("Chromosome ", "")
            locus = row['locus']
            locus_type = locus['locus_type']
    return [start, end, chr, locus_type]


def _extract_seq(strains, rows, rev):

    seqData = {}
    format_name = None
    for row in rows:
        strain = row['strain']
        strain_name = strain['display_name']
        if strain_name in strains:
            locus = row['locus']
            format_name = locus['format_name']
            seq = row['residues']
            if rev is not None and rev == 1:
                seq = _reverse_complement(seq)
            
            thisData = { "display_name": locus.get('display_name'),
                         "headline": locus.get('headline'),
                         "locus_type": locus['locus_type'],
                         "sgdid": "SGD:" + locus['link'].replace("/locus/", ""),
                         "residue": seq}

            if rev is not None and rev == 1:
                thisData['rev'] = 1

            seqData[strain_name] = thisData

    return [format_name, seqData]


def _extract_seq_with_up_down(strains, rows, up, down, rev):

    seqData = {}
    format_name = None
    for row in rows:
        strain = row['strain']
        strain_name = strain['display_name']
        if strain_name in strains:
            locus = row['locus']
            format_name = locus['format_name']

            start = row['start']
            end = row['end']
            strand = row['strand']
            contig = row['contig']['format_name']
            up_bp = int(up)
            down_bp = int(down)
            if strand == '-':
                (up_bp, down_bp) = (down_bp, up_bp)
            start = start - up_bp
            end = end + down_bp

            seq = _get_sequence_from_contig(contig, start, end, strand)

            if rev is not None and rev == 1:
                seq = _reverse_complement(seq)

            thisData = { "display_name": locus.get('display_name'),
                         "headline": locus.get('headline'),
                         "locus_type": locus['locus_type'],
                         "sgdid": "SGD:" + locus['link'].replace("/locus/", ""),
                         "residue": seq,
                         "up": up,
                         "down": down }

            if rev is not None and rev == 1:
                thisData['rev'] = 1;

            seqData[strain_name] = thisData

    return [format_name, seqData]


def _reverse_complement(seq):

    complement = {'A': 'T', 'C': 'G', 'G': 'C', 'T': 'A'}
    bases = list(seq)
    bases = reversed([complement.get(base,base) for base in bases])
    bases = ''.join(bases)
    return bases

def _check_gene_from_server(url):

    try:
        req = Request(url)
        res = urlopen(req)
        return 0
    except HTTPError:
        return 404

def _get_json_from_server(url):

    # print "URL: ", url
    
    try:
        req = Request(url)
        res = urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        return data
    except HTTPError:
        return 404

def _chrnum_to_chrom(chrnum):

    chrnum_to_chrom = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
                        '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
                        '11': 'XI', '12': 'XII', '13': 'XIII', '14': 'XIV',
                        '15': 'XV', '16': 'XVI', '17': 'Mito' }
             
    return chrnum_to_chrom.get(chrnum)

def _map_contig_name_for_chr(chrnum):
    
    chrom = _chrnum_to_chrom(chrnum)

    if chrom is not None:
        return 'Chromosome_' + chrom
    
    return chrnum
