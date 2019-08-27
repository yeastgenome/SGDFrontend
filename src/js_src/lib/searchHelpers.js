import _ from 'underscore';

const SINGLE_VAL_FIELDS = ['mode', 'page'];
const CLEARING_FIELDS = ['category'];

export function makeFieldDisplayName(unformattedName) {
  unformattedName = unformattedName || '';
  const labels = {
    locus: 'Gene',
    reference: 'Reference',
    cellular_component: 'Cellular Component',
    molecular_function: 'Molecular Function',
    biological_process: 'Biological Process',
    phenotype: 'Phenotype',
    strain: 'Strain',
    author: 'Author',
    download: 'Download',
    resource: 'Resource',
    contig: 'Contig',
    colleague: 'Colleague',
    observable: 'Observable',
    reserved_name: 'Reserved Gene Names',
    sgdid: 'SGDID'
  };
  return labels[unformattedName] || unformattedName.replace('_', ' ');
}

export function getQueryParamWithValueChanged(key, val, queryParams, isClear=false) {
  let qp = _.clone(queryParams || {});
  let oldVal = _.clone(qp[key]);
  let isSingleValField = (SINGLE_VAL_FIELDS.indexOf(key) > -1);
  if (isSingleValField || oldVal === null || typeof oldVal === 'undefined') {
    qp[key] = val;
    return qp;
  }
  if (typeof oldVal !== 'object') {
    oldVal = [oldVal];
  }
  let newVal;
  if (oldVal.indexOf(val) > -1) {
    newVal = _.without(oldVal, val);
  } else {
    newVal = oldVal;
    if (Array.isArray(val)) {
      newVal = val;
    } else {
      newVal.push(val);
    }
  }
  qp[key] = newVal;
  if (CLEARING_FIELDS.indexOf(key) > -1) {
    qp = { q: qp.q };
    qp[key] = newVal;
    if (isClear) {
      delete qp[key];
    }
    return qp;
  }
  return qp;
}

export function convertSearchObjectToString(searchObject){
  var searchString = Object.keys(searchObject)
    .filter(key => {
      if (typeof (searchObject[key]) == 'object') {
        if (searchObject[key].length > 0){
          return true; 
        }
        return false;
      }
      else{
        return true;
      }
    })
    .map((key) => {
      if (typeof(searchObject[key]) == 'object') {
        return searchObject[key].map(item => key + '=' + item).join('&');
      }
      else {
        //String
        return key + '=' + searchObject[key];
      }
    })
    .join('&');
  return '?' + searchString;
}
