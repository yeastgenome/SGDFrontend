"use strict";
var $ = require("jquery");

var AUTOCOMPLETE_URL = "/backend/autocomplete_results"

var autocompleteQuery = "";
var query = "";
var onSetQuery = () => {};
var selectedCategories = []
var onSetCategories = () => {};

module.exports = class SearchStore {
  constructor (options) {
    options = options || {};
    if (options.query) query = options.query;
    if (typeof options.onSetQuery === "function") onSetQuery = options.onSetQuery;
  }

  setOnSetQuery (_onSetQuery) {
    onSetQuery = _onSetQuery;
  }

  setQuery (_query) {
    query = _query;
    if (typeof onSetQuery === "function") {
      onSetQuery(query);
    }
  }

  setOnSetCategories (_onSetCategories) {
    onSetCategories = _onSetCategories;
  }

  setSelectedCategories (_selectedCategories) {
    selectedCategories = _selectedCategories;
    if (typeof onSetCategories === "function") {
      onSetCategories(selectedCategories);
    }
  }

  setAutocompleteQuery (_autoQuery) {
    autocompleteQuery = _autoQuery;
  }

  getQuery () {
    return query;
  }


  // callback(err, results)
  fetchAutocompleteResults (callback) {
    var url = `${AUTOCOMPLETE_URL}?term=${autocompleteQuery}`
    $.getJSON(url, data => {
      return callback(null, data.results);
    });
  }
};
