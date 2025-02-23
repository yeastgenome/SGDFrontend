// import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import RowDivider from './RowDivider';
import ModalGeneric from './ModalGeneric';
import axios from "axios";
import Modal from 'react-bootstrap/Modal';

import { RowDisplayMeshTerms } from './BiblioDisplay';
import { RowDisplayCopyrightLicense } from './BiblioDisplay';
import { RowDisplayBooleanDisplayOnly } from './BiblioDisplay';
import { RowDisplayPubmedPublicationStatusDateArrivedInPubmed } from './BiblioDisplay';
import { RowDisplayDateLastModifiedInPubmedDateCreated } from './BiblioDisplay';
import { RowDisplayReferencefiles } from '../Biblio';

import {fetchModReferenceTypes, setBiblioUpdating} from '../../actions/biblioActions';
// import { setUpdateCitationFlag } from '../../actions/biblioActions';	// citation now updates from database triggers
import { setUpdateBiblioFlag } from '../../actions/biblioActions';
import { validateFormUpdateBiblio } from '../../actions/biblioActions';

import { changeFieldReferenceJson } from '../../actions/biblioActions';
import { changeFieldArrayReferenceJson } from '../../actions/biblioActions';
import { changeFieldModReferenceReferenceJson } from '../../actions/biblioActions';
import { deleteFieldModReferenceReferenceJson } from '../../actions/biblioActions';
import { changeFieldModAssociationReferenceJson } from '../../actions/biblioActions';
import { deleteFieldModAssociationReferenceJson } from '../../actions/biblioActions';
import { changeFieldCrossReferencesReferenceJson } from '../../actions/biblioActions';
import { deleteFieldCrossReferencesReferenceJson } from '../../actions/biblioActions';
import { changeFieldReferenceRelationsJson } from '../../actions/biblioActions';
import { changeFieldAuthorsReferenceJson } from '../../actions/biblioActions';
import { biblioAddNewRowString } from '../../actions/biblioActions';
import { biblioAddNewAuthorAffiliation } from '../../actions/biblioActions';
import { biblioAddNewRowDict } from '../../actions/biblioActions';
import { updateButtonBiblio } from '../../actions/biblioActions';
import { closeBiblioUpdateAlert } from '../../actions/biblioActions';
import { changeBiblioAuthorExpandToggler } from '../../actions/biblioActions';
import { biblioRevertField } from '../../actions/biblioActions';
import { biblioRevertFieldArray } from '../../actions/biblioActions';
import { biblioRevertAuthorArray } from '../../actions/biblioActions';
import { biblioRevertDatePublished } from '../../actions/biblioActions';
import { setBiblioEditorModalText } from '../../actions/biblioActions';
import { changeFieldDatePublishedRange } from '../../actions/biblioActions';
import { getXrefPatterns } from '../../actions/biblioActions';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUndo } from '@fortawesome/free-solid-svg-icons'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'

import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import {useEffect, useState} from "react";

// http://dev.alliancegenome.org:49161/reference/AGR:AGR-Reference-0000000001


// if passing an object with <Redirect push to={{ pathname: "/Biblio", state: { pie: "the pie" } }} />, would access new state with
// const Biblio = ({ appState, someAction, location }) => {
// console.log(location.state);  }

export const fieldsSimple = ['curie', 'reference_id', 'title', 'category', 'citation', 'volume', 'page_range', 'language', 'abstract', 'plain_language_abstract', 'publisher', 'issue_name', 'resource_curie', 'resource_title' ];
export const fieldsArrayString = ['keywords', 'pubmed_abstract_languages', 'pubmed_types', 'obsolete_references' ];
 
export const fieldsBooleanDisplayOnly = ['prepublication_pipeline' ];
export const fieldsOrdered = [ 'title', 'mod_corpus_associations', 'cross_references', 'obsolete_references', 'resources_for_curation', 'relations', 'authors', 'DIVIDER', 'copyright_license_name', 'referencefiles', 'DIVIDER', 'citation', 'abstract', 'pubmed_abstract_languages', 'plain_language_abstract', 'DIVIDER', 'category', 'pubmed_types', 'mod_reference_types', 'prepublication_pipeline', 'DIVIDER', 'resource_curie', 'resource_title', 'volume', 'issue_name', 'page_range', 'DIVIDER', 'editors', 'publisher', 'language', 'DIVIDER', 'date_published', 'pubmed_publication_status', 'date_arrived_in_pubmed', 'date_last_modified_in_pubmed', 'date_created', 'DIVIDER', 'keywords', 'mesh_terms' ];
 

export const fieldsPubmed = [ 'title', 'authors', 'abstract', 'pubmed_types', 'resource_curie', 'resource_title', 'volume', 'issue_name', 'page_range', 'editors', 'publisher', 'language', 'pubmed_publication_status', 'date_published', 'date_arrived_in_pubmed', 'date_last_modified_in_pubmed', 'keywords', 'mesh_terms', 'pubmed_abstract_languages', 'plain_language_abstract' ];
export const fieldsDisplayOnly = [ 'citation', 'pubmed_types', 'resource_title', 'pubmed_publication_status', 'date_arrived_in_pubmed', 'date_last_modified_in_pubmed', 'date_created', 'mesh_terms', 'pubmed_abstract_languages', 'plain_language_abstract', 'obsolete_references' ];
export const fieldsDatePublished = [ 'date_published', 'date_published_start', 'date_published_end' ];


export const fieldTypeDict = {}
fieldTypeDict['abstract'] = 'textarea'
fieldTypeDict['citation'] = 'textarea'
fieldTypeDict['plain_language_abstract'] = 'textarea'
fieldTypeDict['category'] = 'select'

export const enumDict = {}
enumDict['category'] = ['research_article', 'review_article', 'thesis', 'book', 'other', 'preprint', 'conference_publication', 'personal_communication', 'direct_data_submission', 'internal_process_reference', 'unknown', 'retraction', 'obsolete', 'correction']
enumDict['mods'] = ['', 'FB', 'MGI', 'RGD', 'SGD', 'WB', 'XB', 'ZFIN']
enumDict['personXrefPrefix'] = ['', 'ORCID']
enumDict['referenceXrefPrefix'] = ['', 'PMID', 'DOI', 'PMCID', 'ISBN', 'Xenbase', 'FB', 'MGI', 'RGD', 'SGD', 'WB', 'ZFIN', 'CGC', 'WBG', 'WM']
enumDict['referenceComcorType'] = ['', 'RetractionOf', 'HasRetraction', 'ErratumFor', 'HasErratum', 'ReprintOf', 'HasReprintA', 'RepublishedFrom', 'RepublishedIn', 'UpdateOf', 'HasUpdate', 'ExpressionOfConcernFor', 'HasExpressionOfConcernFor', 'hasChapter', 'ChapterIn']
enumDict['modAssociationCorpus'] = ['needs_review', 'inside_corpus', 'outside_corpus']
enumDict['modAssociationSource'] = ['', 'mod_pubmed_search', 'dqm_files', 'manual_creation', 'automated_alliance', 'assigned_for_review']

export const comcorMapping = {}
comcorMapping['HasComment'] = 'CommentOn'
comcorMapping['HasErratum'] = 'ErratumFor'
comcorMapping['HasExpressionOfConcernFor'] = 'ExpressionOfConcernFor'
comcorMapping['HasReprint'] = 'ReprintOf'
comcorMapping['RepublishedIn'] = 'RepublishedFrom'
comcorMapping['HasRetraction'] = 'RetractionOf'
comcorMapping['HasUpdate'] = 'UpdateOf'
comcorMapping['hasChapter'] = 'ChapterIn'

// title
// cross_references (doi, pmid, modID)
// authors (collapsed [in a list, or only first author])
// citation (generated from other fields, curators will decide later)
// abstract
//
// category
// pubmed_types
// mod_reference_types
//
// resource (resource_curie resource_title ?)
// volume
// issue_name
// page_range
//
// editors
// publisher
// language
//
// date_published
// date_arrived_in_pubmed
// date_last_modified_in_pubmed
//
// keywords
// mesh_terms


export function splitCurie(curie, toReturn) {
  let curiePrefix = ''; let curieId = '';
  if ( curie.match(/^([^:]*):(.*)$/) ) {
    [curie, curiePrefix, curieId] = curie.match(/^([^:]*):(.*)$/) }
  if (toReturn === undefined) { return [ curiePrefix, curieId ] }
  else if (toReturn === 'id') { return curieId }
  else if (toReturn === 'prefix') { return curiePrefix }
  else { return [ curiePrefix, curieId ] } }

// export function aggregateCitation(referenceJson) {	// 2023 04 11 citation now generated by database triggers
//   // Authors, (year) title.   Journal  volume (issue): page_range
//   let year = ''
//   if ( ('date_published' in referenceJson) && referenceJson['date_published'] !== null && (referenceJson['date_published'].match(/(\d{4})/)) ) {
//     let match = referenceJson['date_published'].match(/(\d{4})/)
//     if (match[1] !== undefined) { year = match[1] } }
//   let title = referenceJson['title'] || ''
//   if (!(title.match(/\.$/))) { title = title + '.' }
//   let authorNames = ''
//   if ('authors' in referenceJson && referenceJson['authors'] !== null) {
//     const orderedAuthors = [];
//     for (const value  of referenceJson['authors'].values()) {
//       let index = value['order'] - 1;
//       if (index < 0) { index = 0 }	// temporary fix for fake authors have an 'order' field value of 0
//       orderedAuthors[index] = value; }
//     authorNames = orderedAuthors.map((dict, index) => ( dict['name'] )).join('; '); }
//   const journal = referenceJson['resource_title'] || ''
//   const volume = referenceJson['volume'] || ''
//   const issue = referenceJson['issue_name'] || ''
//   const page_range = referenceJson['page_range'] || ''
//   const citation = `${authorNames}, (${year}) ${title}  ${journal} ${volume} (${issue}): ${page_range}`
//   return citation }


export const BiblioSubmitUpdateRouter = () => {
  const biblioUpdating = useSelector(state => state.biblio.biblioUpdating);

  if (biblioUpdating > 0) {
    return (<BiblioSubmitUpdating />); }
  else {
    return (<><AlertDismissibleBiblioUpdate /><BiblioSubmitUpdateButton /></>); }
} // const BiblioSubmitUpdateRouter

