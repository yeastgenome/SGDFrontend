import _ from 'underscore';
const SEARCH_URL = '/search';

export function getCategoryDisplayName (key) {
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

// create the href that would be true if you toggled the current value
export function getHrefWithoutAgg (history, queryParamsObject, aggKey, thisValue, currentValues, isReset) {
  let newActiveVals = currentValues.slice(0);
  let isActive = (currentValues.indexOf(thisValue) > -1);
  // clear this key if thisValue is blank (likely a react-select clear)
  if (isReset) {
    newActiveVals = thisValue;
  } else if (isActive) {
    newActiveVals = _.without(currentValues, thisValue);
  } else {
    newActiveVals.push(thisValue);
  }
  let newQp = _.clone(queryParamsObject);
  newQp[aggKey] = newActiveVals;
  return history.createPath({ pathname: SEARCH_URL, query: newQp });
};
