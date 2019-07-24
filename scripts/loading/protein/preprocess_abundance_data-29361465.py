metadatafileTreated = "data/Grid-with-metadata_final_treated.txt"
metadatafileUntreated = "data/Grid-with-metadata_final_untreated.txt"
# datafileUntreated = "data/Table-S4-final-abundance-no-stress-29361465.txt"
# datafileTreated = "data/Table-S8-abundance-in-stress-29361465.txt"  
# foldfile = "data/Table-S9-fold-change-abundance-in-stress-29361465.txt"
datafileUntreated = "data/TableS4_wMAD1.txt"
datafileTreated = "data/TableS8_abundance_in_stress_final_corrected_11.28.18.txt"
foldfile = "data/TableS9_fold_change_abundance_in_stress_final_corrected_11.28.18.txt"

def generate_data():

    author2metadataUntreated = get_untreated_metadata()
    author2metadataTreated = get_treated_metadata()
    geneAuthor2fold = get_fold_change()

    print("SYSTEMATIC_NMAE\tAUTHOR\tPMID\tMOLECULES_PER_CELL\tECO\tEFO\tSTRAIN\tCHEBI\tGOID\tTIME_VALUE\tTIME_UNIT\tCOND_VALUE\tCONT_UNIT\tCHANGE_FOLD\tMEDIAN\tMAD")

    generate_data_for_untreated_expts(author2metadataUntreated)
    generate_data_for_treated_expts(author2metadataTreated, geneAuthor2fold)

def generate_data_for_untreated_expts(author2metadataUntreated):

    f = open(datafileUntreated)
    
    header = []
    for line in f:
        pieces = line.strip().split("\t")
        if line.startswith('Systematic Name'):
            header = pieces[7:]
            continue
        if len(pieces) < 7:
            continue
        gene = pieces[0]
        median = pieces[4]
        mad = pieces[6]
        if mad == "":
            mad = None
        data = pieces[7:]
        i = 0
        for author in header:
            if i >= len(data):
                break
            if data[i] == "":
                i = i + 1
                continue
            molecules = data[i]
            (pmid, eco, efo, strain) = author2metadataUntreated[author]
            print(gene + "\t" + author + "\t" + pmid + "\t" + molecules + "\t" + eco + "\t" + efo + "\t" + strain + "\tNone\tNone\tNone\tNone\tNone\tNone\tNone\t" + median + "\t" + str(mad))
            i = i + 1

    f.close()

def generate_data_for_treated_expts(author2metadataTreated, geneAuthor2fold):

    f = open(datafileTreated)

    geneAuthor2data = {}
    header = []
    for line in f:
        pieces = line.strip().split("\t")
        if line.startswith('Systematic Name'):
            header = pieces[2:]
            continue
        if len(pieces) < 3:
            continue
        gene = pieces[0]
        data = pieces[2:]
        i = 0
        for authorExpt in header:
            if i >= len(data):
                break
            if authorExpt == '':
                i = i + 1
                continue
            if "Untreated" in authorExpt:
                i = i + 1
                continue            
            molecules = data[i]
            author = authorExpt.split(':')[0]
            values = []
            if (gene, author) in geneAuthor2data:
                values = geneAuthor2data[(gene, author)]
            values.append(molecules)
            geneAuthor2data[(gene, author)] = values
            i = i + 1
    f.close()

    for (gene, author) in geneAuthor2data:
        data = geneAuthor2data[(gene, author)]
        metadata = author2metadataTreated.get(author)
        fold = geneAuthor2fold.get((gene, author))
        if metadata is None:
            print("BAD: no metadata for ", author)
            continue
        i = 0
        
        # if len(data) > len(metadata):
        #    print (gene, author), ", data=", data
        #    print (gene, author), ", metadata=", metadata

        for molecules in data:
            if molecules == '':
                i = i + 1
                continue
            (pmid, eco, efo, strain, chebi, goid, time_value, time_unit, conc_value, conc_unit) = metadata[i]
            thisFold = None
            if fold is not None and len(fold) > i:
                thisFold = fold[i]
                if thisFold == '':
                    thisFold = None
            if conc_value == '':
                conc_value = None
            if conc_unit == '':
                conc_unit = None
            print(gene + "\t" + author + "\t" + pmid + "\t" + molecules + "\t" + eco + "\t" + efo + "\t" + strain + "\t" + str(chebi) + "\t" + str(goid) + "\t" + time_value + "\t" + time_unit + "\t" + str(conc_value) + "\t" + str(conc_unit) + "\t" + str(thisFold) + "\tNone\tNone")
            i = i + 1

def get_fold_change():

    geneAuthor2fold = {}

    f = open(foldfile)
    
    for line in f:
        pieces = line.strip().split("\t")
        if line.startswith('Systematic Name'):
            header = pieces[2:]
            continue
        if len(pieces) < 3:
            continue
        gene = pieces[0]
        data = pieces[2:]
        i = 0
        for authorExpt in header:
            if i >= len(data):
                break
            fold = data[i]
            author = authorExpt.split(':')[0]
            values = []
            if (gene, author) in geneAuthor2fold:
                values = geneAuthor2fold[(gene, author)]
            values.append(fold)
            geneAuthor2fold[(gene, author)] = values
            i = i + 1
    
    f.close()

    return geneAuthor2fold
    

def get_treated_metadata():

    f = open(metadatafileTreated)

    author2metadataTreated = {}

    for line in f:
        pieces = line.strip().split("\t")
        if len(pieces) < 10:
            continue
        author = pieces[0].upper()
        pmid = pieces[2]
        eco = pieces[5]
        efo = pieces[8]
        strain = pieces[10]
        taxonomy_id = pieces[11]
        chebi = pieces[13]
        if chebi == '':
            chebi = None
        time_value = pieces[14].split(" ")[0]
        time_unit = pieces[14].split(" ")[1]
        conc_value = pieces[15]
        conc_unit = pieces[16]
        goid = None
        goterm = None
        if len(pieces) >= 19:
            goterm = pieces[17]
            goid = pieces[18]

        data = []
        if author in author2metadataTreated:
            data = author2metadataTreated[author]
        data.append((pmid, eco, efo, strain, chebi, goid, time_value, time_unit, conc_value, conc_unit))
        author2metadataTreated[author] = data

        # print "author=", author, ", pimd=", pmid, ", eco=", eco, ", efo=", efo, ", strain=", strain, ", chebi=", chebi, ", chemical=", chemical, ", time=", time_value, ", time_unit=", time_unit, ", conc_value=", conc_value, ", conc_unit=", conc_unit, ", goid=", goid, ", goTerm=", goterm
        
    f.close()
    
    return author2metadataTreated


def get_untreated_metadata():

    f = open(metadatafileUntreated)

    author2metadataUntreated = {}

    for line in f:

        pieces = line.strip().split("\t")
        if len(pieces) < 10:
            continue
        author = pieces[0].upper()
        pmid = pieces[2]
        eco = pieces[5]
        efo = pieces[8]
        strain = pieces[10]
        taxonomy_id = pieces[11]

        author2metadataUntreated[author] = (pmid, eco, efo, strain)

        # print "author=", author, ", pimd=", pmid, ", eco=", eco, ", efo=", efo, ", strain=", strain, ", taxonomy_id=", taxonomy_id    

    f.close()
    return author2metadataUntreated

if __name__ == '__main__':

    generate_data()
