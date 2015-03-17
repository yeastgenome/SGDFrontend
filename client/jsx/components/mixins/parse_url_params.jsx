/** @jsx React.DOM */

module.exports = {

	getParams: function() {

		var queryStr = location.search.substring(1);
                var paramDict = {};
                if (queryStr) {
                   var params = queryStr.split('&');
                   for (var i = 0; i < params.length; i++) {
                       var pair = params[i].split('=');
		       var key = pair[0];
		       var value = pair[1].replace(/\+/g, ' ');
		       if (paramDict[key]) {
		       	    paramDict[key] = paramDict[key] + ' ' + value;
		       }
		       else {
                       	    paramDict[key] = value;
		       }
                   }
                }
                return paramDict;
		
	}
};
