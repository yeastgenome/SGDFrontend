/**
 * author: fgondwe
 * date: 05/05/2017
 * purpose: exexute action events for custom tree component
 */

import React from "react";
import * as action_types from "../actions/action_types";
import _ from "underscore";
import S from "string";

const initialState = {
  downloadsMenu: [],
  downloadsResults: [],
  query: "",
  selectedLeaf: "",
  selectedNodes: [],
  selectedNode: "",
  openNodes: { nodes: [], leaf: "" },
  url: "",
  queryParams: "",
  tableColumns: [],
  nodeVisible: false
};

export default function(state = initialState, action) {
  if (
    action.type === "@@router/UPDATE_LOCATION" &&
    action.payload.pathname === "/downloads"
  ) {
    if (action.payload.search.length > 0) {
      let regexString = /(^\?([a-zA-Z]|)+\=([\w*\+\w*])+(\&([\w*]+)+\=([\w*\+\w*])+)+)|^\?([a-zA-Z]|)+\=([\w*\+\w*])+/g;
      let result =
        typeof action.payload.query === "object"
          ? action.payload.search.match(regexString)
          : "";
      if (result) {
        state.query = action.payload.query;
      }
    }
    return state;
  }
  switch (action.type) {
    case action_types.FETCH_DOWNLOADS_RESULTS_SUCCESS:
      return Object.assign({}, state, {
        downloadsResults: action.payload.datasets,
        selectedLeaf: action.payload.query.item
          ? S(action.payload.query.item).capitalize().s
          : S(action.payload.query)
      });
    case action_types.FETCH_DOWNLOADS_MENU:
      return Object.assign({}, state, {
        downloadsMenu: state.downloadsMenu.concat(action.payload.data)
      });
    case action_types.GET_SELECTED_NODE:
      return Object.assign({}, state, {
        selectedNode: action.payload.node
      });

    default:
      return state;
  }
}