const AlertDismissibleBiblioUpdate = () => {
  const dispatch = useDispatch();
  const updateAlert = useSelector(state => state.biblio.updateAlert);
  const updateFailure = useSelector(state => state.biblio.updateFailure);
  const updateMessages = useSelector(state => state.biblio.updateMessages);
  const biblioEditorModalText = useSelector(state => state.biblio.biblioEditorModalText);
  const accessToken = useSelector(state => state.isLogged.accessToken);
    
  const [showTetModal, setShowTetModal] = useState(false);
  const [tetErrorMessage, setTetErrorMessage] = useState("");
  const [modCorpusAssociationId, setModCorpusAssociationId] = useState(null);

  useEffect(() => {
    if (biblioEditorModalText.includes("Curated topic and entity tags")) {
      const idMatch = biblioEditorModalText.match(/mod_corpus_association_id\s*=\s*(\d+)/);
      if (idMatch) {
        setModCorpusAssociationId(idMatch[1]);
      }
      const displayMessage = biblioEditorModalText.replace(/mod_corpus_association_id\s*=\s*\d+/, "");
      setTetErrorMessage(displayMessage);
      setShowTetModal(true);
      dispatch(setBiblioEditorModalText(''));
    }
  }, [biblioEditorModalText, dispatch]);

  useEffect(() => {
    if (updateAlert && updateFailure > 0) {
      const curatedTagsMessage = updateMessages.find(msg => 
        msg.includes("Curated topic and entity tags")
      );
      if (curatedTagsMessage) {
        const idMatch = curatedTagsMessage.match(/mod_corpus_association_id\s*=\s*(\d+)/);
        if (idMatch) {
          setModCorpusAssociationId(idMatch[1]);
        }
        setTetErrorMessage(
          "Curated topic and entity tags or automated tags generated from your MOD " +
          "are associated with this reference. Please check with the curator who added these tags."
        );
        setShowTetModal(true);
        dispatch(closeBiblioUpdateAlert());
      }
    }
  }, [updateAlert, updateMessages, dispatch]);

  const handleDeleteTetTagsAndPaper = async () => {
    if (!modCorpusAssociationId) {
      return;
    }
    const url = `${process.env.REACT_APP_RESTAPI}/reference/mod_corpus_association/${modCorpusAssociationId}`;
    try {
      await axios.patch(url,
        { 'corpus': false, 'force_out': true },
        { headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      setShowTetModal(false);
      setModCorpusAssociationId(null);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete workflow / TET tags and remove the paper from mod corpus:", err);
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || "Deletion failed";
      dispatch(setBiblioEditorModalText(errorDetail));
    }
  };

  const handleCloseTetModal = () => {
    setShowTetModal(false);
    setModCorpusAssociationId(null);
    setTetErrorMessage("");
  };

  const variant = updateFailure === 0 ? 'success' : 'danger';
  const header = updateFailure === 0 ? 'Update Success' : 'Update Failure';

  return (
    <>
      {/* Curated Tags Modal */}
      <Modal show={showTetModal} onHide={handleCloseTetModal}>
        <Modal.Header closeButton>
          <Modal.Title>Curated Topic/Entity Tags Found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{tetErrorMessage}</p>
          {modCorpusAssociationId && (
            <p className="text-muted small">Association ID: {modCorpusAssociationId}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseTetModal}>
            Keep Tags and Paper
          </Button>
          <Button variant="danger" onClick={handleDeleteTetTagsAndPaper}>
            Delete Tags and Paper
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Regular Alert (for non-curated-tag messages) */}
      {updateAlert && !showTetModal && (
        <Alert variant={variant} onClose={() => dispatch(closeBiblioUpdateAlert())} dismissible>
          <Alert.Heading>{header}</Alert.Heading>
          {updateMessages.map((message, index) => (
            <div key={`${message} ${index}`}>
              {message.replace(/mod_corpus_association_id\s*=\s*\d+/, "")}
            </div>
          ))}
        </Alert>
      )}
    </>
  );
};


const BiblioSubmitUpdating = () => {
  return (
       <Row className="form-group row" >
         <Col className="form-label col-form-label" sm="2" ></Col>
         <Col sm="10" ><div className="form-control biblio-updating" >updating Biblio data</div></Col>
       </Row>
  );
}

const BiblioSubmitUpdateButton = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.isLogged.accessToken);
  const referenceJsonLive = useSelector(state => state.biblio.referenceJsonLive);
  const referenceJsonDb = useSelector(state => state.biblio.referenceJsonDb);
  const referenceJsonHasChange = useSelector(state => state.biblio.referenceJsonHasChange);
  let updatedFlag = '';
  if (Object.keys(referenceJsonHasChange).length > 0) { updatedFlag = 'updated-biblio-button'; }

  function generateCrossReferenceUpdateJson(crossRefDict, referenceCurie) {
    let crossRefCurie = crossRefDict['curie']
    let hasPages = false
    let updateJson = { 'reference_curie': referenceCurie }
    if (('curie' in crossRefDict) && (crossRefDict['curie'] !== '')) {
      // let [valueLiveCuriePrefix, valueLiveCurieId] = splitCurie(crossRefCurie);
      let valueLiveCuriePrefix = splitCurie(crossRefCurie, 'prefix');
      hasPages = (enumDict['mods'].includes(valueLiveCuriePrefix)) ? true : false; }
    if (hasPages) { updateJson['pages'] = [ 'reference' ] }
    if (('is_obsolete' in crossRefDict) && (crossRefDict['is_obsolete'] !== '')) {
      updateJson['is_obsolete'] = crossRefDict['is_obsolete'] }
    return updateJson }

  function updateBiblio(referenceCurie, referenceJsonLive) {
    // console.log('updateBiblio')
    const forApiArray = []
    let updateJson = {}
    const fieldsSimpleNotPatch = ['reference_id', 'curie', 'resource_curie', 'resource_title'];
    for (const field of fieldsSimple.values()) {
      if ((field in referenceJsonLive) && !(fieldsSimpleNotPatch.includes(field)) && !(fieldsDisplayOnly.includes(field))) {
        updateJson[field] = referenceJsonLive[field] } }
    for (const field of fieldsDatePublished.values()) {
      if (field in referenceJsonLive) {
        updateJson[field] = referenceJsonLive[field] } }
    const fieldsArrayStringNotPatch = ['obsolete_references'];
    for (const field of fieldsArrayString.values()) {
      if ((field in referenceJsonLive) && !(fieldsArrayStringNotPatch.includes(field)) && !(fieldsDisplayOnly.includes(field))) {
        updateJson[field] = referenceJsonLive[field] } }
    let subPath = 'reference/' + referenceCurie;
    let array = [ subPath, updateJson, 'PATCH', 0, null, null]
    forApiArray.push( array );

    if ('mod_reference_types' in referenceJsonLive && referenceJsonLive['mod_reference_types'] !== null) {
      const modRefFields = [ 'reference_type', 'mod_abbreviation' ];
      for (const[index, modRefDict] of referenceJsonLive['mod_reference_types'].entries()) {
        if (('needsChange' in modRefDict) && ('mod_reference_type_id' in modRefDict)) {
          let updateJson = { 'reference_curie': referenceCurie }
          for (const field of modRefFields.values()) {
            if (field in modRefDict) {
              updateJson[field] = modRefDict[field] } }
          let subPath = 'reference/mod_reference_type/';
          let method = 'POST';
          let field = 'mod_reference_types';
          let subField = 'mod_reference_type_id';
          if (modRefDict['mod_reference_type_id'] !== 'new') {
            subPath = 'reference/mod_reference_type/' + modRefDict['mod_reference_type_id'];
            field = null;
            subField = null;
            method = 'PATCH' }
          if (('deleteMe' in modRefDict) && (modRefDict['deleteMe'] === true)) {
            subPath = 'reference/mod_reference_type/' + modRefDict['mod_reference_type_id'];
            field = null;
            subField = null;
            method = 'DELETE' }
          let array = [ subPath, updateJson, method, index, field, subField ]
          forApiArray.push( array );
    } } }

    if ('authors' in referenceJsonLive && referenceJsonLive['authors'] !== null) {
      const authorFields = [ 'order', 'name', 'first_name', 'last_name', 'orcid', 'first_author', 'corresponding_author', 'affiliations' ];
      for (const[index, authorDict] of referenceJsonLive['authors'].entries()) {
        if (('needsChange' in authorDict) && ('author_id' in authorDict)) {
          let updateJson = { 'reference_curie': referenceCurie }
          for (const field of authorFields.values()) {
            if (field in authorDict) {
              updateJson[field] = authorDict[field]
              if (field === 'orcid') {		// orcids just pass the orcid string, not the whole dict
                let orcidValue = null;
                // if author orcid has object instead of string
                // if ( (authorDict['orcid'] !== null) && ('curie' in authorDict['orcid']) &&
                //      (authorDict['orcid']['curie'] !== null) && (authorDict['orcid']['curie'] !== '') ) {
                //   orcidValue = authorDict['orcid']['curie'].toUpperCase();
                //   if (!( orcidValue.match(/^ORCID:(.*)$/) ) ) {
                //     orcidValue = 'ORCID:' + orcidValue; } }
                if (authorDict['orcid'] !== null) {
                  orcidValue = authorDict['orcid'].toUpperCase();
                  if ( (orcidValue !== '') && (!( orcidValue.match(/^ORCID:(.*)$/) ) ) ) {
                    orcidValue = 'ORCID:' + orcidValue; } }
                updateJson['orcid'] = orcidValue; } } }
          let subPath = 'author/';
          let method = 'POST';
          let field = 'authors';
          let subField = 'author_id';
          if (authorDict['author_id'] !== 'new') {
            subPath = 'author/' + authorDict['author_id'];
            field = null;
            subField = null;
            method = 'PATCH' }
          let array = [ subPath, updateJson, method, index, field, subField ]
          forApiArray.push( array );
    } } }

    if ('relations' in referenceJsonLive && referenceJsonLive['relations'] !== null) {
      let field = 'relations';
      for (const[index, comcorDict] of referenceJsonLive['relations'].entries()) {
        if ('needsChange' in comcorDict) {
          let fromCurie = referenceCurie
          let toCurie = comcorDict['curie']
          let comcorType = comcorDict['type']
          if (comcorType in comcorMapping) {
            toCurie = referenceCurie
            fromCurie = comcorDict['curie']
            comcorType = comcorMapping[comcorType] }
          let apiJson = {'reference_curie_from': fromCurie, 'reference_curie_to': toCurie, 'reference_relation_type': comcorType}
          let method = 'POST'
          let subPath = 'reference_relation/'
          if (('reference_relation_id' in comcorDict) &&
              (comcorDict['reference_relation_id'] !== 'new')) {	// whole new entries needs create
            method = 'PATCH'
            subPath = 'reference_relation/' + comcorDict['reference_relation_id'] }
          if (comcorType === '') {
            method = 'DELETE'
            apiJson = null }
          let array = [ subPath, apiJson, method, index, field, null ]
          forApiArray.push( array );
    } } }

    if ('mod_corpus_associations' in referenceJsonLive && referenceJsonLive['mod_corpus_associations'] !== null) {
      const modAssociationFields = [ 'mod_abbreviation', 'corpus', 'mod_corpus_sort_source' ];
      for (const[index, modAssociationDict] of referenceJsonLive['mod_corpus_associations'].entries()) {
//         if ('needsChange' in modAssociationDict) { console.log('needsChange') }
//         if ('mod_corpus_association_id' in modAssociationDict) { console.log('mod_corpus_association_id') }
        if (('needsChange' in modAssociationDict) && ('mod_corpus_association_id' in modAssociationDict)) {
//           console.log('both')
          let updateJson = { 'reference_curie': referenceCurie }
          for (const field of modAssociationFields.values()) {
            if (field in modAssociationDict) {
              let fieldValue = modAssociationDict[field]
              if (field === 'corpus') {
                if      (fieldValue === 'needs_review')   { fieldValue = null; }
                else if (fieldValue === 'inside_corpus')  { fieldValue = true; }
                else if (fieldValue === 'outside_corpus') { fieldValue = false; } }
              updateJson[field] = fieldValue } }
          let subPath = 'reference/mod_corpus_association/';
          let method = 'POST';
          let field = 'mod_corpus_associations';
          let subField = 'mod_corpus_association_id';
          if (modAssociationDict['mod_corpus_association_id'] !== 'new') {
            if ('mod_abbreviation' in updateJson) { delete updateJson.mod_abbreviation; }
            subPath = 'reference/mod_corpus_association/' + modAssociationDict['mod_corpus_association_id'];
            field = null;
            subField = null;
            method = 'PATCH' }
          if (('deleteMe' in modAssociationDict) && (modAssociationDict['deleteMe'] === true)) {
            subPath = 'reference/mod_corpus_association/' + modAssociationDict['mod_corpus_association_id'];
            field = null;
            subField = null;
            method = 'DELETE' }
          let array = [ subPath, updateJson, method, index, field, subField ]
          // console.log(updateJson)
          // console.log(array)
          forApiArray.push( array );
    } } }

    if ('cross_references' in referenceJsonLive && referenceJsonLive['cross_references'] !== null) {
      // const crossRefFields = [ 'curie', 'is_obsolete' ];
      let field = 'cross_references';
      for (const[index, crossRefDict] of referenceJsonLive['cross_references'].entries()) {
        if ('needsChange' in crossRefDict) {
          let needsCreate = false
          if (crossRefDict['cross_reference_id'] === 'new') {		// whole new entries needs create
            needsCreate = true }
          else if ('curie' in crossRefDict) {			// pre-existing entries need delete or update
            let crossRefCurieDb = referenceJsonDb[field][index]['curie']
            let crossRefCurieLive = crossRefDict['curie']
            let subPath = 'cross_reference/' + referenceJsonDb[field][index]['cross_reference_id']
            if ( crossRefCurieLive !== crossRefCurieDb ) {	// xref curie has changed, delete+create
              needsCreate = true
              let array = [ subPath, null, 'DELETE', index, field, null ]
              forApiArray.push( array ); }
            else if (('deleteMe' in crossRefDict) && (crossRefDict['deleteMe'] === true)) {
              let array = [ subPath, null, 'DELETE', index, field, null ]
              forApiArray.push( array ); }
            else {	// xref curie same, update (delete+create async would cause create failure before delete
              let updateJson = generateCrossReferenceUpdateJson(crossRefDict, referenceCurie)
              // console.log('updateJson'); console.log(updateJson)
              let array = [ subPath, updateJson, 'PATCH', index, field, null ]
              forApiArray.push( array ); } }
          if ((needsCreate === true) && ('curie' in crossRefDict) && (crossRefDict['curie'] !== '')) {
            let createJson = generateCrossReferenceUpdateJson(crossRefDict, referenceCurie)
            createJson['curie'] = crossRefDict['curie']		// createJson is same as updateJson + crossRef curie
            // console.log('createJson'); console.log(createJson)
            let subPath = 'cross_reference/'
            let array = [ subPath, createJson, 'POST', index, field, null ]
            forApiArray.push( array ); }
    } } }

    let dispatchCount = forApiArray.length;

    // console.log('dispatchCount ' + dispatchCount)
    dispatch(setBiblioUpdating(dispatchCount))

    // set flag to update citation once all these api calls are done
//     dispatch(setUpdateCitationFlag(true))	// citation now updates from database triggers

    for (const arrayData of forApiArray.values()) {
      arrayData.unshift(accessToken)
      dispatch(updateButtonBiblio(arrayData))
    }
    // console.log('end updateBiblio')
  } // function updateBiblio(referenceCurie, referenceJsonLive)

  const updateBiblioFlag = useSelector(state => state.biblio.updateBiblioFlag);
  if (referenceJsonLive.curie !== '' && (updateBiblioFlag === true)) {
    console.log('biblio DISPATCH update biblio for ' + referenceJsonLive.curie);
    updateBiblio(referenceJsonLive.curie, referenceJsonLive)
    dispatch(setUpdateBiblioFlag(false))
  }

  return (
       <Row className="form-group row" >
         <Col className="form-label col-form-label" sm="2" ></Col>
         <Col sm="10" ><div className={`form-control biblio-button ${updatedFlag}`} type="submit" onClick={() => dispatch(validateFormUpdateBiblio())}>Update Biblio Data</div></Col>
       </Row>
  );
} // const BiblioSubmitUpdateButton

