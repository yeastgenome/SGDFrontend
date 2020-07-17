
$(document).ready(function() {

	$.getJSON('/backend/allele/' + allele['sgdid']  + '/phenotype_details', function(data) {
	  	var phenotype_table = create_phenotype_table(data);
	  	// create_analyze_button("phenotype_table_analyze", phenotype_table, "<a href='" + allele['link'] + "' class='gene_name'>" + allele['display_name'] + "</a> Genes", true);
  	    create_download_button("phenotype_table_download", phenotype_table, allele['display_name'] + "_phenotype_annotations");
	});

        var references = allele['references'];
        var refs = create_reference_list(references);

        
});

function create_reference_list(references) {

    return "Hello world";
    
    // var itemNodes = _.map(references, (r, i) => {
    //  var _text = r.citation.replace(r.display_name, '');
    //  var refNodes = _.map(r.urls, (url, _i) => {
    //    return (
    //      <li key={'refListInner' + _i}>
    //        <a href={url.link}>{url.display_name}</a>
    //      </li>
    //    );
    //  });
    //  refNodes.unshift(
    //    <li key={'sgdNode' + i}>
    //      <a href={r.link}>SGD Paper</a>
    //    </li>
    //  );
    //  var pubmedNode = r.pubmed_id ? <small>PMID: {r.pubmed_id}</small> : null;
    //  return (
    //    <li className="reference-list-item" key={'refListOuter' + i}>
    //      <a href={r.link}>{r.display_name}</a> {_text} {pubmedNode}
    //      <ul className="ref-links">{refNodes}</ul>
    //    </li>
    //  );
    // });

    // return <ol className="reference-list" id='reference'>{itemNodes}</ol>;

}

function create_phenotype_table(data) {
  	var datatable = [];
	var phenotypes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		phenotypes[data[i]["phenotype"]["id"]] = true;
	}

    set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
    options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + allele['display_name']};
	options["aaData"] = datatable;

    return create_table("phenotype_table", options);
}


