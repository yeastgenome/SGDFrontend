import json
from pyramid.response import Response
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from src.sgd.frontend.yeastgenome import clean_cell
import os

alignment_url = "https://www.yeastgenome.org/backend/alignment/"

gene_url = "https://www.yeastgenome.org/backend/locus/"

def get_s3_data(request):

    p = dict(request.params)

    data = retrieve_data(p)

    if p.get('download'):
        return data

    return Response(body=json.dumps(data), content_type='application/json', charset='UTF-8')
 
def retrieve_data(p):
    
    type = p.get('type', 'protein')
    if type == 'undefined':
        type = 'protein'
    locus = p.get('locus', '')
    if locus == '':
        return { " ERROR": "NO GENE NAME PASSED IN" }
    
    data = _get_json_from_server(gene_url+locus)
    if data == '404' or data == 404:
        return { " ERROR": "Gene " + locus + " is not in the database." }
    sgdid = data['sgdid']
    orfName = data['format_name']
    geneName = data.get('gene_name')
    displayName = orfName
    if geneName is not None and geneName.upper() != orfName.upper():
        displayName = geneName + "/" + displayName

    data = _get_json_from_server(alignment_url+orfName)

    if data == '404' or data == 404:
        return { " ERROR": "orfName " + orfName + " doesn't have alignment data." }

    alignUrl = None
    imagesUrl = None

    if type == 'protein':
        alignUrl = data['protein_align_url']
        imagesUrl = data['protein_images_url']
    else:
        alignUrl = data['dna_align_url']
        imagesUrl = data['dna_images_url']
        
    response = urlopen(alignUrl)
    alignment = response.read().decode('utf-8') 
    
    if p.get('download'):
        return set_download_file(alignment, type)
        
    [alignTables, id2seq, strains] = format_alignment(orfName, type, alignment)
    seqs = format_seqs(id2seq, strains, type)

    return { "dendrogram_url": imagesUrl,
             "alignment_url": alignUrl,
             "alignment": str(alignTables),
             "sgdid": sgdid,
             "displayName": displayName,
             "seqs": seqs}

def format_seqs(id2seq, strains, type):

    strain2src = strain_to_source_mapping()
    seqs = ""
    i = 0
    for id in strains:
        if i > 0 and 'S288C' in id:
            continue
        seq = id2seq[id].replace('-', '')
        seq = format_gcg(seq)
        strain = id.split("_")[1]
        header = ""
        if type == 'dna':
            header = "DNA Coding"
        else:
            header = "Protein"
        header = header + " Sequence " + id + " from " + strain2src.get(strain, "Unknown source") 
        
        seqs = seqs + "<h3 id='" + id + "'>" + header + "</h3><font size='+1'>" + seq + "</font>\n\n"

    return seqs

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


def format_fasta(sequence):

    return clean_cell("\n".join([sequence[i:i+60] for i in range(0, len(sequence), 60)]))


def set_download_file(alignment, type):

    lines = alignment.split("\n")

    ref_id = None
    ref_seq = None
    id2seq = {}

    newLines = []
    for line in lines:
        if line == '' or "CLUSTAL" in line:
            continue
        while '  ' in line:
            line = line.replace('  ', ' ')
        pieces = line.split(" ")
        if len(pieces) != 2:
            continue
        id = pieces[0]
        if id == '':
            continue
        seq = pieces[1]
        if 'S288C' in id:
            ref_id = id
            if ref_seq is None:
                ref_seq = seq
            else:
                ref_seq = ref_seq + seq
        else:
            if id in id2seq:
                id2seq[id] = id2seq[id] + seq
            else:
                id2seq[id] = seq
                
    content = ">" + ref_id + "\n" + format_fasta(ref_seq.replace("-", "")) + "\n"
    for id in sorted(id2seq. keys()):
        content = content + ">" + id + "\n" + format_fasta(id2seq[id].replace("-", "")) + "\n"

    filename = ref_id.split("_")[0] + "_" + type + ".fsa" 
    
    response = Response(content_type='application/file')
    headers = response.headers
    if not response.charset:
        response.charset = 'utf8'
    response.text = str(content)
    headers['Content-Type'] = 'text/plain'
    headers['Content-Disposition'] = str('attachment; filename=' + '"' + filename + '"')
    headers['Content-Description'] = 'File Transfer'
    return response