const ColEditorSimple = ({fieldType, fieldName, value, colSize, updatedFlag, disabled, placeholder, fieldKey, dispatchAction}) => {
  const dispatch = useDispatch();
  if (value === null) { value = '' }
  return (  <Col sm={colSize}>
              <Form.Control as={fieldType} id={fieldKey} type="{fieldName}" value={value} className={`form-control ${updatedFlag}`} disabled={disabled} placeholder={placeholder} onChange={(e) => dispatch(dispatchAction(e))} />
            </Col>); }

const ColEditorSelect = ({fieldType, fieldName, value, colSize, updatedFlag, disabled, placeholder, fieldKey, dispatchAction, enumType}) => {
  const dispatch = useDispatch();
  return (  <Col sm={colSize}>
              <Form.Control as={fieldType} id={fieldKey} type="{fieldName}" value={value} className={`form-control ${updatedFlag}`} disabled={disabled} placeholder={placeholder} onChange={(e) => dispatch(dispatchAction(e))} >
                {enumType in enumDict && enumDict[enumType].map((optionValue, index) => (
                  <option key={`${fieldKey} ${optionValue}`}>{optionValue}</option>
                ))}
              </Form.Control>
            </Col>); }

const ColEditorSelectNumeric = ({fieldType, fieldName, value, colSize, updatedFlag, disabled, placeholder, fieldKey, dispatchAction, minNumber, maxNumber}) => {
  const dispatch = useDispatch();
  const numericOptionElements = []
  for (let i = minNumber; i <= maxNumber; i++) {
    numericOptionElements.push(<option key={`${fieldKey} ${i}`}>{i}</option>) }
  return (  <Col sm={colSize}>
              <Form.Control as={fieldType} id={fieldKey} type="{fieldName}" value={value} className={`form-control ${updatedFlag}`} disabled={disabled} placeholder={placeholder} onChange={(e) => dispatch(dispatchAction(e))} >
              {numericOptionElements}
              </Form.Control>
            </Col>); }

const ColEditorCheckbox = ({colSize, label, updatedFlag, disabled, fieldKey, checked, dispatchAction}) => {
  const dispatch = useDispatch();
  return (  <Col sm={colSize} className={`Col-checkbox ${updatedFlag}`} >
              <Form.Check inline className={`ColEditorCheckbox`} checked={checked} disabled={disabled} type='checkbox' label={label} id={fieldKey} onChange={(e) => dispatch(dispatchAction(e))} />
            </Col>); }

const RowEditorString = ({fieldName, referenceJsonLive, referenceJsonDb}) => {
  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
  let disabled = ''
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }
  let valueLive = ''; let valueDb = ''; let updatedFlag = '';
  if (fieldName in referenceJsonDb) { valueDb = referenceJsonDb[fieldName] }
  if (fieldName in referenceJsonLive) { valueLive = referenceJsonLive[fieldName] }
