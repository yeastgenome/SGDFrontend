import sys
import importlib
importlib.reload(sys)  
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Dataset, Datasetsample, Referencedbentity, DatasetReference
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session

__author__ = 'sweng66'

nex_session = get_session()

dataset_id_to_channel_count = dict([(x.dataset_id, x.channel_count) for x in nex_session.query(Dataset).all()])
sample_format_name_to_dataset_id = dict([(x.format_name, x.dataset_id) for x in nex_session.query(Datasetsample).all()])
reference_id_to_pmid = dict([(x.dbentity_id, x.pmid) for x in nex_session.query(Referencedbentity).all()])

dataset_id_to_pmids = {}
for x in nex_session.query(DatasetReference).all():
    pmids = []
    if x.dataset_id in dataset_id_to_pmids:
        pmids = dataset_id_to_pmids[x.dataset_id]
    pmids.append(reference_id_to_pmid[x.reference_id])
    dataset_id_to_pmids[x.dataset_id] = pmids


mapping_files = ["data/new-2017-07/2015-2016_datasamples_inSPELL_mappingfile-edith.tsv",
                 "data/new-2017-07/spell_to_sample_mapping-1-shuai.tsv",]

old_mapping_files = ["data/new-2017-07/pre2015_SPELL_to_GEOsamples_mappingfile-edith.tsv"]

another_mapping_file = "data/new-2017-07/spell_to_sample_mapping-shuai.tsv"
yet_another_mapping_file = "data/new-2017-07/spell_to_sample_mapping_26700642-shuai.tsv"

spell_cond_to_sample_name = {}
spell_cond_to_sample_format_name = {}
for file in mapping_files:
    f = open(file)
    for line in f:
        if "in SPELL" in line:
            continue
        pieces = line.strip().split("\t")
        if len(pieces) < 4:
            continue
        cond = pieces[1].strip()
        spell_cond_to_sample_name[cond] = pieces[3].strip()
        spell_cond_to_sample_format_name[cond] = pieces[0].strip() + "_" + pieces[2].strip()
        # if cond == "deltazta1_vs_wt_control_repl1":
        #    print cond, spell_cond_to_sample_format_name[cond]
    f.close()

for file in old_mapping_files:
    f = open(file)
    for line in f:
        if "in SPELL" in line:
            continue
        pieces = line.strip().split("\t")
        if len(pieces) < 5:
            continue
        cond = pieces[2].strip()
        spell_cond_to_sample_name[cond] = pieces[4].strip()
        if len(pieces) > 5:
            spell_cond_to_sample_format_name[cond] = pieces[3].strip() + "_" + pieces[5].strip()
    f.close()

f = open(another_mapping_file)
for line in f:
    if "in SPELL" in line:
        continue
    pieces = line.strip().split("\t")
    cond = pieces[1].strip()
    spell_cond_to_sample_format_name[cond] = pieces[2].strip()
f.close()

f = open(yet_another_mapping_file)
for line in f:
    if "in SPELL" in line:
        continue
    pieces = line.strip().split("\t")
    cond = pieces[1].strip()
    spell_cond_to_sample_name[cond] = pieces[2].strip()
f.close()   

pmid_display_name_to_sample_format_name = {}
display_name_to_sample_format_name = {}
for x in nex_session.query(Datasetsample).all():
    pmids = dataset_id_to_pmids.get(x.dataset_id)
    display_name = x.display_name.strip()
    if pmids is None:
        if x.format_name in display_name_to_sample_format_name:
            display_name_to_sample_format_name[display_name] = display_name_to_sample_format_name[display_name]+"|"+x.format_name
        else:
            display_name_to_sample_format_name[display_name] = x.format_name
        continue
    for pmid in pmids:
        pmid_display_name_to_sample_format_name[(pmid, display_name)] = x.format_name
    
nex_session.close()

f = open("data/missing_datasetsample.lst")

for line in f:
    pieces = line.strip().split("\t")
    pmid = int(pieces[0])
    condition_name = pieces[1].strip()
    cond = condition_name
    if condition_name in spell_cond_to_sample_name:
        condition_name = spell_cond_to_sample_name[condition_name]
    
    if (pmid, condition_name) in pmid_display_name_to_sample_format_name:
        sample_format_name = pmid_display_name_to_sample_format_name[(pmid, condition_name)]
        dataset_id = sample_format_name_to_dataset_id[sample_format_name]
        print(pieces[0]+"\t"+pieces[1]+"\t"+sample_format_name+"\t"+str(dataset_id_to_channel_count[dataset_id]))
    elif cond in spell_cond_to_sample_format_name:
        # print condition_name, spell_cond_to_sample_format_name[cond]
        sample_format_name = spell_cond_to_sample_format_name[cond]
        if sample_format_name in sample_format_name_to_dataset_id:
            dataset_id = sample_format_name_to_dataset_id[sample_format_name]
            print(pieces[0]+"\t"+pieces[1]+"\t"+sample_format_name+"\t"+str(dataset_id_to_channel_count[dataset_id]))
    else:
        print("NOT: "+pieces[0]+"\t"+pieces[1])

f.close()
exit()

    
