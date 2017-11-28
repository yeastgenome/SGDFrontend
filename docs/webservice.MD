# SGD API Documentation

Many SGD page URLs can be prepended with `/webservice/` to get a JSON representation of the object.

For example, see https://www.yeastgenome.org/webservice/locus/S000003131 as an example of a locus object.

## Locus

example https://www.yeastgenome.org/webservice/locus/S000003131

SGDID can also be a standard gene name or ORF name

https://www.yeastgenome.org/webservice/locus/RAD54 or https://www.yeastgenome.org/webservice/locus/YGL163C

### Sequence

https://www.yeastgenome.org/webservice/locus/S000003131/sequence_details

with more info about neighboring loci at

https://www.yeastgenome.org/webservice/locus/S000003131/neighbor_sequence_details

### Post-translational Annotation Details

https://www.yeastgenome.org/webservice/locus/S000003131/posttranslational_details

### Protein Experiments

https://www.yeastgenome.org/webservice/locus/S000003131/protein_experiment_details

### Protein Domains

https://www.yeastgenome.org/webservice/locus/S000003131/protein_domain_details

### GO (Gene Ontology) Details

https://www.yeastgenome.org/webservice/locus/S000003131/go_details

### Phenotype Annotation Details

https://www.yeastgenome.org/webservice/locus/S000003131/phenotype_details

### Interaction Details

https://www.yeastgenome.org/webservice/locus/S000003131/interaction_details

### Regulation Details

https://www.yeastgenome.org/webservice/locus/S000003131/regulation_details

### Literature Details

https://www.yeastgenome.org/webservice/locus/S000003131/literature_details

### Expression

expression information is stored on a public Amazon S3 bucket like

https://s3-us-west-2.amazonaws.com/sgd-prod-expression-details/S000003131.json

## Phenotype

example https://www.yeastgenome.org/webservice/phenotype/normal_rate_growth_in_exponential_phase

### Annotations

https://www.yeastgenome.org/webservice/phenotype/normal_rate_growth_in_exponential_phase/locus_details

## GO term

example https://www.yeastgenome.org/webservice/go/GO:1904669

### Annotations

https://www.yeastgenome.org/webservice/go/GO:1904669/locus_details

## Reference

example https://www.yeastgenome.org/webservice/reference/S000145602

can also use PMID such as https://www.yeastgenome.org/webservice/reference/21329885

## Strain

example with SGDID https://www.yeastgenome.org/webservice/strain/S000203491

or strain name https://www.yeastgenome.org/webservice/strain/w303

## Search

The search API lists very basic information (such name, URL, id, and category) for many entities in SGD. Without any paremeters, it will match anything (but only show first 25 results).

https://www.yeastgenome.org/webservice/get_search_results

That query can be altered with the following query params

* `q` query to match in results, can be any string, such as `kinase`
* `category` one of `locus`, `reference`, `biological_process`, `cellular_component`, `molecular_function`, `chemical`, `phenotype`, `observable`, `strain`, `resource`, `colleague`, `reserved_name`
* `limit` number of results to return. If left blank, will return 25 results
* `offset` where to start retrieving results. If set to 10, will get results 10-35 (where `limit` is 25)

The following search will get 100 Molecular Functions that match the query "kinase"

https://www.yeastgenome.org/webservice/get_search_results?q=kinase&category=molecular_function&limit=100