//   if (fieldName === 'citation') {	// 2023 04 11 citation now generated by database triggers
//     valueDb = aggregateCitation(referenceJsonDb)
//     valueLive = aggregateCitation(referenceJsonLive) }
  if (valueLive !== valueDb) { updatedFlag = 'updated'; }
  valueLive = valueLive || '';
  let fieldType = 'input';
  if (fieldName in fieldTypeDict) { fieldType = fieldTypeDict[fieldName] }
  let otherColSize = 9;
  let revertElement = (<Col sm="1"><Button id={`revert ${fieldName}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertField(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
  if (disabled === 'disabled') { revertElement = (<></>); otherColSize = 10; }
  let colEditorElement = (<ColEditorSimple key={`colElement ${fieldName}`} fieldType={fieldType} fieldName={fieldName} colSize={otherColSize} value={valueLive} updatedFlag={updatedFlag} placeholder={fieldName} disabled={disabled} fieldKey={fieldName} dispatchAction={changeFieldReferenceJson} />)
  if (fieldType === 'select') {
    colEditorElement = (<ColEditorSelect key={`colElement ${fieldName}`} fieldType={fieldType} fieldName={fieldName} colSize={otherColSize} value={valueLive} updatedFlag={updatedFlag} disabled={disabled} fieldKey={fieldName} dispatchAction={changeFieldReferenceJson} enumType={fieldName} />) }
  return ( <Form.Group as={Row} key={fieldName} >
             <Form.Label column sm="2" className={`Col-general`} >{fieldName}</Form.Label>
             {colEditorElement}
             {revertElement}
           </Form.Group>);
} // const RowEditorString

const RowEditorArrayString = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb}) => {
  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
  let disabled = ''
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }
  const rowArrayStringElements = []
  if (fieldName in referenceJsonLive && referenceJsonLive[fieldName] !== null) {	// need this because referenceJsonLive starts empty before values get added
      let fieldType = 'input';
      for (const [index, valueLive] of referenceJsonLive[fieldName].entries()) {
        let otherColSize = 9;
        let revertElement = (<Col sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
        if (disabled === 'disabled') { revertElement = (<></>); otherColSize = 10; }
        let valueDb = ''; let updatedFlag = '';
        if (typeof referenceJsonDb[fieldName][index] !== 'undefined') { valueDb = referenceJsonDb[fieldName][index] }
        if (valueLive !== valueDb) { updatedFlag = 'updated'; }
        rowArrayStringElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index}`} >
            <Form.Label column sm="2" className="Col-general" >{fieldName}</Form.Label>
            <ColEditorSimple key={`colElement ${fieldName} ${index}`} fieldType={fieldType} fieldName={fieldName} colSize={otherColSize} value={valueLive} updatedFlag={updatedFlag} placeholder={fieldName} disabled={disabled} fieldKey={`${fieldName} ${index}`} dispatchAction={changeFieldArrayReferenceJson} />
            {revertElement}
          </Form.Group>); } }
  if (disabled === '') {
    rowArrayStringElements.push(
      <Row className="form-group row" key={fieldName} >
        <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
        <Col sm="10" ><div id={fieldName} className="form-control biblio-button" onClick={(e) => dispatch(biblioAddNewRowString(e))} >add {fieldName}</div></Col>
      </Row>);
  }
  return (<>{rowArrayStringElements}</>); }

const RowEditorDatePublished = ({fieldName, referenceJsonLive, referenceJsonDb}) => {
  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
  let disabled = false
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = true; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = true; }
  let valueLive = ''; let valueDb = ''; let updatedFlag = '';
  if (fieldName in referenceJsonDb) { valueDb = referenceJsonDb[fieldName] }
  if (fieldName in referenceJsonLive) { valueLive = referenceJsonLive[fieldName] }
//   if (fieldName === 'citation') {	// 2023 04 11 citation now generated by database triggers
//     valueDb = aggregateCitation(referenceJsonDb)
//     valueLive = aggregateCitation(referenceJsonLive) }
  if (valueLive !== valueDb) { updatedFlag = 'updated'; }
  valueLive = valueLive || '';
  let fieldType = 'input';
  if (fieldName in fieldTypeDict) { fieldType = fieldTypeDict[fieldName] }
  let otherColSize = 5;
  let revertElement = (<Col sm="1"><Button id={`revert ${fieldName}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertDatePublished(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
  if (disabled) { revertElement = (<></>); otherColSize = 6; }
  return ( <Form.Group as={Row} key={fieldName} >
             <Form.Label column sm="2" className={`Col-general`} >{fieldName}</Form.Label>
             <ColEditorSimple key={`colElement ${fieldName}`} fieldType={fieldType} fieldName={fieldName} colSize={otherColSize} value={valueLive} updatedFlag={updatedFlag} placeholder={fieldName} disabled="disabled" fieldKey={fieldName} dispatchAction={changeFieldReferenceJson} />
             <Col sm="4" key="colElement dateRange" style={{alignSelf: 'center'}}><BiblioDateComponent referenceJsonLive={referenceJsonLive} disabled={disabled} /></Col>
             {revertElement}
           </Form.Group>);
} // const RowEditorDatePublished

const BiblioDateComponent = ({referenceJsonLive, disabled}) => {
  const dispatch = useDispatch();
  const dateRangeStart = ('date_published_start' in referenceJsonLive && referenceJsonLive['date_published_start'] !== null) ?
                          new Date(referenceJsonLive['date_published_start']) : null
  const dateRangeEnd = ('date_published_end' in referenceJsonLive && referenceJsonLive['date_published_end'] !== null) ?
                          new Date(referenceJsonLive['date_published_end']) : null
  // purposely don't allow clearing the date picker, because curators don't want to allow it to be set back to empty
  return (<DateRangePicker value={[dateRangeStart, dateRangeEnd]} clearIcon={null} disabled={disabled}
            onChange={(newDateRangeArr) => {
              if (newDateRangeArr === null) {
                // dispatch(changeFieldDatePublishedRange([null, null]));	// curators don't want to be able to set blank date, but it also causes the page to crash
                dispatch(setBiblioEditorModalText('Not allowed to set empty date')); }
              else {
                if (newDateRangeArr[0] !== null) {
                  newDateRangeArr[0] = new Date(newDateRangeArr[0].toDateString()).toISOString().substring(0, 10); }
                if (newDateRangeArr[1] !== null) {
                  newDateRangeArr[1] = new Date(newDateRangeArr[1].toDateString()).toISOString().substring(0, 10); }
                dispatch(changeFieldDatePublishedRange(newDateRangeArr)) }
            }} />)
} // const BiblioDateComponent


const RowEditorModReferenceTypes = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb}) => {
  const [modReferenceTypes, setModReferenceTypes] = useState({});

  useEffect(() => {
    fetchModReferenceTypes(enumDict['mods']).then((modRefTypes) => setModReferenceTypes(modRefTypes));
  }, [])

  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
//   const revertDictFields = 'mod_abbreviation, reference_type'
  const initializeDict = {'mod_abbreviation': '', 'reference_type': '', 'mod_reference_type_id': 'new'}
  let disabled = ''
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }
  const rowModReferenceTypesElements = []
  if ('mod_reference_types' in referenceJsonLive && referenceJsonLive['mod_reference_types'] !== null) {
//     let fieldType = 'input';
//     if (fieldName in fieldTypeDict) { fieldType = fieldTypeDict[fieldName] }
    for (const[index, modRefDict] of referenceJsonLive['mod_reference_types'].entries()) {
      let otherColSize = 5;
//       let revertElement = (<Col sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" value={revertDictFields} onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
      let buttonsElement = (<Col className="Col-editor-buttons" sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
      if ('mod_reference_type_id' in modRefDict && modRefDict['mod_reference_type_id'] !== 'new') {
        buttonsElement = (<Col className="Col-editor-buttons" sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}<Button id={`delete ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(deleteFieldModReferenceReferenceJson(e))} ><FontAwesomeIcon icon={faTrashAlt} /></Button>{' '}</Col>); }
      if (disabled === 'disabled') { buttonsElement = (<></>); otherColSize = 6; }
      let valueLiveModAbbreviation = modRefDict['mod_abbreviation']; let valueDbModAbbreviation = ''; let updatedFlagModAbbreviation = '';
      let valueLiveReferenceType = modRefDict['reference_type']; let valueDbReferenceType = ''; let updatedFlagReferenceType = '';
      const mrtDeleted = (('deleteMe' in modRefDict) && (modRefDict['deleteMe'] === true)) ? true : false;
      if ( (typeof referenceJsonDb[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonDb[fieldName][index]['mod_abbreviation'] !== 'undefined') ) {
             valueDbModAbbreviation = referenceJsonDb[fieldName][index]['mod_abbreviation'] }
      if ( (typeof referenceJsonDb[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonDb[fieldName][index]['reference_type'] !== 'undefined') ) {
             valueDbReferenceType = referenceJsonDb[fieldName][index]['reference_type'] }
      if (valueLiveModAbbreviation !== valueDbModAbbreviation) { updatedFlagModAbbreviation = 'updated'; }
      if (valueLiveReferenceType !== valueDbReferenceType) { updatedFlagReferenceType = 'updated'; }
      if (mrtDeleted) {
        rowModReferenceTypesElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >{fieldName} </Col>
            <Col className="Col-general form-label col-form-label updated" sm={4 + otherColSize} ><span style={{color: 'red'}}>Deleted</span>&nbsp; {valueLiveModAbbreviation} {valueLiveReferenceType}</Col>
            {buttonsElement}
          </Form.Group>); }
      else {
        rowModReferenceTypesElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
            <Col sm={4}>
              <Form.Control as="select" id={`${fieldName} ${index} mod_abbreviation`} value={valueLiveModAbbreviation} placeholder="mod_abbreviation" className={`form-control ${updatedFlagModAbbreviation}`} disabled={disabled} key={`${fieldName} ${index} mod_abbreviation`} onChange={(e) => {
                dispatch(changeFieldModReferenceReferenceJson(e));
                dispatch(changeFieldModReferenceReferenceJson({target: {id: `${fieldName} ${index} reference_type`, value: ''}}));
              }}>
                {enumDict['mods'].map((optionValue, index) => (
                    <option key={`${fieldName} ${index} reference_type ${optionValue}`}>{optionValue}</option>
                ))}
              </Form.Control>
            </Col>
            <Col sm={otherColSize}>
              <Form.Control as="select" id={`${fieldName} ${index} reference_type`} type={fieldName} value={valueLiveReferenceType} className={`form-control ${updatedFlagReferenceType}`} disabled={disabled} placeholder="reference_type" onChange={(e) => dispatch(changeFieldModReferenceReferenceJson(e))} >
              {valueLiveModAbbreviation in modReferenceTypes ? modReferenceTypes[valueLiveModAbbreviation].map((optionValue, index) => (
                    <option key={`${fieldName} ${index} reference_type ${optionValue}`}>{optionValue}</option>
                )) : null}
              </Form.Control>
            </Col>
            {buttonsElement}
          </Form.Group>); } } }
  if (disabled === '') {
    rowModReferenceTypesElements.push(
      <Row className="form-group row" key={fieldName} >
        <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
        <Col sm="10" ><div id={fieldName} className="form-control biblio-button" onClick={(e) => dispatch(biblioAddNewRowDict(e, initializeDict))} >add {fieldName}</div></Col>
      </Row>);
  }
  return (<>{rowModReferenceTypesElements}</>); }

