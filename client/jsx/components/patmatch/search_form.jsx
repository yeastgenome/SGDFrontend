"use strict";

var React = require("react");
var _ = require("underscore");
var $ = require("jquery");

var Checklist = require("../widgets/checklist.jsx");

var Params = require("../mixins/parse_url_params.jsx");

var ExampleTable = require("./example_table.jsx");

var DataTable = require("../widgets/data_table.jsx");


var PATMATCH_URL = "/run_patmatch";

var SearchForm = React.createClass({

	getInitialState: function () {
	        
		var param = Params.getParams();
		
		var submitted = null;				
		if (param['pattern']) {
		     submitted = 1;
		}
		
		var get_seq = 0;
		if (param['seqname']) {
		   get_seq = 1;
		}

		this._getConfigData();

		return {
			isComplete: false,
			isPending: false,
			userError: null,
			configData: {},
			genome: 'S288C',
			seqtype: 'protein',
			dataset: null,
			pattern: null,
			maxHits: null,
			strand: null,
			mismatch: null,
			deletion: null,
			insersion: null,
			substitution: null,
			resultData: {},
			seqname: null,
			beg: null,
			end: null,
			param: param,
			didPatmatch: 0,
			submitted: submitted,
			seqFetched: false,
			getSeq: get_seq
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
		// if (this.state.getSeq) {
		//      this._getSeq();
		// }
	},

	_getFormNode: function () {

		
		if (this.state.getSeq && !this.state.seqFetched) {
		        this._getSeq();
			return;
		}		
		else if (this.state.getSeq && this.state.seqFetched) {

		        var param = this.state.param;
			
			var beg = param['beg'];
			var end = param['end'];

                        var seq = this.state.resultData.seq;
			
			var seqSection = "";
			var maxlen = 60;
			var j = 1;
			var seqBases = seq.split('');
			for (var i in seqBases) {
			    if (j > maxlen) {
			        seqSection = seqSection + "<br>";
				j = 1;
			    }
			    if (i >= beg-1 && i <= end-1) { 
			        seqSection = seqSection + "<font color='blue'>" + seqBases[i] + "</font>";
			    }
			    else {
			        seqSection = seqSection + seqBases[i];
			    }
			    j = j + 1;
			}    
			
                        var defline = this.state.resultData.defline;
			var result = "<h3>" + defline + "</h3><p>" + seqSection + "</p>";
                        return (<div dangerouslySetInnerHTML={{ __html: result }} />);
  
		}
	        else if (this.state.isComplete) {

		        // if (this.state.resultData.hits == '') {
			//     var errorReport = this.state.resultData.result;
			//     return (<div dangerouslySetInnerHTML={{ __html: errorReport }} />);
			// }

			var data = this.state.resultData.hits;
			var totalHits = this.state.resultData.totalHits;
			var uniqueHits = this.state.resultData.uniqueHits;
			
			if (totalHits == 0) {
			     return (<div><p>No hits found for your pattern. Please modify your pattern and try again..</p></div>);
			}

			var _summaryTable = this._getSummaryTable(totalHits, uniqueHits)
			var _resultTable = this._getResultTable(data)

		       	return (<div><p><center>{_summaryTable}</center></p>
				     <p>{_resultTable}</p>
			       </div>);			

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
			
			var configData = this.state.configData;

			var genomeBoxNode = this._getGenomeBoxNode(configData);
			var seqtypeNode = this._getSeqtypeNode(); 
			var patternBoxNode = this._getPatternBoxNode();
			var datasetNode = this._getDatasetNode(configData);
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
	
	_getGenomeBoxNode: function(data) {
	
		var _genomeDef = 'S288C';
		var _elements = _.map(data.genome, g => {
                       if (g.strain == _genomeDef) {
                            return <option value={g.strain} selected="selected">{g.label}</option>;
                       }
                       else {
                            return <option value={g.strain}>{g.label}</option>;
                       }
                });
                return(<div>
                       <h3>Choose a genome to search: </h3>
                       <p><select ref='genome' name='genome' onChange={this._onChangeGenome}>{_elements}</select></p>
                </div>);
			      
	},
		
	_getSeqtypeNode: function() {

                var pattern_type = {'peptide': 'protein', 'nucleotide': 'dna'};
                var _elements = [];
                for (var key in pattern_type) {
                     if (key == 'peptide') {
                          _elements.push(<option value={pattern_type[key]} selected="selected">{key}</option>);
                     }
                     else {
                          _elements.push(<option value={pattern_type[key]}>{key}</option>);
                     }
                }

                return(<div>
		      <h3>Enter a</h3>
		      <p><select name='seqtype' ref='seqtype' onChange={this._onChangeSeqtype}>{_elements}</select></p>
		</div>);

        },

	_getPatternBoxNode: function() {

                return (<div>
                        <h3>sequence or pattern (<a href='#examples'>syntax</a>)</h3>
			<textarea ref='pattern' name='pattern' onChange={this._onChange} rows='1' cols='50'></textarea>
                </div>);

        },

	_getDatasetNode: function(data) {
	 			
		var _elements = []; 
		for (var key in data.dataset) {
		     if (key == this.state.genome) {
		       	    var datasets = data.dataset[key];
			    for (var i = 0; i < datasets.length; i++) { 
    			    	var d = datasets[i];
				if (d.seqtype != this.state.seqtype) {
				     continue;
				}
				if (i==0) {
				     _elements.push(<option value={d.dataset_file_name} selected="selected">{d.label}</option>);
				}
				else {
				     _elements.push(<option value={d.dataset_file_name}>{d.label}</option>);			
				}						
			    }			    
		     }
		}	    

		return(<div>
                       <h3> Choose a Sequence Database (click and hold to see the list):</h3>
                       All public S. cerevisiae sequences can be found within these datasets.
		       <p><select ref='dataset' name='dataset' onChange={this._onChange}>{_elements}</select></p>
                </div>);

	},

	_getSubmitNode: function() {
               
                return(<div>
                      <p><input type="submit" value="START PATTERN SEARCH" className="button secondary"></input> OR  <input type="reset" value="RESET FORM" className="button secondary"></input>
		      </p>
                </div>);

        },

	_getOptionsNode: function() {

		var maximumHitsNode = this._getMaximumHitsNode();
		var strandNode = this._getStrandNote();
		var mismatchNode = this._getMismatchNode();
		var mismatchTypeNode = this._getMismatchTypeNode();

		var descText = "<p>PLEASE WAIT FOR EACH REQUEST TO COMPLETE BEFORE SUBMITTING ANOTHER. These searches are done on a single computer at Stanford shared by many other people.</p><hr><h3>More Options:</h3>";

	        return(<div>
		      <div dangerouslySetInnerHTML={{ __html: descText}} />
		      <br>Maximum hits:</br>
		      { maximumHitsNode }
		      <br>If DNA, Strand:</br>
                      { strandNode }
		      <br>Mismatch:</br>
                      { mismatchNode }
                      { mismatchTypeNode }
		</div>);

	},	

	_getMaximumHitsNode: function() {

		var hits = ['25', '50', '100', '200', '500', '1000', "no limit"];
		var _elements = this._getDropdownList(hits, "100");
                return <select name='max_hits' ref='max_hits' onChange={this._onChange}>{_elements}</select>;
	
	},

	_getStrandNote: function() {

               	var strands = ['Both strands', 'Strand in dataset', 'Reverse complement of strand in dataset'];
                var _elements = this._getDropdownList(strands, "Both strands");
                return <select name='strand' ref='strand' onChange={this._onChange}>{_elements}</select>;
			
	},

	_getMismatchNode: function() {
	
		var mismatch = ['0', '1', '2', '3'];
                var _elements = this._getDropdownList(mismatch, "0");
                return <select name='mismatch' ref='mismatch' onChange={this._onChange}>{_elements}</select>;

	},	

	_getMismatchTypeNode: function() {

	        var _elements = [ { 'key': 'insertion',
		    	      	    'name': 'Insertions' },
				  { 'key': 'deletion',
                                    'name': 'Deletions' },
				  { 'key': 'substitution',
                                    'name': 'Substitutions' } ]

		var _init_active_keys = ['insertion', 'deletion', 'substitution'];

	        return (<div><a href='#mismatch_note'>(more information on use of the Mismatch option)</a>
		       <Checklist elements={_elements} initialActiveElementKeys={_init_active_keys} />
		       </div>);

	},
	_getPatternExampleNote: function() {

		var examples = ExampleTable.examples();
		
		return(<div><p><a name='examples'><h3>Supported Pattern Syntax and Examples:</h3></a></p>
		      {examples}
		      <p><h3><a name='mismatch_note'>Limits on the use of the Mismatch option</a></h3></p>
		      <p>At this time, the mismatch option (Insertions, Deletions, or Substitutions) can only be used in combination with exact patterns that do not contain ambiguous peptide or nucleotide characters (e.g. X for any amino acid or R for any purine) or regular expressions (e.g. L{3,5}X{5}DGO). In addition, the mismatch=3 option can only be used for query strings of at least 7 in length.</p>
		</div>);

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

	// need to combine these three
        _onChange: function(e) {
                this.setState({ text: e.target.value});
        },

	_onChangeGenome: function(e) {
                this.setState({ genome: e.target.value});
        },

	_onChangeSeqtype: function(e) {
                this.setState({ seqtype: e.target.value});
        },
	
	_getConfigData: function() {
                var jsonUrl = PATMATCH_URL + "?conf=patmatch.json";
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
                	
		var genome = this.state.genome.value.trim();
		var seqtype = this.state.seqtype.value.trim();
		var pattern = this.refs.pattern.value.trim();
		var dataset =  this.refs.dataset.value.trim();
				
		if (pattern) {
		    window.localStorage.clear();
		    window.localStorage.setItem("genome",  genome);
		    window.localStorage.setItem("seqtype", seqtype);
		    window.localStorage.setItem("pattern", pattern);
		    window.localStorage.setItem("dataset", dataset);
		}
		else {
		    e.preventDefault();
		    return 1; 
		}

	},

	_doPatmatch: function() {

	        var param = this.state.param;

		var genome = param['genome'];
                var seqtype = param['seqtype'];
		if (typeof(seqtype) == "undefined" || seqtype == 'protein') {
                    seqtype = 'pep';
                }
                var pattern = param['pattern'];
                var dataset = param['dataset'];
		if (typeof(dataset) == "undefined") {
		    if (seqtype == 'pep') {
		        dataset = 'orf_pep';
		    }
		    else {
		        dataset = 'orf_dna';
		    }
		}
		
		var strand = param['strand'];
		if (typeof(strand) == "undefined") {
                    strand = 'Both strands';
                }
	
		if (pattern) {
                    window.localStorage.clear();
                    window.localStorage.setItem("genome",  genome);
                    window.localStorage.setItem("seqtype", seqtype);
                    window.localStorage.setItem("pattern", pattern);
                    window.localStorage.setItem("dataset", dataset);		    
		    window.localStorage.setItem("strand", strand);
                }

		var pattern = pattern.replace("%3C", "<");
		var pattern = pattern.replace("%3E", ">");

		$.ajax({
			url: PATMATCH_URL,
			data_type: 'json',
			type: 'POST',
			data: { 'seqtype':      seqtype,
			        'pattern':      pattern,
				'dataset':      dataset,
				'strand':       strand,
				'max_hits':     param['max_hits'],
				'mismatch':	param['mismatch'],
				'insertion':    param['insertion'],
				'deletion':     param['deletion'],
				'substitution': param['substition']			
                        },
			success: function(data) {
			      this.setState({isComplete: true,
			                     resultData: data});
			}.bind(this),
			error: function(xhr, status, err) {
			      this.setState({isPending: true});
			}.bind(this) 
		});

	},

	_getSeq: function() {

		var param = this.state.param;

		$.ajax({
                        url: PATMATCH_URL,
                        data_type: 'json',
                        type: 'POST',
                        data: { 'seqname':      param['seqname'],
                                'dataset':      param['dataset']
                        },
                        success: function(data) {
                              this.setState({seqFetched: true,
                                             resultData: data});
                        }.bind(this),
                        error: function(xhr, status, err) {
                              this.setState({isPending: true});
                        }.bind(this)
                });
 
	},

	_getSummaryTable: function(totalHits, uniqueHits) {
	
                var dataset = window.localStorage.getItem("dataset");
                var pattern = window.localStorage.getItem("pattern");
                var seqtype = window.localStorage.getItem("seqtype");
		var strand  = window.localStorage.getItem("strand");

                var configData = this.state.configData;
                var seqSearched = 0;
                var datasetDisplayName = "";
                for (var key in configData.dataset) {
                     var datasets = configData.dataset[key];
                     for (var i = 0; i < datasets.length; i++) {
                         var d = datasets[i];
                         if (d.dataset_file_name == dataset) {
                            seqSearched = d.seqcount;
                            datasetDisplayName = d.label.split(" = ")[1];
                            break;
                         }
                     }
                }

                var _summaryRows = [];

                _summaryRows.push(['Total Hits', totalHits]);
                _summaryRows.push(['Number of Unique Sequence Entries Hit', uniqueHits]);
                _summaryRows.push(['Sequences Searched', seqSearched]);

		var pattern = pattern.replace("%3C", "<");
		var pattern = pattern.replace("%3E", ">");

                if (seqtype == "dna" || seqtype.indexOf('nuc') >= 0) {
                       _summaryRows.push(['Entered nucleotide pattern', pattern]);
                }
                else {
                       _summaryRows.push(['Entered peptide pattern', pattern]);
                }
                _summaryRows.push(['Dataset', datasetDisplayName]);
		
		if (seqtype == "dna" || seqtype.indexOf('nuc') >= 0) {
                       _summaryRows.push(['Strand', strand]);
                }

                var _summaryData = { headers: [['', '']],
		                     rows: _summaryRows };
		
		return <DataTable data={_summaryData} />;		

	},

	_getResultTable: function(data) {

	        var dataset = window.localStorage.getItem("dataset");

		var withDesc = 0;
		if( dataset.indexOf('orf_') >= 0 ){		
		    withDesc = 1;
		}
		
		var notFeat = 0;
		if ( dataset.indexOf('Not') >= 0 ) {
		    notFeat = 1;
		}
						
		var _tableRows = _.map(data, d => {
		    	       
			   if (notFeat == 1) {

			      	return [d.chr, d.orfs, d.count, d.matchingPattern, d.beg, d.end, 'Sequence'];

			   }
		    	   if (withDesc == 0) {

			        return [d.seqname, d.count, d.matchingPattern, d.beg, d.end, 'Sequence'];

			   }
			   else {		    	   

		    	   	var headline = d.desc.split(';')[0];
			   	var name = d.seqname;
			   	if (d.gene_name) {
			       	     name = name + "/" + d.gene_name;
			   	}
                           	return [name, d.count, d.matchingPattern, d.beg, d.end, 'Sequence',  headline];
			   }
                });

		var header = ['Sequence Name', 'Hit Number', 'Matching Pattern', 'Matching Begin', 'Matching End', 'Matching Result'];
     	        if (withDesc == 1) {

		     header = ['Sequence Name', 'Hit Number', 'Matching Pattern', 'Matching Begin', 'Matching End', 'Matching Result',  'Locus Information'];

		}
		else if (notFeat == 1) {

		     header = ['Chromosome', 'Between ORF - ORF', 'Hit Number', 'Matching Pattern', 'Matching Begin', 'Matching End', 'Matching Result'];

		}

		var _tableData = {
		      headers: [header],
		      rows: _tableRows
		};

		var _dataTableOptions = {
		    bPaginate: true,
		    oLanguage: { "sEmptyTable": "No Hits." }
                };

		return <DataTable data={_tableData} usePlugin={true} pluginOptions={_dataTableOptions} />;

        }

});

module.exports = SearchForm;
