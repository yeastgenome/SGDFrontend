import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require("../widgets/data_table.jsx");
const Params = require("../mixins/parse_url_params.jsx");
const RadioSelector = require("../blast/radio_selector.jsx");

const style = {
      button: { fontSize: 18, background: 'none', border: 'none', color: '#7392b7' },
      textFont: { fontSize: 18 }
};

const GOtoolsUrl = "/run_gotools";

const GoTermFinder = React.createClass({

	getInitialState() {
	        
		var param = Params.getParams();
		
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			aspect: 'F',
			uploadedGenes: null,
			resultData: {},
			notFound: null,
			param: param
		};
	},

	render() {	
	
		var page_to_display = this.getPage();
		
		return (<div>
			  <span style={{ textAlign: "center" }}><h1>Gene Ontology Term Finder <a target="_blank" href="https://sites.google.com/view/yeastgenome-help/analyze-help/go-term-finder?authuser=0"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
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
			
			if (param['submit']) {
			   
			     var [_geneList, _resultTable] = this.getResultTable4gene(data);
			     var _desc = this.getDesc4gene(_geneList);

			     return (<div>
					   <p dangerouslySetInnerHTML={{ __html: _desc }} />
			                   <p>{ _resultTable } </p>
			             </div>);

			}

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
			     return <p>Please wait... The search may take a while to run.</p>; 
			}

			return this.getFrontPage();
			
		}
	},

	getFrontPage() {

		var descText = this.topDescription();		

		var geneBox = this.getGeneBox();
		var geneUpload = this.getGeneUpload();
		var ontology = this.getOntology();

		var _geneSection = { headers: [[<span style={ style.textFont }><a name='step1'>Step 1. Query Set (Your Input)</a></span>, '']],
                                     rows:    [[geneBox, geneUpload]] };
				  
		var _ontologySection = { headers: [[<span style={ style.textFont }><a name='step2'>Step 2. Choose Ontology</a></span>]],
                                     rows:    [[ontology]] };
		return (<div>
			<div dangerouslySetInnerHTML={{ __html: descText}} />
			<div className="row">
			     <div className="large-12 columns">
			     	  <form onSubmit={this.onSubmit} target="infowin">
				        <DataTable data={_geneSection} />
					<DataTable data={_ontologySection} />
			          </form>
			     </div>
			</div>
		</div>);

	},

	getOntology() {

	        var _elements = [ { name: "Process", key: "P" }, { name: "Function", key: "F" }, { name: "Component", key: "C" }];

		return (<div>
		        <RadioSelector name='filter' elements={_elements} initialActiveElementKey='F'/>;
			<p>Search using <a href='#defaultsetting">default settings</a> or use Step 3, Step 4, and/or Step 5 below to customize your options.</p>	
			<p><input type="submit" ref='submit' name='submit' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset' name='reset' value="Reset Form" className="button secondary"></input></p>
			</div>);

	},

	getEvEvidenceCodes() {

	        return <div>EVIDENCE CODES</div>;

	},

	getGeneBox() {

		// var ontology = this.getOntology();
		// var evidenceCodes = this.getEvidenceCodes();
		// <p><h3>Choose one of the three ontology aspects: { ontology }</h3></p>
                // <p><h3>Select evidence codes to exclude: { evidenceCodes }</h3></p>

                return (<div style={{ textAlign: "top" }}>
			<h3>Enter Gene/ORF names:</h3>
			<p>(separated by a return or a space)
                        <textarea ref='genes' onChange={this._onChange} name='genes' rows='5' cols='50'></textarea></p>
                </div>);

        },

	getGeneUpload() {

		return (<div style={{ textAlign: "top" }}>
                        <h3><strong style={{ color: 'red'}}>OR</strong> Upload a file of Gene/ORF names</h3> 
			<p>(.txt or .tab format):
                        <input className="btn btn-default btn-file" type="file" name='uploadFile' onChange={this.handleFile} accept="image/*;capture=camera"/></p>
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
        }

	onSubmit(e) {
		
		var genes = this.refs.genes.value.trim();
                if (genes == '') {
                    genes = this.state.uploadedGenes;
                }
		genes = genes.replace(/[^A-Za-z:\-0-9]/g, ' ');
		var re = /\+/g;
		genes = genes.replace(re, " ");		
		var re = / +/g;
		genes = genes.replace(re, "|");
		if (genes == '') {
		   alert("Please enter two or more gene names.");
		   e.preventDefault();
                   return 1;
		}

		// var not_found = this.state.notFound;
		// if (not_found != "") {
		//        e.preventDefault();
		//	return 1;
		// }

		// var strainList = document.getElementById('strains');
                // var strains = '';
		// for (var i = 0; i < strainList.options.length; i++) {
                //     if (strainList.options[i].selected) {
                //         if (strains) {
                //              strains = strains + '|' + strainList.options[i].value;
		//	 }
                //         else {
                //              strains = strainList.options[i].value;
                //         }
                //     }
                // }

		// if (strains == '') {
		//   alert("Please pick one or more strains.");
                //   e.preventDefault();
                //   return 1;
		// }	
	
		window.localStorage.clear();
                window.localStorage.setItem("genes", genes);
                // window.localStorage.setItem("aspect", aspect);

	},

        onChange(e) {
                this.setState({ text: e.target.value});
        },

	runGoTools() {

		var paramData = {};
		
		var param = this.state.param;

		if (searchType == 'genes') {

		   paramData['genes'] = window.localStorage.getItem("genes");
		   paramData['aspect'] = window.localStorage.getItem("aspect");
		   // add other parameters eg p-value, exclude evidence list etc 
		   this.sendRequest(paramData)
		   return
		}
		 		
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

	topDescription() {
	
		return "<p><h3>The GO Term Finder (<a href='http://search.cpan.org/dist/GO-TermFinder/' target='infowin'>Version 0.86</a>) searches for significant shared GO terms, or parents of those GO terms, used to describe the genes in your list to help you discover what the genes may have in common. To map annotations of a group of genes to more general terms and/or to bin them in broad categories, use the <a href='https://www.yeastgenome.org/cgi-bin/GO/goSlimMapper.pl' target='infowin'>GO Slim Mapper</a></h3></p>.<p><h3><a name='defaultsetting'>Default Settings:</a>1. All genes/features that have GO annotations in the database, 2. Manually curated and High-throughput annotation methods, and 3. Hits with p-value < 0.01 will be displayed on the results page</h3></p>";
	
	}

});

module.exports = GoTermFinder;