const RowEditorModAssociation = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb}) => {
  const dispatch = useDispatch();
  const oktaMod = useSelector(state => state.isLogged.oktaMod);
  const testerMod = useSelector(state => state.isLogged.testerMod);
  const accessLevel = (testerMod !== 'No') ? testerMod : oktaMod;  

  const initializeDict = {'mod_abbreviation': '',
			  'corpus': 'needs_review',
			  'mod_corpus_sort_source': 'assigned_for_review',
			  'mod_corpus_association_id': 'new'}
  let disabled = ''
//   if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
//   if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }
  const rowModAssociationElements = []
    
  if ('mod_corpus_associations' in referenceJsonLive &&
      referenceJsonLive['mod_corpus_associations'] !== null) {
      for (const[index, modAssociationDict] of referenceJsonLive[
	  'mod_corpus_associations'
      ].entries()) {
	  let otherColSize = 3;
	  let otherColSizeB = 4;
	  let buttonsElement = (
	    <Col className="Col-editor-buttons" sm="1">
              <Button
	        id={`revert ${fieldName} ${index}`}
	        variant="outline-secondary"
	        onClick={(e) => dispatch(biblioRevertFieldArray(e))}
	      >
		<FontAwesomeIcon icon={faUndo} />
              </Button>{' '}
	    </Col>
	  );
	  if ('mod_corpus_association_id' in modAssociationDict &&
	      modAssociationDict['mod_corpus_association_id'] !== 'new') {
            buttonsElement = (
	      <Col className="Col-editor-buttons" sm="1">
		<Button
		  id={`revert ${fieldName} ${index}`}
		  variant="outline-secondary"
		  onClick={(e) => dispatch(biblioRevertFieldArray(e))}
		>
		  <FontAwesomeIcon icon={faUndo} />
		</Button>{' '}
		<Button
		  id={`delete ${fieldName} ${index}`}
		  variant="outline-secondary"
		  onClick={(e) => dispatch(deleteFieldModAssociationReferenceJson(e))}
		>
		  <FontAwesomeIcon icon={faTrashAlt} />
		</Button>{' '}
              </Col>
	    );
	  }

// 	  if (disabled === 'disabled') {
// 	    buttonsElement = (<></>);
// 	    otherColSize = 8;
// 	  }

	  const valueLiveMod = modAssociationDict['mod_abbreviation'];
	  let valueDbMod = '';
	  let updatedFlagMod = '';
	  const valueLiveCorpus = modAssociationDict['corpus'];
	  let valueDbCorpus = '';
	  let updatedFlagCorpus = '';
	  const valueLiveSource = modAssociationDict['mod_corpus_sort_source'];
	  let valueDbSource = '';
	  let updatedFlagSource = '';
	  const valueLiveMcaId = modAssociationDict['mod_corpus_association_id'];

	  const mcaDeleted =
	    'deleteMe' in modAssociationDict && modAssociationDict['deleteMe'] === true
	      ? true
	      : false;
	  
	  if (typeof referenceJsonDb[fieldName][index] !== 'undefined' &&
	      typeof referenceJsonDb[fieldName][index]['mod_abbreviation'] !== 'undefined') {
              valueDbMod = referenceJsonDb[fieldName][index]['mod_abbreviation']
	  }
	  
	  if (typeof referenceJsonDb[fieldName][index] !== 'undefined' &&
              typeof referenceJsonDb[fieldName][index]['corpus'] !== 'undefined') {
              valueDbCorpus = referenceJsonDb[fieldName][index]['corpus']
	  }

	  if (typeof referenceJsonDb[fieldName][index] !== 'undefined' &&
              typeof referenceJsonDb[fieldName][index]['mod_corpus_sort_source'] !== 'undefined') {
              valueDbSource = referenceJsonDb[fieldName][index]['mod_corpus_sort_source']
	  }

	  if (valueLiveMod !== valueDbMod) {
	      updatedFlagMod = 'updated';
	  }

	  if (valueLiveCorpus !== valueDbCorpus) {
	      updatedFlagCorpus = 'updated';
	  }

	  if (valueLiveSource !== valueDbSource) {
	      updatedFlagSource = 'updated';
	  }

	  if (mcaDeleted) {
	    rowModAssociationElements.push(
	      <Form.Group as={Row} key={`${fieldName} ${index}`}>
                <Col className="Col-general form-label col-form-label" sm="2" >{fieldName} </Col>
                <Col className="Col-general form-label col-form-label updated" sm={2 + otherColSize + otherColSizeB} ><span style={{color: 'red'}}>Deleted</span>&nbsp; {valueLiveMod} {valueLiveCorpus} {valueLiveSource}</Col>
                {buttonsElement}
              </Form.Group>);
          } else {
	    rowModAssociationElements.push(
	      <Form.Group as={Row} key={`${fieldName} ${index}`}>
	        <Col className="Col-general form-label col-form-label" sm="2" >
	          {fieldName}
	        </Col>
	        {valueLiveMcaId === 'new' ? (
                  <Col sm="2">
                    <Form.Control as="select" id={`${fieldName} ${index} mod_abbreviation`} type="{fieldName}" value={valueLiveMod} className={`form-control ${updatedFlagMod}`} disabled="" placeholder="mod_abbreviation" onChange={ (e) => { 
                      dispatch(changeFieldModAssociationReferenceJson(e));
                      if (e.target.value !== accessLevel) {
                        dispatch(changeFieldModAssociationReferenceJson({target: {id: 'mod_corpus_associations ' + index + ' corpus', value: 'needs_review' }}));
                        dispatch(changeFieldModAssociationReferenceJson({target: {id: 'mod_corpus_associations ' + index + ' mod_corpus_sort_source', value: 'assigned_for_review' }})); }
                      } } >
                      {"mods" in enumDict && enumDict["mods"].map((optionValue, index) => (
                        <option key={`${fieldName} ${index} corpus ${optionValue}`}>{optionValue}</option>
                      ))}
                    </Form.Control>
                  </Col>
	        ) : (
	          <Col sm="2">
	            <Form.Control
	              as="input"
	              id={`${fieldName} ${index} mod_abbreviation`}
	              type={fieldName}
	              value={valueLiveMod}
	              className="form-control"
	              disabled="disabled"
	            />
	          </Col>
                )}
                <Col sm={otherColSize}>
                  <Form.Control as="select" id={`${fieldName} ${index} corpus`} type="{fieldName}" value={valueLiveCorpus} className={`form-control ${updatedFlagCorpus}`} disabled={(valueLiveMod !== accessLevel) ? 'disable' : ''} placeholder="corpus" onChange={ (e) => {
                    dispatch(changeFieldModAssociationReferenceJson(e));
                    if ( (e.target.value === 'inside_corpus') || (e.target.value === 'outside_corpus') ) {
                      dispatch(changeFieldModAssociationReferenceJson({target: {id: 'mod_corpus_associations ' + index + ' mod_corpus_sort_source', value: 'manual_creation' }})); }
                    } } >
                    {"modAssociationCorpus" in enumDict && enumDict["modAssociationCorpus"].map((optionValue, index) => (
                      <option key={`${fieldName} ${index} corpus ${optionValue}`}>{optionValue}</option>
                    ))}
                  </Form.Control>
                </Col>
	        <ColEditorSelect
	          key={`colElement ${fieldName} ${index} mod_corpus_sort_source`}
	          fieldType="select"
	          fieldName={fieldName}
	          colSize={otherColSizeB}
	          value={valueLiveSource}
	          updatedFlag={updatedFlagSource}
	          placeholder="mod_corpus_sort_source"
	          disabled={(valueLiveMod !== accessLevel) ? 'disable' : ''}
	          fieldKey={`${fieldName} ${index} mod_corpus_sort_source`}
	          enumType="modAssociationSource"
	          dispatchAction={changeFieldModAssociationReferenceJson}
	        />
	        {buttonsElement}
	      </Form.Group>
	    ); 
	  }
      }
  }

  if (disabled === '') {
    rowModAssociationElements.push(
      <Row className="form-group row" key={fieldName} >
        <Col className="Col-general form-label col-form-label" sm="2" >
	  {fieldName}
	</Col>
        <Col sm="10" >
          <div
	    id={fieldName}
	    className="form-control biblio-button"
	    onClick={(e) => dispatch(biblioAddNewRowDict(e, initializeDict))}
	  >
            add {fieldName}
          </div>
        </Col>
      </Row>
    );
  }
    
  return (<>{rowModAssociationElements}</>);
}


