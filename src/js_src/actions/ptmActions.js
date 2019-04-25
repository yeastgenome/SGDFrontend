const SET_DBENTITY_ID = 'SET_DBENTITY_ID';
const SET_TAXONOMY_ID = 'SET_TAXONOMY_ID';
const SET_REFERENCE_ID = 'SET_REFERENCE_ID';
const SET_SITE_INDEX = 'SET_SITE_INDEX';
const SET_SITE_RESIDUE = 'SET_SITE_RESIDUE';
const SET_PSIMOD_ID = 'SET_PSIMOD_ID';
const SET_MODIFIER_ID = 'SET_MODIFIER_ID';

export function setDbentityId(dbentity_id){
  return { type: SET_DBENTITY_ID, dbentity_id: dbentity_id};
}

export function setDbentityId(dbentity_id) {
  return { type: SET_DBENTITY_ID, dbentity_id: dbentity_id };
}