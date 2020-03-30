import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require("../widgets/data_table.jsx");
const Params = require("../mixins/parse_url_params.jsx");
const RadioSelector = require("./radio_selector.jsx");
const Checklist = require("./checklist.jsx");

const style = {
      button: { fontSize: 18, background: 'none', border: 'none', color: '#7392b7' },
      textFont: { fontSize: 18 }
};

const GOtoolsUrl = "/run_gotools";
const GOslimUrl = "/backend/goslim";
const GeneChkUrl = "/backend/ambiguous_names";

const goSet = [ "Yeast GO-Slim: process",
      	        "Yeast GO-Slim: function",
	        "Yeast GO-Slim: component",
	        "Generic GO-Slim: process",
	        "Generic GO-Slim: function",
	        "Generic GO-Slim: component",
	        "Macromolecular complex terms: component" ];

const GoSlimMapper = React.createClass({

	getInitialState() {
	        
		var param = Params.getParams();		
		
		this.getSlimData();
		this.getAmbiguousNames();

		return {
			isComplete: false,
			isPending: false,
			userError: null,
			aspect: 'F',
			uploadedGenes: '',
			resultData: {},
			goslimData: [],
			ambiguousNames: {},
			slimType: '',
			notFound: null,
			param: param
		};
	},

	render() {	
	
		var page_to_display = this.getPage();
		
		return (<div>
			  <span style={{ textAlign: "center" }}><h1>Gene Ontology Slim Term Mapper <a target="_blank" href="https://sites.google.com/view/yeastgenome-help/analyze-help/go-slim-mapper?authuser=0"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			  <hr /></span>
			  {page_to_display}
			</div>);		 
	},

	componentDidMount() {
		var param = this.state.param;
	        if (param['submit']) {
	                this.runGoTools();
	        }				      
	},

	getPage() {
		
		var param = this.state.param;

	        if (this.state.isComplete) {

			var data = this.state.resultData;
			var output = data['output'];
			if (typeof(output) != "undefined") {
			     return (<div>
			     	     <h3>There is an issue for this search. Please take a look at the following message and try to fix your query and resubmit again.</h3>
			     	     <p dangerouslySetInnerHTML={{ __html: output }} />
			     	     </div>);
			}

			var resultTable = data['html'];
			var termsUrl = data['term_page'];
			var tabUrl = data['tab_page'];
			var tableUrl = data['table_page'];
			var geneInputUrl = data['gene_input_page'];
			var slimInputUrl = data['slim_input_page'];
			
			var resultText = this.getResultText();
			var tableSaveOptions = this.tableSaveOptions(tableUrl, termsUrl, tabUrl, geneInputUrl, slimInputUrl);
			tableSaveOptions = "<h2 id='table'><center>Search Results</center></h2>" + tableSaveOptions;

			return (<div>
			       <p dangerouslySetInnerHTML={{ __html: resultText }} />
			       <p dangerouslySetInnerHTML={{ __html: tableSaveOptions }} />
			       <p dangerouslySetInnerHTML={{ __html: resultTable }} />
			</div>);


		} 
		else if (this.state.isPending) {

		        return (<div>
			       <div className="row">
			       	    <p><b>Something wrong with your search!</b></p>
			       </div>
			</div>);
			
		}
		else {

		        if (param['submit']) {
			     return <p>Please wait while we retrieve the requested information.</p>; 
			}

			return this.getFrontPage();
			
		}
	},

	getFrontPage() {

		var descText = this.topDescription();		

		var submitReset = this.submitReset();
		var geneBox = this.getGeneBox();
		var termBox = this.getTermBox();
				 
		var _geneSection = { headers: [[<span style={ style.textFont }>Query Set (Your Input)</span>]],
                                     rows:    [[geneBox]] };
		var _goSection = { headers: [[<span style={ style.textFont }>Specify your Slim Terms</span>]],
                                     rows:    [[termBox]] };
		
		return (<div>
			<div dangerouslySetInnerHTML={{ __html: descText}} />
			<div className="row">
			     <div className="large-12 columns">
			     	  <form onSubmit={this.onSubmit} onReset={this.onReset} target="infowin">
				        <DataTable data={_geneSection} />
					<DataTable data={_goSection} />
					{ submitReset }
			          </form>
			     </div>
			</div>
		</div>);

	},

	submitReset() {

		return (<div>
		       <p><input type="submit" ref='submit' name='submit' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset' name='reset' value="Reset Form" className="button secondary"></input></p>
		       </div>);

	},

	getGeneBox() {

	        var genes = window.localStorage.getItem("geneList4slim");
                if (genes) {
		    return (<div style={{ textAlign: "top" }}>
			    <h3><strong style={{ color: 'red'}}>Your gene list has been saved in the memory. Please pick a GO Slim Set, refine the Slim Terms, and Submit the form.</strong></h3>
                            <h3>Enter Gene/ORF names (separated by a return or a space):</h3>
                            <textarea ref='genes' id='genes' onChange={this._onChange} name='genes' rows='3' cols='200'></textarea>
                            Note: If you have a big gene list (>100), save it as a file and upload it below.
                            <h3><strong style={{ color: 'red'}}>OR</strong> Upload a file of Gene/ORF names (.txt or .tab format):
                            <input className="btn btn-default btn-file" type="file" name='uploadFile' onChange={this.handleFile} accept="image/*;capture=camera"/></h3>
                    </div>);

		}
		else {
		     return (<div style={{ textAlign: "top" }}>
                            <h3>Enter Gene/ORF names (separated by a return or a space):</h3>
                            <textarea ref='genes' id='genes' onChange={this._onChange} name='genes' rows='3' cols='200'></textarea>
                            Note: If you have a big gene list (>100), save it as a file and upload it below.
                            <h3><strong style={{ color: 'red'}}>OR</strong> Upload a file of Gene/ORF names (.txt or .tab format):
                            <input className="btn btn-default btn-file" type="file" name='uploadFile' onChange={this.handleFile} accept="image/*;capture=camera"/></h3>
	            </div>);
		}

        },

	getTermBox() {
				
		var goSetNode = this.getGoSetNode();
		var goTermNode = this.getTermNode();

                return (<div style={{ textAlign: "top" }}>
       			{ goSetNode }
			{ goTermNode }
                        </div>);

        },
	
	handleFile(e) {
                var reader = new FileReader();
                var fileHandle = e.target.files[0];
                var fileName = e.target.files[0].name;
                reader.onload = function(upload) {
                      this.setState({
                            uploadedGenes: upload.target.result
                      });
              }.bind(this);
              reader.readAsText(fileHandle);
        },

	getGoSetNode() {
        
		var _elements = _.map(goSet, g => {
		      return <option value={g}>{g}</option>;
		});

		window.localStorage.setItem("slimType", goSet[0]);

                return(<div>
                       <h3>Choose a GO Set:</h3>
                       <p><select ref='slim_type' name='slim_type' onChange={this.onChange4slimtype}>{_elements}</select></p>
                </div>);
        },

	getTermNode(slimData) {
		      
		var slimData = this.state.goslimData;		
		
		var slimType = this.state.slimType;
		if (slimType == '') {
		      slimType = window.localStorage.getItem("slimType");
		}

                var terms = [];
		_.map(slimData, g => {
                    if (g.slim_type == slimType) {
		       terms = g.terms;
		    }				     
		});
		
		window.localStorage.setItem("all_terms", terms);

		if (terms.length > 0 && terms[0].includes("SELECT ALL Terms")) {
		   terms.shift(); 
		}

		terms.unshift("SELECT ALL Terms from "+slimType);
		var _elements = _.map(terms, t => {
		    return <option value={t}>{t}</option>;
		});

		return(<div>
                       <h3>Refine your list of GO Slim Terms:</h3>
                       Select or unselect multiple datasets by pressing the Control (PC) or Command (Mac) key while clicking. Selecting a category label selects all datasets in that category.
                       <p><select ref='terms' id='terms' onChange={this.onChange} size='5' multiple>{_elements}</select></p>
                </div>);

	},

	processGeneList(genes) {
	
	        if (genes == '') {
                     return '';
                }
                genes = genes.replace(/[^A-Za-z:\-0-9\(\)\,\_]/g, ' ');
                var re = /\+/g;
                genes = genes.replace(re, " ");
                var re = / +/g;
                genes = genes.replace(re, "|");

                return genes;

	},

	processTermList() {

	        var terms = document.getElementById('terms');

		var all_terms = [];
		for (var i = 0; i < terms.options.length; i++) {
                     if (terms.options[i].selected) {
		     	  var term = terms.options[i].value;      
			  if (term.includes("SELECT ALL Terms from")) {
			       var allTerms = window.localStorage.getItem("all_terms");
			       all_terms = allTerms.split(",");
			       break;
			  } 
			  else {
			       all_terms.push(term)
			  }
                     }
                }
		
		return all_terms.join("|");
		
	},

	onSubmit(e) {

		// window.localStorage.clear();

		var genes = this.refs.genes.value.trim();
		var genesInBox = 0;
		if (genes == '') {
		     genes = this.state.uploadedGenes;
		}
		else {
		     genesInBox = 1;
		}
                var fromTools = 0;
                if (genes == '') {
                    genes = window.localStorage.getItem("geneList4slim");
                    window.localStorage.setItem("geneList4slim", '');
                    fromTools = 1;
                }	    
		genes = this.processGeneList(genes);
                if (genes == '') {
                     alert("Please enter one or more gene names.");
                     e.preventDefault();
                     return 1;
                }
		
		var all_genes = genes.split("|");
				
		if (genesInBox == 1 && all_genes.length > 100) {
		     alert("You have entered more than 100 genes. Please save it as a file and upload it.");
                     e.preventDefault();
                     return 1;
		}

		// check for ambiguous genes
		var ambiguousGeneDict = this.state.ambiguousNames;
	        if (fromTools == 0) {
		   for (var i = 0; i < all_genes.length; i++) {
		     var gene = all_genes[i];
		     if (gene in ambiguousGeneDict) {
		     	   var ambiguousGeneObj = ambiguousGeneDict[gene];
			   var warningMsg = "The name '" + gene + "' is associated with multiple genes. " + gene + " is ";
			   for (var j = 0; j < ambiguousGeneObj.length; j++) {
			         var geneObj = ambiguousGeneObj[j];
				 var display_name = geneObj['systematic_name'] + " (SGDID: " + geneObj['sgdid'] + ")";
				 if (geneObj['gene_name']) {
				      display_name = geneObj['gene_name'] + "/" + display_name;
				 }
				 if (j > 0) {
                                     warningMsg = warningMsg + " and ";
                                 }
				 if (geneObj['name_type'] == 'alias_name') {
				     warningMsg = warningMsg + "an alias name for " + display_name;
				 }
				 else {
				     warningMsg = warningMsg + "the standard gene name for " + display_name;
				 }
			   }
			   alert(warningMsg + ". Please modify your input list by replacing the entry '" + gene + "' with either the systematic ORF name or SGDID for the intended gene.");
			   e.preventDefault();
                     	   return 1;
		     }
                   }
		}				

		window.localStorage.setItem("genes", genes);

                // var terms = [];
                // _.map(slimData, g => {
                //    if (g.slim_type == slimType) {
                //       terms = g.terms;
                //    }
                // });

		var terms = this.processTermList();

                if (terms == '') {
                     alert("Please select one or more GO Slim terms.");
                     e.preventDefault();
                     return 1;
                }

		window.localStorage.setItem("terms", terms);


		var slimType = this.state.slimType;
                if (slimType == '') {
                      slimType = window.localStorage.getItem("slimType");
                }
		var aspect = "C";
		if (slimType && slimType.includes(": process")) {
		     aspect = "P";
		}
		else if (slimType && slimType.includes(": function")) {
		     aspect = "F";
                }

		window.localStorage.setItem("aspect", aspect);
				
	},

	onReset(e) {
		window.localStorage.clear();
		this.setState({ slimType: goSet[0] } );
	},

        onChange(e) {
                this.setState({ text: e.target.value});
        },

	onChange4slimtype(e) {
                this.setState({ text: e.target.value,
				slimType: e.target.value });
        },

	runGoTools() {

		var paramData = {};

		paramData['genes'] = window.localStorage.getItem("genes");

		paramData['aspect'] = window.localStorage.getItem("aspect");
		
		paramData['terms'] = window.localStorage.getItem("terms");
 		
		paramData['mapper'] = 1;

		this.sendRequest(paramData)
	
		return
		 		
	},
	
	sendRequest(paramData) {

		$.ajax({
			url: GOtoolsUrl,
			data_type: 'json',
			type: 'POST',
			data: paramData,
			success: function(data) {
			      this.setState({isComplete: true,
			                     resultData: data});
			}.bind(this),
			error: function(xhr, status, err) {
			      this.setState({isPending: true});
			}.bind(this) 

		});
	},

	getSlimData: function() {
                $.ajax({
                      url: GOslimUrl,
                      dataType: 'json',
                      success: function(data) {
                            this.setState({goslimData: data});
                      }.bind(this),
                      error: function(xhr, status, err) {
                            console.error(GOslimUrl, status, err.toString());
                      }.bind(this)
                });
        },

	getAmbiguousNames: function() {
                $.ajax({
                      url: GeneChkUrl,
                      dataType: 'json',
                      success: function(data) {
                            this.setState({ambiguousNames: data});
                      }.bind(this),
                      error: function(xhr, status, err) {
                            console.error(GeneChkUrl, status, err.toString());
                      }.bind(this)
                });
        },

	topDescription() {
		
		return "<p><h3>The GO Slim Mapper maps annotations of a group of genes to more general terms and/or bins them into broad categories, i.e. <a href='https://sites.google.com/view/yeastgenome-help/analyze-help/go-slim-mapper?authuser=0' target='help_win'>GO Slim</a> terms.<p></p> Three GO Slim sets are available at SGD:<p></p><ul><li>Yeast GO-Slim: broad, high level GO terms from the Biological Process, Molecular Function and Cellular Component ontologies selected and maintained by the Saccharomyces Genome Database (SGD)</li><li>Generic GO-Slim: broad, high level GO terms from the Biological Process, Molecular Function and Cellular Component ontologies selected and maintained by the Gene Ontology Consortium (GOC)</li><li>Macromolecular complex terms: protein complex terms from the Cellular Component ontology</li><ul></h3></p>";
	
	},

	getResultText() {
		
		return "<h3>This page displays genes from your query that are annotated directly or indirectly (via a parent:child relationship) to the <a href='https://sites.google.com/view/yeastgenom\
e-help/analyze-help/go-slim-mapper?authuser=0' target='help_win'>GO Slim</a> terms of your choice.</h3>";
		
	},

	tableSaveOptions(htmlUrl, termsUrl, tabUrl, inputUrl, slimTermUrl) {
		return "<h3>Save Options: <a href=" + htmlUrl + " target='infowin2'>HTML Table</a> | <a href=" + termsUrl + " target='infowin2'>Plain Text</a> | <a href=" + tabUrl + " target='infowin2'>Tab-delimited</a> | <a href=" + inputUrl + " target='infowin2'>Your Input List of Genes</a> | <a href=" + slimTermUrl + " target='infowin2'>Your GO Slim List</a></h3>";
			   
	}

});

module.exports = GoSlimMapper;