def format_alignment(orfName, type, alignment):
    
    lines = alignment.split("\n")
    
    ref_id = None
    ref_seq = None
    id2seq = {}

    newLines = []
    for line in lines:
        if line == '' or "CLUSTAL" in line:
            continue
        while '  ' in line:
            line = line.replace('  ', ' ')
        pieces = line.split(" ")
        if len(pieces) != 2:
            continue
        id = pieces[0]
        if id == '':
            continue
        seq = pieces[1]
        if 'S288C' in id:
            ref_id = id
            if ref_seq is None:
                ref_seq = seq
            else:
                ref_seq = ref_seq + seq
        else:
            if id in id2seq:
                id2seq[id] = id2seq[id] + seq
            else:
                id2seq[id] = seq

    id2seq[ref_id] = ref_seq

    maxLen = len(ref_seq)
    strains = [ref_id]
    id2seqChar = {ref_id : list(id2seq[ref_id])}
    for id in sorted(id2seq. keys()):
        if id.endswith('S288C'):
            continue
        seq = id2seq[id]
        if seq is None:
            continue
        if len(seq) > maxLen:
            maxLen = len(seq)
        strains.append(id)
        id2seqChar[id] = list(seq)

    percentSimilar = []
    for i in range(maxLen):
        count = {}
        for id in strains:
            seqs = id2seqChar[id]
            if len(seqs) > i:
                base = seqs[i]
                if base in ['*', '-']:
                    continue
                count[base] = count.get(base, 0) + 1
        total = 0
        maxBase = 0
        for base in count:
            if count[base] > maxBase:
                maxBase = count[base]
            total = total + count[base]

        percent = maxBase*100/total

        if percent == 100:
            percentSimilar.append("yellow")
        elif percent >= 90:
            percentSimilar.append("pink")
        elif percent >= 75:
            percentSimilar.append("lightgreen")
        else:
            percentSimilar.append("lightgrey")

    legend = "<center><table border='0' cellpading='0' cellspacing='0'><tr><th>Color Keys: </th><td><br/></td><td bgcolor='yellow'><b> 100% identical </b></td><td><br/></td><td bgcolor='pink'><b> 90-99% identical </b></td><td><br/></td><td bgcolor='lightgreen'><b> 75-89% identical </b></td><td><br/></td><td bgcolor='lightgrey'><b> < 75% identical </b></td></tr></table></center><p/>"

    tables = ""
    id2lenSoFar = {}
    while len(percentSimilar) > 50:
        thisPercentLine = percentSimilar[0:50]
        percentSimilar = percentSimilar[50:]
        rows = ""
        for id in strains:
            row = "<tr><th align='left'><a href='#" + id + "'>" + id + "</a></th>"
            row = row + "<td>&nbsp;</td>"
            seq = id2seqChar[id]
            thisSeqLine = seq[0:50]
            seqStr = "".join(thisSeqLine).replace("-", "")
            start = id2lenSoFar.get(id, 0) + 1
            if len(seqStr) == 0:
                start = ""
                end = ""
            else:
                end = start - 1 + len(seqStr)
            if len(seqStr) > 0:
                id2lenSoFar[id] = end 
            id2seqChar[id] = seq[50:]
            row = row + "<td><font size='-1'>" + str(start) + "</font></td>"
            row = row + "<td>&nbsp;</td>"
            i = 0
            cell = ""
            for base in thisSeqLine:
                bgcolor = thisPercentLine[i]
                i = i + 1
                # cell = cell = cell + "<div style='display:inline-block;overflow:hidden;background:" + bgcolor + ";width:14px;'>" + base + "</div>"
                cell = cell + "<div style='display:inline-block;text-align:center;background:" + bgcolor + ";width: 14px;'>" + base + "</div>"
            row = row + "<td align='left'>" + cell + "</td>"
            row = row + "<td>&nbsp;</td>"
            row = row + "<td><font size='-1'>" + str(end) + "</font></td>"
            row = row + "</tr>\n"
            rows = rows + row
        tables = tables + "<table>" + rows + "</table>\n\n"

    rows = ""
    for id in strains:

        row = "<tr><th align='left'><a href='#" + id + "'>" + id + "</a></th>"
        row = row + "<td>&nbsp;</td>"
        seq = id2seqChar[id]
        seqStr = "".join(seq).replace("-", "")
        start = id2lenSoFar.get(id, 0) + 1
        end = start - 1 + len(seqStr)
        row = row + "<td><font size='-1'>" + str(start) + "</font></td>"
        row = row + "<td>&nbsp;</td>"

        i = 0
        cell = ""
        for base in seq:
            bgcolor = percentSimilar[i]
            i = i + 1
            cell = cell + "<div style='display:inline-block;text-align:center;background:" + bgcolor + ";width: 14px;'>" + base + "</div>"
        row = row + "<td align='left'>" + cell + "</td>"
        row = row + "<td>&nbsp;</td>"
        row = row + "<td><font size='-1'>" + str(end) + "</font></td>"
        row = row + "</tr>\n"
        rows = rows + row
    tables = tables + "<table>" + rows +"</table>\n"

    return [legend + tables + legend, id2seq, strains]


def _get_json_from_server(url):
    
    try:
        req = Request(url=url)
        res = urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        return data
    except HTTPError:
        return 404

def strain_to_source_mapping():

    return { "S288C": "SGD",
             "AWRI1631": "AWRI",
             "AWRI796": "AWRI",
             "BC187": "Stanford",
             "BY4741": "Stanford",
             "BY4742": "Stanford",
             "CBS7960": "WashU",
             "CEN.PK": "SGD",
             "CLIB215": "WashU",
             "CLIB324": "WashU",
             "CLIB382": "WashU",
             "D273-10B": "SGD",
             "DBVPG6044": "Stanford",
             "EC1118": "Genoscope",
             "EC9-8": "ASinica",
             "FL100": "SGD",
             "FY1679": "Stanford",
             "FostersB": "AWRI",
             "FostersO": "AWRI",
             "JAY291": "Duke",
             "JK9-3d": "SGD",
             "K11": "Stanford",
             "Kyokai7": "NRIB",
             "L1528": "Stanford",
             "LalvinQA23": "AWRI",
             "M22": "WashU",
             "PW5": "WashU",
             "RM11-1a": "SGD",
             "RM11-1A": "SGD",
             "RedStar": "Stanford",
             "SEY6210": "SGD",
             "SK1": "SGD",
             "Sigma1278b": "SGD",
             "T73": "WashU",
             "T7": "WashU",
             "UC5": "WashU",
             "UWOPS05_217_3": "Stanford",
             "VL3": "AWRI",
             "Vin13": "AWRI",
             "W303": "SGD",
             "X2180-1A": "SGD",
             "Y10": "WashU",
             "Y55": "SGD",
             "YJM269": "WashU",
             "YJM339": "Stanford",
             "YJM789": "Stanford",
             "YPH499": "Stanford",
             "YPS128": "Stanford",
             "YPS163": "Stanford",
             "YS9": "Stanford",
             "ZTW1": "Zhejiang" }

