import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const Checklist = require("../widgets/checklist.jsx");
const Params = require("../mixins/parse_url_params.jsx");
const ExampleTable = require("./example_table.jsx");
const DataTable = require("../widgets/data_table.jsx");

const PatmatchUrl = "/run_patmatch";

const LETTERS_PER_CHUNK = 10;
const LETTERS_PER_LINE = 60;

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
		
		if (this.state.getSeq) {
		     return (<div>{ formNode }</div>);
		}
		else {
		     return (<div>
			    <span style={{ textAlign: "center" }}><h1>Yeast Genome Pattern Matching <a target="_blank" href="https://sites.google.com/view/yeastgenome-help/analyze-help/pattern-matching?authuser=0"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			    <hr /></span>
			    {formNode}
		     </div>);
		}
		 
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

		     	var seqNode = this._getSeqNode();
			
			return (<div dangerouslySetInnerHTML={{ __html: seqNode }} />);
				
		}
	        else if (this.state.isComplete) {

		        // if (this.state.resultData.hits == '') {
			//     var errorReport = this.state.resultData.result;
			//     return (<div dangerouslySetInnerHTML={{ __html: errorReport }} />);
			// }

			var data = this.state.resultData.hits;
			var totalHits = this.state.resultData.totalHits;
			var uniqueHits = this.state.resultData.uniqueHits;
			var downloadUrl = this.state.resultData.downloadUrl;
			
			if (totalHits == 0) {
			     return (<div><p>No hits found for your pattern. Please modify your pattern and try again..</p></div>);
			}

			var _summaryTable = this._getSummaryTable(totalHits, uniqueHits);
			var _resultTable = this._getResultTable(data, totalHits);

		       	return (<div><p><center>{_summaryTable}</center></p>
				     <p><center>{_resultTable}</center></p>
				     <p><center><blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}><a href={downloadUrl}>Download Full Results</a></blockquote></center></p>
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
				<form onSubmit={this._onSubmit} target="infowin">
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
	

	_getSeqNode: function() {

		var param = this.state.param;
                var beg = param['beg'];
                var end = param['end'];
		var dataset = param['dataset'];
		var seqname = param['seqname'];

                var seq = this.state.resultData.seq;
		var text = this.state.resultData.defline;

		var seq_orig = seq;

		var seqlen = seq.length;
		var seqStart = 0;
		
		var seqEnd = seqlen;
                if (seqlen > 5000) {
                     if (Math.ceil(beg/LETTERS_PER_LINE)*LETTERS_PER_LINE >  LETTERS_PER_LINE*4) {
                     	  seqStart = Math.ceil(beg/ LETTERS_PER_LINE)*LETTERS_PER_LINE -  LETTERS_PER_LINE*4;
                     }
                     seqEnd = seqStart+ LETTERS_PER_LINE*9;
                     if (seqEnd > seqlen) {
                         seqEnd = seqlen;
                     }
                     seq = seq.substring(seqStart, seqEnd);
                }
		
		var tenChunked = seq.match(/.{1,10}/g).join(" ");
    		var lineArr = tenChunked.match(/.{1,66}/g);
    		// var maxLabelLength = ((lineArr.length * LETTERS_PER_LINE + 1).toString().length)
		var maxLabelLength = seqEnd.toString().length + 1;

    		lineArr = _.map(lineArr, (line, i) => {
      			var lineNum = seqStart + i * LETTERS_PER_LINE + 1;
      			var numSpaces = maxLabelLength - lineNum.toString().length;
      			var spacesStr = Array(numSpaces + 1).join(" ");
			
      			if (beg >= lineNum && beg <= lineNum + 59) {
          		    var tmpBeg = beg - lineNum;
          		    var tmpEnd = end - lineNum;
          		    if (tmpEnd > 59) {
             		       tmpEnd = 59;
             		       beg = lineNum + 60;
          		    }
          		    var baseArr = line.split("");
          		    var k = 0;
          		    var newLine = ""
           		    _.map(baseArr, (base, j) => {
              		         if (k < tmpBeg || k > tmpEnd || base == ' ') {
                   		      newLine += base;
              			 }
              			 else {
                   		      newLine += "<strong style='color:blue;'>" + base + "</strong>";
              			 }
              			 if (base != ' ') {
                   		      k++;
              			 }
          	            });
          	       	    line = newLine;
      		 	}
			return `${spacesStr}${lineNum} ${line}`;
			
    	        });
		
		
    	  	// var seqNode = _.map(lineArr, (l, i) => {
    	  	//       return <span key={'seq' + i}>{l}<br /></span>;
    	  	// });
		//		
		// return (<div>
             	//       <blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}>
             	//       <pre>
                //       {seqNode}
             	//       </pre>
             	//       </blockquote>
             	//       </div>);
		
		var seqlines = "";
		_.map(lineArr, (l, i) => {
		    seqlines += l + "\n";
		});
	    
		// var spacesStr = Array(maxLabelLength + 1).join(" ");
		if (seqEnd < seqlen) {
	    	     seqlines += " ..........";
		}
		if (seqStart > 0) {
		   seqlines = " ..........\n" + seqlines;
		}

		var seqSection = "<blockquote style={{ fontFamily: 'Monospace', fontSize: 14 }}><pre>" + seqlines + "</pre></blockquote>";
		
		var datasetLabel = this._getDatasetLabel(dataset);
		
                var seqNode = "<center><h1>" + datasetLabel + " for " + seqname + "</h1><h3>The matching region is highlighted in the following retrieved sequence (in <span style='color:blue;'>blue</span>)</h3>" + seqSection + "</center>";

		return seqNode;

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

	        var param = this.state.param;

                var pattern_type = {'peptide': 'protein', 'nucleotide': 'dna'};
                var _elements = [];
                for (var key in pattern_type) {
		     
		     if (param['seqtype'] && param['seqtype'] == 'dna') {
		     	  _elements.push(<option value='dna' selected="selected">{key}</option>);
	             }		
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

		var param = this.state.param;
		var pattern = param['seq'];

                return (<div>
                        <h3>sequence or pattern (<a href='#examples'>syntax</a>)</h3>
			<textarea ref='pattern' value={ pattern } name='pattern' onChange={this._onChange} rows='1' cols='50'></textarea>
                </div>);

        },

	_getDatasetNode: function(data) {
	 			
				// if( dataset.indexOf('orf_') >= 0 ){
		var _elements = []; 
		for (var key in data.dataset) {
		     if (key == this.state.genome) {
		       	    var datasets = data.dataset[key];
			    for (var i = 0; i < datasets.length; i++) { 
    			    	var d = datasets[i];
				if (d.seqtype != this.state.seqtype) {
				     continue;
				}
				if (d.label.indexOf('Coding') >= 0 || d.label.indexOf('Trans') >= 0 ){
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

		var hits = ['25', '50', '100', '200', '500', '1000', "2000", "5000", "no limit"];
		var _elements = this._getDropdownList(hits, "500");
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
                var jsonUrl = PatmatchUrl + "?conf=patmatch.json";
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
			url: PatmatchUrl,
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
				'substitution': param['substitution']			
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
                        url: PatmatchUrl,
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
		
		window.localStorage.setItem("dataset_label", datasetDisplayName);
		
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

	_getResultTable: function(data, totalHits) {

	        var dataset = window.localStorage.getItem("dataset");

		var withDesc = 0;
		if( dataset.indexOf('orf_') >= 0 ){		
		    withDesc = 1;
		}
		
		var notFeat = 0;
		if ( dataset.indexOf('Not') >= 0 ) {
		    notFeat = 1;
		}
								
		var _tableRows = [];

		_.map(data, d => {

			var beg = d.beg;
			var end = d.end;
			if (notFeat == 1) {
			    var featStart = d.seqname.split(':')[1].split("-")[0];
			    beg = beg - parseInt(featStart) + 1;
			    end = end - parseInt(featStart) + 1;
			}   
			var seqLink = '/nph-patmatch?seqname=' + d.seqname + '&dataset=' + dataset + '&beg=' + beg + '&end=' + end;
				   
	 	  	if (notFeat == 1) {
    				
			     _tableRows.push([d.chr, d.orfs, d.count, d.matchingPattern, d.beg, d.end, <span><a href={ seqLink} target='infowin2'>Sequence</a></span>]);

			}
		    	else if (withDesc == 0) {

			     _tableRows.push([d.seqname, d.count, d.matchingPattern, d.beg, d.end, <span><a href={ seqLink} target='infowin2'>Sequence</a></span>]);

			}
			else {		    	   

		    	     var headline = d.desc.split(';')[0];
			     var name = d.seqname;
			     if (d.gene_name) {
			       	  name = name + "/" + d.gene_name;
			     }
			     var lspLink = '/locus/' + d.seqname;

			     _tableRows.push([ <span><a href={ lspLink } target='infowin2'>{ name }</a></span>, d.count, d.matchingPattern, d.beg, d.end, <span><a href={ seqLink} target='infowin2'>Sequence</a></span>, headline]);
				
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
		
		var pagination= true;
		if (totalHits  <= 10) {
		      pagination = false;
		}

		var _dataTableOptions = {
		    bPaginate: pagination,
		    oLanguage: { "sEmptyTable": "No Hits." }
                };

		return <DataTable data={_tableData} usePlugin={true} pluginOptions={_dataTableOptions} />;

        },

	_getDatasetLabel: function(dataset) {

	        var configData = this.state.configData;
                var datasetDisplayName = "";
		var seqtype = "";
                for (var key in configData.dataset) {
                     var datasets = configData.dataset[key];
                     for (var i = 0; i < datasets.length; i++) {
                         var d = datasets[i];
                         if (d.dataset_file_name == dataset) {
                            seqtype = d.seqtype;
                            datasetDisplayName = d.label.split(" = ")[0];
                            break;
                         }
                     }
               }

	       if (seqtype == 'dna') {
	           seqtype = 'DNA';
	       }
	       else {
 	           seqtype = 'Protein';
	       }

	       return datasetDisplayName + " " + seqtype + " Sequence";
		    
	}

});

export default SearchForm;
