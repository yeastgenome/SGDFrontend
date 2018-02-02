/**
 * author: fgondwe
 * date: 05/05/2017
 * purpose: manage events for custom tree component
 */
import * as URLS from "../lib/downloads_helper";
import Axios from "axios";
import * as action_types from "./action_types";
import _ from "underscore";

export const fetchDownloadResultsSuccess = results => {
  return {
    type: action_types.FETCH_DOWNLOADS_RESULTS_SUCCESS,
    payload: results
  };
};

export const fetchDownloadsMenuSuccess = results => {
  return {
    type: action_types.FETCH_DOWNLOADS_MENU,
    payload: results
  };
};

export function fetchDownloadsMenuData() {
  return dispatch => {
    return Axios.get(URLS.menuUrl)
      .then(response => {
        dispatch(fetchDownloadsMenuSuccess(response));
      })
      .catch(error => {
        throw error;
      });
  };
}

export const fetchDownloadResults = query => {
  return dispatch => {
    return Axios.get(URLS.resultsUrl)
      .then(response => {
        dispatch(
          fetchDownloadResultsSuccess({ datasets: response.data, query: query })
        );
      })
      .catch(error => {
        throw error;
      });
  };
};

export const getNode = node => {
  return {
    type: action_types.GET_SELECTED_NODE,
    payload: { node: node }
  };
};

export const getLeaf = (leafKey, list) => {
  return dispatch => {
    return dispatch(_.findWhere(list, { key: leafKey }));
  };
};

export const deleteLeaf = (leafKey, list) => {
  return dispatch => {
    return dispatch(_.without(list, _.findWhere(list, { key: leafKey })));
  };
};

export const deleteNode = (key, list) => {
  return dispatch => {
    return dispatch(_.without(list, _.findWhere(list, { key: key })));
  };
};

export const toggleNode = (flag, node) => {
  return {
    type: action_types.GET_SELECTED_NODE,
    payload: { flag: flag, node: node }
  };
};
