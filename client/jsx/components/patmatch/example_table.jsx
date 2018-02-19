module.exports = {

	examples: function() {
		 
		var data = "<tr><th>Search type</th><th>Charcter</th><th>Meaning</th><Examples</th></tr>\n";
		data += "<tr><td rowspan=2>Peptide Searches</td><td>IFVLWMAGCYPTSHEDQNKR</td><td>Exact match</td><td>ELVIS</td></tr>\n";
		
                return "<table>" + data + "</table>";
		
	}
};
