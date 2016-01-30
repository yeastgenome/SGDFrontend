export default function (key) {
  const labels = {
    locus: 'Genes',
    reference: 'References',
    cellular_component: 'Cellular Components',
    molecular_function: 'Molecular Functions',
    biological_process: 'Biological Processes',
    phenotype: 'Phenotypes',
    strain: 'Strains',
    author: 'Authors',
    download: 'Downloads',
    resource: 'Resources'
  };
  return labels[key];
};
