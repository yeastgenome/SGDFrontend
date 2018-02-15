"use strict";

var React = require("react");
var _ = require("underscore");
var $ = require("jquery");

var Params = require("../mixins/parse_url_params.jsx");

// var RadioSelector = require("./radio_selector.jsx");
// var BlastBarChart = require("./blast_bar_chart.jsx");

var PATMATCH_URL = "/run_patmatch";

var SearchForm = React.createClass({

	getInitialState: function () {
	        
		var param = Params.getParams();
		
		var submitted = '';
		if (param['submit']) {
		     submitted = 1;
		}

		this._getConfigData();

		// submitted: submitted,
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			configData: {},
			strain: null,
			seqtype: null,
			dataset: null,
			pattern: null,
			maxHits: null,
			strand: null,
			mismatch: null,
			deletion: null,
			insersion: null,
			substitution: null,
			resultData: {},
			param: param,
			didPatmatch: 0
		};
	},

	render: function () {		
		var formNode = this._getFormNode();
		return (<div>
			<span style={{ textAlign: "center" }}><h1>Yeast Genome Pattern Matching <a target="_blank" href="https://sites.google.com/view/yeastgenome-help/analyze-help/pattern-matching?authuser=0"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			<hr /></span>
			{formNode}
		</div>);
	},

	componentDidMount: function () {
	        if (this.state.submitted) {
	              this._doPatmatch();
	        }
	},

	_getFormNode: function () {
				
	        if (this.state.isComplete) {
		        if (this.state.resultData.hits == '') {
			     var errorReport = this.state.resultData.result;
			     return (<div dangerouslySetInnerHTML={{ __html: errorReport }} />);

			}

			<p>DISPLAY RESULT TABLE HERE</p>

		} 
		else if (this.state.isPending) {

		        return (<div>
			       <div className="row">
			       	    <p><b>Something wrong with your patmatch search</b></p>
			       </div>
			</div>);
			
		}
		else {

		        if (this.state.submitted) {
			     return <p>Please wait... The search may take a while to run.</p>; 

			}
			var genomeBoxNode = this._getGenomeBoxNode();
			var seqtypeNode = this._getSeqtypeNode(); 
			var patternBoxNode = this._getPatternBoxNode();
			var datasetNode = this._getDatasetNode();
                	var submitNode = this._getSubmitNode();
                	var optionNode = this._getOptionsNode();
			var patternExampleNode = this._getPatternExampleNote();

			// need to put the date in a config file
			
			var descText = "<p>Pattern Matching allows you to search for short (<20 residues) nucleotide or peptide sequences, or ambiguous/degenerate patterns. It uses the same dataset as SGD's BLAST program. If you are searching for a sequence >20 bp or aa with no degenerate positions, please use BLAST, which is much faster. Pattern Matching allows for ambiguous characters, mismatches, insertions and deletions, but does not do alignments and so is not a replacement for <a target='_blank' href='/blast-sgd'>BLAST</a>. Please note, also, that PatMatch will not find overlapping hits.</p><p>Your comments and suggestions are appreciated: <a target='_blank' href='/suggestion'>Send a Message to SGD</a></p>";
							
			return (<div>
			        <div dangerouslySetInnerHTML={{ __html: descText}} />
				<form onSubmit={this._onSubmit} target="search_result">
					<div className="row">
                        		     <div className="large-12 columns">
                               		     	  { genomeBoxNode }
						  { seqtypeNode }
						  { patternBoxNode }
						  { datasetNode }
                               			  { submitNode }
						  { optionNode }
						  { patternExampleNode }
                   		             </div>
                                       </div>
				</form>
			</div>);
		}
	},
	
	_getGenomeBoxNode: function() {
	
                return(<div><p>GENOME BOX SESSION</p></div>);
			      
	},
		
	_getSeqtypeNode: function() {

                var format = ['peptide', 'nucleotide'];

                var _elements = [];
                format.forEach ( function(f) {
                     if (f == 'peptide') {
                          _elements.push(<option value={f} selected="selected">{f}</option>);
                     }
                     else {
                          _elements.push(<option value={f}>{f}</option>);
                     }
                });

                return(<div>
		      <p><h3>Enter a</h3></p>
		      <p><select ref='seqtype' onChange={this._onChange}>{_elements}</select></p>
		</div>);

        },

	_getPatternBoxNode: function() {

                return (<div>
                        <p><h3>sequence or pattern (<a href='#examples'>syntax</a>)</h3></p>
                        <textfield ref='pattern' onChange={this._onChange} size='50'></textfield><p></p>
                </div>);

        },

	_getDatasetNode: function() {

	        return(<div><p>DATASET SECTION</p></div>);

	},

	_getSubmitNode: function() {
               
                return(<div>
                      <p><input type="submit" value="START PATTERN SEARCH" className="button secondary"></input> OR  <input type="reset" value="RESET FORM" className="button secondary"></input>
		      </p>
                </div>);

        },

	_getOptionsNode: function() {

	        return(<div><p>OPTIONS SECTION</p></div>);

	},	

	_getPatternExampleNote: function() {

                return(<div><p>PATTERN EXAMPLES SECTION</p></div>);

        },

	_getDropdownList: function(elementList, activeVal) {
		var _elements = [];
		elementList.forEach ( function(m) {
                     if (m == activeVal) {
                     	  _elements.push(<option value={m} selected='selected'>{m}</option>);
                     }
                     else {
                          _elements.push(<option value={m}>{m}</option>);
                     }
		});
       		return _elements;
	},

        _onChange: function(e) {
                this.setState({ text: e.target.value});
        },

	_getConfigData: function() {
                var jsonUrl = PATMATCH_URL + "?conf=patmatch.conf";
                $.ajax({
                      url: jsonUrl,
                      dataType: 'json',
                      success: function(data) {
                            this.setState({configData: data});
                      }.bind(this),
                      error: function(xhr, status, err) {
                            console.error(jsonUrl, status, err.toString());
                      }.bind(this)
                });
        },

	_onSubmit: function (e) {

		var strain = this.refs.strain.value.trim();
		var seqtype = this.refs.seqtype.value.trim();
		var pattern = this.refs.pattern.value.trim();
		var dataset = this.refs.dataset.value.trim();
		// more here		
                		
		if (pattern) {
		    window.localStorage.clear();
		    window.localStorage.setItem("seqtype", seqtype);
		    window.localStorage.setItem("pattern", pattern);
		    window.localStorage.setItem("dataset", dataset);
		    // more here
		}
		else {
		    e.preventDefault();
		    return 1; 
		}

	},

	_doPatmatch: function() {

		var seqtype = window.localStorage.getItem("seqtype");
		var pattern = window.localStorage.getItem("pattern");
		var dataset = window.localStorage.getItem("dataset");
		// more here

		$.ajax({
			url: PATMATCH_URL,
			data_type: 'json',
			type: 'POST',

			// add more to data: eg, insertion, deletion, ....
			data: { 'seqtype':     seqtype,
			        'pattern':     pattern,
				'dataset':     dataset
                        },
			success: function(data) {
			      this.setState({isComplete: true,
			                     resultData: data,
			         	     filter: filter});
			}.bind(this),
			error: function(xhr, status, err) {
			      this.setState({isPending: true}); 
			}.bind(this) 
		});

	},

});

module.exports = SearchForm;
