/** @jsx React.DOM */

module.exports = {

	getParams: function() {

		var queryStr = location.search.substring(1);
                var paramDict = {};
                if (queryStr) {
                   var params = queryStr.split('&');
                   for (var i = 0; i < params.length; i++) {
                       var pair = params[i].split('=');
                       paramDict[pair[0]] = pair[1].replace(/\+/g, ' ');
                   }
                }
                return paramDict;
		
	}
};
