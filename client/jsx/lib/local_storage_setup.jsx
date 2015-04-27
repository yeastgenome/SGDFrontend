"use strict";

var CACHE_KEY = "cacheBustingToken";

module.exports = class LocalStorageSetup {
	// checks last cache invalidation string, and clears local storage if there's a mismatch
	checkCache (cacheBustingToken) {
		var lastCacheToken = localStorage.getItem(CACHE_KEY);
		if (lastCacheToken !== cacheBustingToken) {
			localStorage.clear();
			localStorage.setItem(CACHE_KEY, cacheBustingToken);
		}
	}
};