const RowEditorCrossReferences = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb}) => {
  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
//   const revertDictFields = 'curie prefix, curie id, is_obsolete'
  const initializeDict = {'curie': '', 'url': null, 'is_obsolete': false, 'cross_reference_id': 'new'}
  let disabled = ''
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }
  const rowCrossReferencesElements = []

  const xrefPatterns = useSelector(state => state.biblio.xrefPatterns);
  function validateXref(datatype, xrefPatterns, prefix, value) {
    if ( (prefix === '') || (value === '') ) { return; }
    if (prefix in xrefPatterns[datatype]) {
      const pattern = xrefPatterns[datatype][prefix];
      const curie = prefix + ':' + value;
      var re = new RegExp(pattern);
      if (re.test(curie) === false) {
        dispatch(setBiblioEditorModalText('Fail to match xref pattern for ' + curie + ' check your entry and try again.'));
      }
    } else {
      console.log('xref prefix ' + prefix + ' not allowed');
    }
  }

  if ('cross_references' in referenceJsonLive && referenceJsonLive['cross_references'] !== null) {
    for (const[index, crossRefDict] of referenceJsonLive['cross_references'].entries()) {
      let otherColSize = 6;
//       let buttonsElement = (<Col sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" value={revertDictFields} onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
      let buttonsElement = (<Col className="Col-editor-buttons" sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
      if ('cross_reference_id' in crossRefDict && crossRefDict['cross_reference_id'] !== 'new') {
        buttonsElement = (<Col className="Col-editor-buttons" sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}<Button id={`delete ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(deleteFieldCrossReferencesReferenceJson(e))} ><FontAwesomeIcon icon={faTrashAlt} /></Button>{' '}</Col>); }
      if (disabled === 'disabled') { buttonsElement = (<></>); otherColSize = 7; }

      let valueLiveCurie = crossRefDict['curie']; let valueDbCurie = '';
      let updatedFlagCuriePrefix = ''; let updatedFlagCurieId = '';
      let [valueLiveCuriePrefix, valueLiveCurieId] = splitCurie(valueLiveCurie);
      let valueLiveIsObsolete = crossRefDict['is_obsolete']; let valueDbIsObsolete = ''; let updatedFlagIsObsolete = '';

      const crossRefDeleted = (('deleteMe' in crossRefDict) && (crossRefDict['deleteMe'] === true)) ? true : false;

      if ( (typeof referenceJsonDb[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonDb[fieldName][index]['curie'] !== 'undefined') ) {
             valueDbCurie = referenceJsonDb[fieldName][index]['curie'] }
      if ( (typeof referenceJsonDb[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonDb[fieldName][index]['is_obsolete'] !== 'undefined') ) {
             valueDbIsObsolete = referenceJsonDb[fieldName][index]['is_obsolete'] }
      let [valueDbCuriePrefix, valueDbCurieId] = splitCurie(valueDbCurie);
      if (valueLiveCuriePrefix !== valueDbCuriePrefix) { updatedFlagCuriePrefix = 'updated'; }
      if (valueLiveCurieId !== valueDbCurieId) { updatedFlagCurieId = 'updated'; }
      if (valueLiveIsObsolete !== valueDbIsObsolete) { updatedFlagIsObsolete = 'updated'; }

      let obsoleteChecked = '';
      if ( (typeof referenceJsonLive[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonLive[fieldName][index]['is_obsolete'] !== 'undefined') ) {
             if (referenceJsonLive[fieldName][index]['is_obsolete'] === true) { obsoleteChecked = 'checked'; }
             else { obsoleteChecked = ''; } }

      if (crossRefDeleted) {
        rowCrossReferencesElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >{fieldName} </Col>
            <Col className="Col-general form-label col-form-label updated" sm={2 + otherColSize + 1} ><span style={{color: 'red'}}>Deleted</span>&nbsp; {valueLiveCuriePrefix}:{valueLiveCurieId} {(obsoleteChecked === 'checked') ? 'obsolete' : ''}</Col>
            {buttonsElement}
          </Form.Group>); }
      else {
        rowCrossReferencesElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >{fieldName} </Col>
            <Col sm="2">
              <Form.Control as="select" key={`colElement ${fieldName} ${index} curiePrefix`} id={`${fieldName} ${index} curie prefix`} type="{fieldName}" value={valueLiveCuriePrefix} className={`form-control ${updatedFlagCuriePrefix}`} disabled={disabled} placeholder="curie" onChange={(e) => { dispatch(changeFieldCrossReferencesReferenceJson(e)); validateXref('reference', xrefPatterns, e.target.value, valueLiveCurieId) } } >
                {'referenceXrefPrefix' in enumDict && enumDict['referenceXrefPrefix'].map((optionValue, index) => (
                  <option key={`${fieldName} ${index} curie prefix ${optionValue}`}>{optionValue}</option>
                ))}
              </Form.Control>
            </Col>
            <Col sm={otherColSize}>
              <Form.Control as="input" key={`colElement ${fieldName} ${index} curieId`} id={`${fieldName} ${index} curie id`}  type="{fieldName}" value={valueLiveCurieId} className={`form-control ${updatedFlagCurieId}`} disabled={disabled} placeholder="curie" onChange={(e) => dispatch(changeFieldCrossReferencesReferenceJson(e))} onBlur={ (e) => validateXref('reference', xrefPatterns, valueLiveCuriePrefix, valueLiveCurieId) } />
            </Col>
            <ColEditorCheckbox key={`colElement ${fieldName} ${index} is_obsolete`} colSize="1" label="obsolete" updatedFlag={updatedFlagIsObsolete} disabled={disabled} fieldKey={`${fieldName} ${index} is_obsolete`} checked={obsoleteChecked} dispatchAction={changeFieldCrossReferencesReferenceJson} />
            {buttonsElement}
          </Form.Group>); } } }
  if (disabled === '') {
    rowCrossReferencesElements.push(
      <Row className="form-group row" key={fieldName} >
        <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
        <Col sm="10" ><div id={fieldName} className="form-control biblio-button" onClick={(e) => dispatch(biblioAddNewRowDict(e, initializeDict))} >add {fieldName}</div></Col>
      </Row>);
  }
  return (<>{rowCrossReferencesElements}</>); }


const RowEditorReferenceRelations = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb}) => {
  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
//   const revertDictFields = 'curie prefix, curie id, is_obsolete'
  const initializeDict = {'curie': '', 'type': '', 'reference_relation_id': 'new'}
  let disabled = ''
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }
  const rowReferenceRelationsElements = []
  if (fieldName in referenceJsonLive && referenceJsonLive[fieldName] !== null) {
    for (const[index, comcorDict] of referenceJsonLive[fieldName].entries()) {
      let otherColSize = 6;
      let revertElement = (<Col sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertFieldArray(e))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
      if (disabled === 'disabled') { revertElement = (<></>); otherColSize = 7; }
      let valueLiveCurie = comcorDict['curie']; let valueDbCurie = ''; let updatedFlagCurie = '';
      // const url = '/Biblio/?action=display&referenceCurie=' + valueLiveCurie
      let valueLiveType = comcorDict['type']; let valueDbType = ''; let updatedFlagType = '';
      if ( (typeof referenceJsonDb[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonDb[fieldName][index]['curie'] !== 'undefined') ) {
             valueDbCurie = referenceJsonDb[fieldName][index]['curie'] }
      if ( (typeof referenceJsonDb[fieldName][index] !== 'undefined') &&
           (typeof referenceJsonDb[fieldName][index]['type'] !== 'undefined') ) {
             valueDbType = referenceJsonDb[fieldName][index]['type'] }
      if (valueLiveCurie !== valueDbCurie) { updatedFlagCurie = 'updated'; }
      if (valueLiveType !== valueDbType) { updatedFlagType = 'updated'; }
      rowReferenceRelationsElements.push(
        <Form.Group as={Row} key={`${fieldName} ${index}`}>
          <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
          <ColEditorSelect key={`colElement ${fieldName} ${index} comcorType`} fieldType="select" fieldName={fieldName} colSize="3" value={valueLiveType} updatedFlag={updatedFlagType} placeholder="curie" disabled={disabled} fieldKey={`${fieldName} ${index} type`} enumType="referenceComcorType" dispatchAction={changeFieldReferenceRelationsJson} />
          <ColEditorSimple key={`colElement ${fieldName} ${index} curieId`} fieldType="input" fieldName={fieldName} colSize={otherColSize} value={valueLiveCurie} updatedFlag={updatedFlagCurie} placeholder="curie" disabled={disabled} fieldKey={`${fieldName} ${index} curie`} dispatchAction={changeFieldReferenceRelationsJson} />
          {revertElement}
        </Form.Group>); } }
  if (disabled === '') {
    rowReferenceRelationsElements.push(
      <Row className="form-group row" key={fieldName} >
        <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
        <Col sm="10" ><div id={fieldName} className="form-control biblio-button" onClick={(e) => dispatch(biblioAddNewRowDict(e, initializeDict))} >add {fieldName}</div></Col>
      </Row>);
  }
  return (<>{rowReferenceRelationsElements}</>); }

const RowEditorAuthors = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb}) => {
  // author editing is complicated.  There's the author order of the array in the browser dom.  The author order of the array in the redux store.  The order field in the author store entry (should be 1 more than the order in the dom).  The author_id field in the author store entry, used for comparing what was in the db.  The copy of author values in the store that reflect the db value (with its array order, order field, and author_id field).
  const dispatch = useDispatch();
  const hasPmid = useSelector(state => state.biblio.hasPmid);
  const authorExpand = useSelector(state => state.biblio.authorExpand);
//   const revertDictFields = 'order, name, first_name, last_name, orcid, first_author, corresponding_author, affiliations'
  const updatableFields = ['order', 'name', 'first_name', 'last_name', 'orcid', 'first_author', 'corresponding_author', 'affiliations']
  let authorOrder = 1;
  if ('authors' in referenceJsonLive && referenceJsonLive['authors'] !== null) { authorOrder = referenceJsonLive['authors'].length + 1; }
  const initializeDict = {'order': authorOrder, 'name': '', 'first_name': '', 'last_name': '', orcid: null, first_author: false, corresponding_author: false, affiliations: [], 'author_id': 'new'}
  let disabled = ''
  if (hasPmid && (fieldsPubmed.includes(fieldName))) { disabled = 'disabled'; }
  if (fieldsDisplayOnly.includes(fieldName)) { disabled = 'disabled'; }

  function getStoreAuthorIndexFromDomIndex(indexDomAuthorInfo, newAuthorInfoChange) {
    let indexAuthorInfo = newAuthorInfoChange[indexDomAuthorInfo]['order']        // replace placeholder with index from store order value matches dom
    for (let authorReorderIndexDictIndex in newAuthorInfoChange) {
      if (newAuthorInfoChange[authorReorderIndexDictIndex]['order'] - 1 === indexDomAuthorInfo) {
        indexAuthorInfo = authorReorderIndexDictIndex
        break } }
    return indexAuthorInfo }

  const rowAuthorsElements = []
  rowAuthorsElements.push(<AuthorExpandToggler key="authorExpandTogglerComponent" displayOrEditor="editor" />);
  const orderedAuthors = [];
  if ('authors' in referenceJsonLive && referenceJsonLive['authors'] !== null) {
    for (const value  of referenceJsonLive['authors'].values()) {
      let index = value['order'] - 1;
      if (index < 0) { index = 0 }	// temporary fix for fake authors have an 'order' field value of 0
      orderedAuthors[index] = value; }
//     for (const[index, authorDict] of referenceJsonLive['authors'].entries()) { }

    if (authorExpand === 'first') {
      if ((orderedAuthors.length > 0) && (typeof orderedAuthors[0] !== 'undefined') && ('name' in orderedAuthors[0])) {
        rowAuthorsElements.push(
          <Row key="author first" className="Row-general" xs={2} md={4} lg={6}>
            <Col className="Col-general ">first author</Col>
            <Col className="Col-general Col-editor-disabled" lg={{ span: 10 }}>
              <div><span dangerouslySetInnerHTML={{__html: orderedAuthors[0]['name']}} /></div></Col>
          </Row>); } }

    else if (authorExpand === 'list') {
      let authorNames = orderedAuthors.map((dict, index) => ( dict['name'] )).join('; ');
      rowAuthorsElements.push(
        <Row key="author list" className="Row-general" xs={2} md={4} lg={6}>
          <Col className="Col-general ">all authors</Col>
          <Col className="Col-general Col-editor-disabled" lg={{ span: 10 }}>
            <div><span dangerouslySetInnerHTML={{__html: authorNames}} /></div></Col>
        </Row>); }

    else if (authorExpand === 'detailed') {
      for (const[index, authorDict] of orderedAuthors.entries()) {
        if (typeof authorDict === 'undefined') { continue; }
        let rowEvenness = (index % 2 === 0) ? 'row-even' : 'row-odd'
        let affiliationsLength = 0
        if ('affiliations' in authorDict && authorDict['affiliations'] !== null) {
          affiliationsLength = authorDict['affiliations'].length }

//         let otherColSizeName = 7; let otherColSizeNames = 4; let otherColSizeOrcid = 2; let otherColSizeAffiliation = 9;
        let otherColSizeName = 7; let otherColSizeNames = 5; let otherColSizeAffiliation = 10;
//         let revertElement = (<Col sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" value={revertDictFields} onClick={(e) => dispatch(biblioRevertAuthorArray(e, initializeDict))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
        let revertElement = (<Col sm="1"><Button id={`revert ${fieldName} ${index}`} variant="outline-secondary" onClick={(e) => dispatch(biblioRevertAuthorArray(e, initializeDict))} ><FontAwesomeIcon icon={faUndo} /></Button>{' '}</Col>);
        // if (disabled === 'disabled') { revertElement = (<></>); otherColSizeName = 8; otherColSizeNames = 5; otherColSizeOrcid = 3; otherColSizeAffiliation = 10; }
        let disabledName = disabled
        // if first or last name, make name be concatenation of both and disable editing name
        if ( ( (authorDict['first_name'] !== null) && (authorDict['first_name'] !== '') ) ||
             ( (authorDict['last_name'] !== null) && (authorDict['last_name'] !== '') ) ) {
          disabledName = 'disabled'
          if ( ( (authorDict['first_name'] !== null) && (authorDict['first_name'] !== '') ) &&
               ( (authorDict['last_name'] !== null) && (authorDict['last_name'] !== '') ) ) {
            authorDict['name'] = authorDict['first_name'] + ' ' + authorDict['last_name'] }
          else if ( (authorDict['first_name'] !== null) && (authorDict['first_name'] !== '') ) {
            authorDict['name'] = authorDict['first_name'] }
          else if ( (authorDict['last_name'] !== null) && (authorDict['last_name'] !== '') ) {
            authorDict['name'] = authorDict['last_name'] } }

        let orcidValue = ''
        if ('orcid' in authorDict && authorDict['orcid'] !== null) {
          const orcidId = splitCurie(authorDict['orcid'], 'id');
          orcidValue = (orcidId) ? orcidId : authorDict['orcid']; }
        // if author orcid has object instead of string
        // if ('orcid' in authorDict && authorDict['orcid'] !== null && 'curie' in authorDict['orcid'] && authorDict['orcid']['curie'] !== null) {
        //   const orcidId = splitCurie(authorDict['orcid']['curie'], 'id');
        //   orcidValue = (orcidId) ? orcidId : authorDict['orcid']['curie']; }

        // map author dom index to live store index to author id to db store index, to compare live values to store values
        let indexStoreAuthorLive = getStoreAuthorIndexFromDomIndex(index, referenceJsonLive[fieldName])
        let authorId = referenceJsonLive[fieldName][indexStoreAuthorLive]['author_id']
        let indexStoreAuthorDb = indexStoreAuthorLive
        for (const dbStoreIndex in referenceJsonDb[fieldName]) {
          if (referenceJsonDb[fieldName][dbStoreIndex]['author_id'] === authorId) {
            indexStoreAuthorDb = dbStoreIndex } }

        let updatedDict = {}
        for (const updatableField of updatableFields.values()) {
          if (updatableField === 'affiliations') {
            updatedDict[updatableField] = []
            for (let i = 0; i < affiliationsLength; i++) {
              let valueDb = ''; let updatedFlag = ''; let valueLive = authorDict[updatableField][i];
              if ( (typeof referenceJsonDb[fieldName][indexStoreAuthorDb] !== 'undefined') &&
                   (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== 'undefined') &&
                   (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField][i] !== 'undefined') ) {
                     valueDb = referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField][i] }
              if (valueLive !== valueDb) { updatedFlag = 'updated'; }
              updatedDict[updatableField][i] = updatedFlag } }
          else {
            let valueDb = ''; let updatedFlag = ''; let valueLive = authorDict[updatableField];
            if (updatableField === 'orcid') {
              valueLive = orcidValue;
              // if author orcid has object instead of string
              // if ( (typeof referenceJsonDb[fieldName][indexStoreAuthorDb] !== 'undefined') &&
              //      (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== 'undefined') &&
              //      (referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== null) &&
              //      (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField]['curie'] !== 'undefined') ) {
              //        valueDb = splitCurie(referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField]['curie'], 'id'); }
              if ( (typeof referenceJsonDb[fieldName][indexStoreAuthorDb] !== 'undefined') &&
                   (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== 'undefined') &&
                   (referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== null) &&
                   (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== 'undefined') ) {
                     valueDb = splitCurie(referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField], 'id'); } }
            else {
              if ( (typeof referenceJsonDb[fieldName][indexStoreAuthorDb] !== 'undefined') &&
                   (typeof referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] !== 'undefined') ) {
                     valueDb = referenceJsonDb[fieldName][indexStoreAuthorDb][updatableField] } }
            if (valueLive !== valueDb) { updatedFlag = 'updated'; }
            updatedDict[updatableField] = updatedFlag } }

        let firstAuthorChecked = '';
        if ( (typeof referenceJsonLive[fieldName][indexStoreAuthorDb] !== 'undefined') &&
             (typeof referenceJsonLive[fieldName][indexStoreAuthorDb]['first_author'] !== 'undefined') ) {
               if (referenceJsonLive[fieldName][indexStoreAuthorDb]['first_author'] === true) { firstAuthorChecked = 'checked'; }
               else { firstAuthorChecked = ''; } }
        let correspondingChecked = '';
        if ( (typeof referenceJsonLive[fieldName][indexStoreAuthorDb] !== 'undefined') &&
             (typeof referenceJsonLive[fieldName][indexStoreAuthorDb]['corresponding_author'] !== 'undefined') ) {
               if (referenceJsonLive[fieldName][indexStoreAuthorDb]['corresponding_author'] === true) { correspondingChecked = 'checked'; }
               else { correspondingChecked = ''; } }

        rowAuthorsElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index} name`} className={`${rowEvenness}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >{fieldName} {index + 1}</Col>
            <ColEditorSimple key={`colElement ${fieldName} ${index} name`} fieldType="input" fieldName={fieldName} colSize={otherColSizeName} value={authorDict['name']} updatedFlag={updatedDict['name']} placeholder="name" disabled={disabledName} fieldKey={`${fieldName} ${index} name`} dispatchAction={changeFieldAuthorsReferenceJson} />
            <Col className="Col-general form-label col-form-label" sm="1" >order </Col>
            <ColEditorSelectNumeric key={`colElement ${fieldName} ${index} order`} fieldType="select" fieldName={fieldName} colSize="1" value={authorDict['order']} updatedFlag={updatedDict['order']} placeholder="order" disabled={disabled} fieldKey={`${fieldName} ${index} order`} minNumber="1" maxNumber={`${referenceJsonLive['authors'].length}`} dispatchAction={changeFieldAuthorsReferenceJson} />
            {revertElement}
          </Form.Group>);
//             <ColEditorSelect key={`colElement ${fieldName} ${index} source`} fieldType="select" fieldName={fieldName} colSize="4" value={valueLiveSource} updatedFlag={updatedFlagSource} placeholder="source" disabled={disabled} fieldKey={`${fieldName} ${index} source`} enumType="mods" dispatchAction={changeFieldModReferenceReferenceJson} />
//             <ColEditorSimple key={`colElement ${fieldName} ${index} order`} fieldType="input" fieldName={fieldName} colSize="1" value={authorDict['order']} updatedFlag={updatedDict['order']} placeholder="order" disabled={disabled} fieldKey={`${fieldName} ${index} order`} dispatchAction={changeFieldAuthorsReferenceJson} />
        rowAuthorsElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index} first last`} className={`${rowEvenness}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >first last </Col>
            <ColEditorSimple key={`colElement ${fieldName} ${index} first_name`} fieldType="input" fieldName={fieldName} colSize="5" value={authorDict['first_name']} updatedFlag={updatedDict['first_name']} placeholder="first name" disabled={disabled} fieldKey={`${fieldName} ${index} first_name`} dispatchAction={changeFieldAuthorsReferenceJson} />
            <ColEditorSimple key={`colElement ${fieldName} ${index} last_name`} fieldType="input" fieldName={fieldName} colSize={otherColSizeNames} value={authorDict['last_name']} updatedFlag={updatedDict['last_name']} placeholder="last name" disabled={disabled} fieldKey={`${fieldName} ${index} last_name`} dispatchAction={changeFieldAuthorsReferenceJson} />
          </Form.Group>);

        rowAuthorsElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index} role`} className={`${rowEvenness}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >role </Col>
            <Col sm="1" > </Col>
            <ColEditorCheckbox key={`colElement ${fieldName} ${index} corresponding_author`} colSize="2" label="corresponding" updatedFlag={updatedDict['corresponding_author']} disabled="" fieldKey={`${fieldName} ${index} corresponding_author`} checked={correspondingChecked} dispatchAction={changeFieldAuthorsReferenceJson} />
            <ColEditorCheckbox key={`colElement ${fieldName} ${index} first_author`} colSize="7" label="first author" updatedFlag={updatedDict['first_author']} disabled="" fieldKey={`${fieldName} ${index} first_author`} checked={firstAuthorChecked} dispatchAction={changeFieldAuthorsReferenceJson} />
          </Form.Group>);
        rowAuthorsElements.push(
          <Form.Group as={Row} key={`${fieldName} ${index} orcid`} className={`${rowEvenness}`}>
            <Col className="Col-general form-label col-form-label" sm="2" >person identifier </Col>
            <ColEditorSelect key={`colElement ${fieldName} ${index} orcidPrefix`} fieldType="select" fieldName={fieldName} colSize="2" value="ORCID" updatedFlag="" placeholder="curie" disabled="disabled" fieldKey={`${fieldName} ${index} orcid prefix`} enumType="personXrefPrefix" dispatchAction="" />
            <ColEditorSimple key={`colElement ${fieldName} ${index} orcid`} fieldType="input" fieldName={fieldName} colSize="8"  value={orcidValue} updatedFlag={updatedDict['orcid']} placeholder="orcid" disabled={disabled} fieldKey={`${fieldName} ${index} orcid`} dispatchAction={changeFieldAuthorsReferenceJson} />
          </Form.Group>);

        if ('affiliations' in authorDict && authorDict['affiliations'] !== null && authorDict['affiliations'].length > 0) {
          for (const[indexAff, affiliationsValue] of authorDict['affiliations'].entries()) {
            rowAuthorsElements.push(
              <Form.Group as={Row} key={`${fieldName} ${index} affiliations ${indexAff}`} className={`${rowEvenness}`}>
                <Col className="Col-general form-label col-form-label" sm="2" >affiliations {index + 1} {indexAff + 1}</Col>
                <ColEditorSimple key={`colElement ${fieldName} ${index} affiliations ${indexAff}`} fieldType="input" fieldName={fieldName} colSize={otherColSizeAffiliation}  value={affiliationsValue} updatedFlag={updatedDict['affiliations'][indexAff]} placeholder="affiliations" disabled={disabled} fieldKey={`${fieldName} ${index} affiliations ${indexAff}`} dispatchAction={changeFieldAuthorsReferenceJson} />
              </Form.Group>);
        } }
        if (disabled === '') {
          rowAuthorsElements.push(
            <Row key={`${fieldName} ${index} affiliations`} className={`form-group row ${rowEvenness}`} >
              <Col className="Col-general form-label col-form-label" sm="2" >auth {index + 1} add affiliations</Col>
              <Col sm="10" ><div id={`${fieldName} ${index} affiliations`} className="form-control biblio-button" onClick={(e) => dispatch(biblioAddNewAuthorAffiliation(e))} >add affiliations</div></Col>
            </Row>);
        }
    } } // else if (authorExpand === 'detailed')
  } // if ('authors' in referenceJsonLive && referenceJsonLive['authors'] !== null)
  if (disabled === '' && authorExpand === 'detailed') {
    let rowEvennessLast = (orderedAuthors.length % 2 === 0) ? 'row-even' : 'row-odd'
    rowAuthorsElements.push(
      <Row key={fieldName} className={`form-group row ${rowEvennessLast}`} >
        <Col className="Col-general form-label col-form-label" sm="2" >{fieldName}</Col>
        <Col sm="10" ><div id={fieldName} className="form-control biblio-button" onClick={(e) => dispatch(biblioAddNewRowDict(e, initializeDict))} >add {fieldName}</div></Col>
      </Row>);
  }
  return (<>{rowAuthorsElements}</>);
} // const RowEditorAuthors = ({fieldIndex, fieldName, referenceJsonLive, referenceJsonDb})

const BiblioEditor = () => {
  const dispatch = useDispatch();
  const referenceJsonLive = useSelector(state => state.biblio.referenceJsonLive);
  const referenceJsonDb = useSelector(state => state.biblio.referenceJsonDb);
  const biblioEditorModalText = useSelector(state => state.biblio.biblioEditorModalText);
  const xrefPatterns = useSelector(state => state.biblio.xrefPatterns);
  useEffect(() => {
    if (Object.keys(xrefPatterns).length === 0) {
      const fetchXrefPattern = async () => { dispatch(getXrefPatterns('reference')); }
      fetchXrefPattern().catch(console.error);
    }
  }, [xrefPatterns]);
  if (!('date_created' in referenceJsonLive)) {
    let message = 'No AGR Reference Curie found';
    if ('detail' in referenceJsonLive) { message = referenceJsonLive['detail']; }
    return(<>{message}</>); }
  const rowOrderedElements = []
  for (const [fieldIndex, fieldName] of fieldsOrdered.entries()) {
    if (fieldName === 'DIVIDER') {
        rowOrderedElements.push(<RowDivider key={fieldIndex} />); }
    else if (fieldsSimple.includes(fieldName)) {
        rowOrderedElements.push(<RowEditorString key={fieldName} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldsArrayString.includes(fieldName)) {
      rowOrderedElements.push(<RowEditorArrayString key={`RowEditorArrayString ${fieldName}`} fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldsBooleanDisplayOnly.includes(fieldName)) {
      rowOrderedElements.push(<RowDisplayBooleanDisplayOnly key={`RowDisplayBooleanDisplayOnly ${fieldName}`} fieldName={fieldName} referenceJsonLive={referenceJsonLive} displayOrEditor="editor" />); }
    else if (fieldName === 'mod_corpus_associations') {
      rowOrderedElements.push(<RowEditorModAssociation key={`RowEditorModAssociation ${fieldName}`} fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldName === 'cross_references') {
      rowOrderedElements.push(<RowEditorCrossReferences key={`RowEditorCrossReferences ${fieldName}`} fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldName === 'relations') {
      rowOrderedElements.push(<RowEditorReferenceRelations key={`RowEditorReferenceRelations ${fieldName}`} fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldName === 'mod_reference_types') {
      rowOrderedElements.push(<RowEditorModReferenceTypes key="RowEditorModReferenceTypes" fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldName === 'mesh_terms') {
      rowOrderedElements.push(<RowDisplayMeshTerms key="RowDisplayMeshTerms" fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} displayOrEditor="editor" />); }
    else if (fieldName === 'authors') {
      rowOrderedElements.push(<RowEditorAuthors key="RowEditorAuthors" fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldName === 'date_published') {
      rowOrderedElements.push(<RowEditorDatePublished key="RowEditorDatePublished" fieldName={fieldName} referenceJsonLive={referenceJsonLive} referenceJsonDb={referenceJsonDb} />); }
    else if (fieldName === 'pubmed_publication_status') {
      rowOrderedElements.push(<RowDisplayPubmedPublicationStatusDateArrivedInPubmed key="RowDisplayPubmedPublicationStatusDateArrivedInPubmed" referenceJsonLive={referenceJsonLive} displayOrEditor="editor" />); }
    else if (fieldName === 'date_last_modified_in_pubmed') {
      rowOrderedElements.push(<RowDisplayDateLastModifiedInPubmedDateCreated key="RowDisplayDateLastModifiedInPubmedDateCreated" referenceJsonLive={referenceJsonLive} displayOrEditor="editor" />); }
    else if (fieldName === 'copyright_license_name') {
      rowOrderedElements.push(<RowDisplayCopyrightLicense key="RowDisplayCopyrightLicense" fieldIndex={fieldIndex} fieldName={fieldName} referenceJsonLive={referenceJsonLive} displayOrEditor="editor" />); }
    else if (fieldName === 'referencefiles') {
      rowOrderedElements.push(<RowDisplayReferencefiles key="referencefile" fieldName={fieldName} referenceJsonLive={referenceJsonLive} displayOrEditor="editor" />); }
  } // for (const [fieldIndex, fieldName] of fieldsOrdered.entries())

  return (<Container>
            <ModalGeneric showGenericModal={biblioEditorModalText !== '' ? true : false} genericModalHeader="Biblio Editor Error" 
                          genericModalBody={biblioEditorModalText} onHideAction={setBiblioEditorModalText('')} />
            <Form><BiblioSubmitUpdateRouter />{rowOrderedElements}</Form>
          </Container>);
} // const BiblioEditor


export const AuthorExpandToggler = ({displayOrEditor}) => {
  const dispatch = useDispatch();
  const authorExpand = useSelector(state => state.biblio.authorExpand);
  let cssDisplayLeft = 'Col-display Col-display-left';
  let cssDisplayRight = 'Col-display Col-display-right';
  if (displayOrEditor === 'editor') {
    cssDisplayRight = 'Col-editor-disabled';
    cssDisplayLeft = ''; }
  let firstChecked = '';
  let listChecked = '';
  let detailedChecked = '';
  if (authorExpand === 'first') { firstChecked = 'checked'; }
    else if (authorExpand === 'list') { listChecked = 'checked'; }
    else { detailedChecked = 'checked'; }
  return (
    <Row key="authorExpandTogglerRow" className="Row-general" xs={2} md={4} lg={6}>
      <Col className={`Col-general ${cssDisplayLeft}  `}>authors</Col>
      <Col className={`Col-general ${cssDisplayRight} `} lg={{ span: 10 }}>
        <Form.Check
          inline
          checked={firstChecked}
          type='radio'
          label='first'
          id='biblio-author-expand-toggler-first'
          onChange={(e) => dispatch(changeBiblioAuthorExpandToggler(e))}
        />
        <Form.Check
          inline
          checked={listChecked}
          type='radio'
          label='list'
          id='biblio-author-expand-toggler-list'
          onChange={(e) => dispatch(changeBiblioAuthorExpandToggler(e))}
        />
        <Form.Check
          inline
          checked={detailedChecked}
          type='radio'
          label='detailed'
          id='biblio-author-expand-toggler-detailed'
          onChange={(e) => dispatch(changeBiblioAuthorExpandToggler(e))}
        />
      </Col>
    </Row>);
} // const AuthorExpandToggler


export default BiblioEditor
