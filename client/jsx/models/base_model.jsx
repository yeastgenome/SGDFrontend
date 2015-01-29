/** @jsx React.DOM */
"use strict";

var $ = require("jquery");

var LOCAL_STORAGE_TIMEOUT = 7200000; // 2 hours

/*
	Base model is an ES6 class that provides a backbone like utility for fetching data from an external API.
*/
module.exports = class BaseModel {

	constructor (options) {
		this.url = options.url;
	}

	/*
		Use $.getJSON to get JSON from this.url, then format the response with this.parse
	*/
	// callback(err, response)
	fetch (callback) {
		$.getJSON(this.url, data => {
			var _formattedData = this.parse(data);
			this.attributes = _formattedData;
			callback(null, _formattedData);
		});
	}

	// TEMP, needs variable storage key
	// NOT WORKING
	// callback(err, response)
	cacheOrFetch(callback) {
		var currentTime = (new Date()).getTime();
		// cache from local storage, otherwise normal fetch
		var storageKey = "/backend/alignments";
		var maybeCachedResponse = JSON.parse(localStorage.getItem(storageKey));
		// check time of contents and delete if too old
		if (maybeCachedResponse) {
			var time = maybeCachedResponse.time;
			var content = maybeCachedResponse.content;
			if (currentTime > time + LOCAL_STORAGE_TIMEOUT) {
				maybeCachedResponse = false;
			}
		}

		// cached data available, use
		if (maybeCachedResponse) {
			this.attributes = maybeCachedResponse;
			callback(null, maybeCachedResponse);
		// not in cache, fetch and set for next time
		} else {
			this.fetch( (err, resp) => {
				var _localStorePayload = {
					time: currentTime,
					content: resp
				};
				localStorage.setItem(storageKey, JSON.stringify(_localStorePayload));
				callback(err, resp);
			})
		}
	}

	/*
		Any transformations on the response should be overwritten in this method.
	*/
	parse (response) {
		return response;
	}
};
