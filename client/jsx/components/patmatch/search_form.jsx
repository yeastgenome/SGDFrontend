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
		
		// var submitted = '';
		// if (param['program']) {
		//     submitted = 1;
		// }


		// submitted: submitted,
		return {
			isComplete: false,
			isPending: false,
			userError: null,
		     	seqData: {},
			configData: {},
			seqType: null,
			genome: null,
			pattern: null,
			database: null,
			maxHits: null,
			strand: null,
			mismatch: null,
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
			     // return (<div dangerouslySetInnerHTML={{ __html: this.state.resultData.result}} />);
			     // return (<div><p>{resultData.result}</p></div>);
			     return (<div dangerouslySetInnerHTML={{ __html: errorReport }} />);

			}

		        var descText = "<p>Query performed by the Saccharomyces Genome Database; for full BLAST options and parameters, refer to the NCBI BLAST Documentation Links to GenBank, EMBL, PIR, SwissProt, and SGD are shown in bold type; links to locations within this document are in normal type. Your comments and suggestions are requested: <a href='/suggestion'>Send a Message to SGD</a></p><hr>"; 
			
			var graph = this._getGraphNode(this.state.resultData.hits);
			var tableStyle = { width: "900", marginLeft: "auto", marginRight: "auto" };

			var showHits = this.state.resultData.showHits;
                        var totalHits = this.state.resultData.totalHits;

			var hitSummary = "All hits shown";
			var hitSummary2 = "";

			if (Number(showHits) < Number(totalHits)) {
			       hitSummary = "The graph shows the highest hits per range";
			       hitSummary2 = "Data has been omitted: " + showHits + "/" + totalHits + " hits displayed";
			}

			return(<div>
			       <span style={{ textAlign: "center" }}><h3>{hitSummary}</h3></span>
			       <span style={{ textAlign: "center" }}><h3>{hitSummary2}</h3></span>
 			       <div>
				    <table style={tableStyle}>
					 <tr><td>{graph}</td></tr>
				    </table>
			       </div> 	  	    
			       <div dangerouslySetInnerHTML={{ __html: descText}} />
			       <div dangerouslySetInnerHTML={{ __html: this.state.resultData.result}} />
                        </div>);

		} 
		else if (this.state.isPending) {

		        return (<div>
			       <div className="row">
			       	    <p><b>Something wrong with your blast search</b></p>
			       </div>
			</div>);
			
		}
		else {

		        if (this.state.submitted) {
			     return <p>Please wait... The search may take a while to run.</p>; 

			}

		        var seqData = this.state.seqData;
                	var configData = this.state.configData;
                
			var commentBoxNode = this._getCommentBoxNode();
                	var submitNode = this._getSubmitNode();
                	var seqBoxNode = this._getSeqBoxNode(seqData.seq);
                	var blastProgramNode = this._getBlastProgramNode(configData);
                	var databaseNode = this._getDatabaseNode(configData);
                	var optionNode = this._getOptionsNode(configData);
			// need to put the date in a config file
			var descText = "<p>Datasets updated: January 31, 2018</p><p>This form allows BLAST searches of S. cerevisiae sequence datasets. To search multiple fungal sequences, go to the <a href='/blast-fungal'>Fungal BLAST search form</a>.</p>";
			
			if (this.props.blastType == 'fungal') {
			     descText = "<p>This form allows BLAST searches of multiple fungal sequence datasets. To restrict your search to S. cerevisiae with additional BLAST search options, go to the <a href='/blast-sgd'><i>S. cerevisiae</i> BLAST search form</a>.</p>";
			}
				
			return (<div>
			        <div dangerouslySetInnerHTML={{ __html: descText}} />
				<form onSubmit={this._onSubmit} target="search_result">
					<div className="row">
                        		     <div className="large-12 columns">
                               		     	  { commentBoxNode }
                               			  { submitNode }
						  { seqBoxNode }
						  { blastProgramNode }
						  { databaseNode }
						  { submitNode }
						  { optionNode }
                   		             </div>
                                       </div>
				</form>
			</div>);
		}
	},


	_getSubmitNode: function() {
               
                return(<div>
                      <p><input type="submit" value="Run NCBI-BLAST" className="button secondary"></input> OR  <input type="reset" value="Select Defaults" className="button secondary"></input>
		      </p>
                </div>);

        },

	_getSeqBoxNode: function(seq) {
                return (<div>
                        { this._submitNode }     
                        <p><h3>Upload Local TEXT File: FASTA, GCG, and RAW sequence formats are okay</h3></p>
                        WORD Documents do not work unless saved as TEXT. 
                        <input className="btn btn-default btn-file" type="file" name='uploadFile' onChange={this._handleFile} accept="image/*;capture=camera"/>
                        <p><h3>Type or Paste a Query Sequence : (FASTA or RAW format, or No Comments, Numbers are okay)</h3></p>
                        <textarea ref='sequence' onChange={this._onChange} value={seq} rows='5' cols='50'></textarea><p></p>
                </div>);   
	},


        _getDatabaseNode: function(data) {

                var database = data.database;
		var datagroup = data.datagroup;
                var _databaseDef = data.databasedef;
		if (this.state.seqType == 'protein') {
		       _databaseDef = ['YeastORF'];
		}
                var i = 0;
                var _elements = _.map(database, d => {
                       i += 1;
		       var dataset = d.dataset;
		       if (dataset.match(/^label/)) {
		       	  dataset = datagroup[dataset];
		       }
                       
		       if($.inArray(dataset, _databaseDef) > -1) {
                            return <option value={dataset} selected='selected'>{d.label}</option>;
                       }
                       else {
                            return <option value={dataset}>{d.label}</option>;
                       }
                });

                return(<div>
                       <p><h3>Choose one or more Sequence Datasets:</h3></p> 
                       Select or unselect multiple datasets by pressing the Control (PC) or Command (Mac) key while clicking. Selecting a category label selects all datasets in that category.
                       <p><select ref='database' id='database' onChange={this._onChange} size={i} multiple>{_elements}</select></p>
                </div>);
                                        
        },

        _getOptionsNode: function(data) {

                var outFormatMenu = this._getOutFormatMenu();
                var matrixMenu = this._getMatrixMenu(data);
                var cutoffMenu = this._getCutoffScoreMenu();
                var wordLengthMenu = this._getWordLengthMenu();
                var thresholdMenu = this._getThresholdMenu();
                var alignToShowMenu = this._getAlignToShowMenu();
                var filterMenu = this._getFilterMenu();

                return(<div>
                       <b>Options:</b> For descriptions of BLAST options and parameters, refer to the BLAST documentation at NCBI.<br></br>
                       <div class="col-lg-4 col-lg-offset-4">
                             <table width="100%">
                                  <tbody>
                                      <tr><th>Output format:</th><td>{outFormatMenu}</td><td><br></br></td></tr>
                                      <tr><th>Comparison Matrix:</th><td>{matrixMenu}</td><td><br></br></td></tr>
                                      <tr><th>Cutoff Score (E value):</th><td>{cutoffMenu}</td><td><br></br></td></tr>
                                      <tr><th>Word Length (W value):</th><td>{wordLengthMenu}</td><td>Default = 11 for BLASTN, 3 for all others</td></tr>
                                      <tr><th>Expect threshold (E threshold):</th><td>{thresholdMenu}</td><td><br></br></td></tr>
                                      <tr><th>Number of best alignments to show:</th><td>{alignToShowMenu}</td><td><br></br></td></tr>
                                      <tr><th>Filter options:</th><td>{filterMenu}</td><td>DUST file for BLASTN, SEQ filter for all others</td></tr>    
                                  </tbody>
                            </table>
                       </div>
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

        _onChange: function(e) {
                this.setState({ text: e.target.value});
        },

	_getConfigData: function(db) {
                var jsonUrl = PATMATCH_URL + "?conf=";
                if (db == 'sgd') {
                      jsonUrl = jsonUrl + "blast-sgd";
                }
                else {
                      jsonUrl = jsonUrl + "blast-fungal";
                }
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

		var queryComment = this.refs.queryComment.value.trim();
		var seq = this.refs.sequence.value.trim();
		if (seq == '') {
		    seq = this.state.uploadedSeq;
		}
		var program = this.refs.program.value.trim();
		var dbs = document.getElementById('database');
		var database = '';
		for (var i = 0; i < dbs.options.length; i++) {
		     if (dbs.options[i].selected) {
		     	 if (database) {
			      database = database + ' ' + dbs.options[i].value;
			 }
			 else {
			      database = dbs.options[i].value;
			 }
		     }
		}
		
                var outFormat = this.refs.outFormat.value;
                var matrix = this.refs.matrix.value;
                var cutoffScore = this.refs.cutoffScore.value;
                var wordLength = this.refs.wordLength.value;
                var threshold = this.refs.threshold.value;
                var alignToShow = this.refs.alignToShow.value;
		var filter = 'on';
		if (document.getElementById('Off').checked) {
		     filter = '';
		}
		seq = this._cleanUpSeq(seq);

		var newDatabase = this._checkParameters(seq, 
		    	      			      	program, 
		    	      			        database, 
						        wordLength, 
						        cutoffScore);

		if (newDatabase) {
		    database = newDatabase;
		    window.localStorage.clear();
		    window.localStorage.setItem("seq", seq);
		    window.localStorage.setItem("program", program);
		    window.localStorage.setItem("database", database);
		    window.localStorage.setItem("outFormat", outFormat);
		    window.localStorage.setItem("matrix", matrix);
		    window.localStorage.setItem("cutoffScore", cutoffScore);
		    window.localStorage.setItem("wordLength", wordLength);
		    window.localStorage.setItem("threshold", threshold);
		    window.localStorage.setItem("alignToShow", alignToShow);
		    window.localStorage.setItem("filter", filter);
		}
		else {
		    e.preventDefault();
		    return 1; 
		}

	},

	_doPatmatch: function() {

		var seq = window.localStorage.getItem("seq");
		var program = window.localStorage.getItem("program");
		var database = window.localStorage.getItem("database");
		var outFormat = window.localStorage.getItem("outFormat");
                var matrix = window.localStorage.getItem("matrix");
                var cutoffScore = window.localStorage.getItem("cutoffScore");
                var wordLength = window.localStorage.getItem("wordLength");
                var threshold = window.localStorage.getItem("threshold");
                var alignToShow = window.localStorage.getItem("alignToShow");
                var filter = window.localStorage.getItem("filter");

		$.ajax({
			url: PATMATCH_URL,
			data_type: 'json',
			type: 'POST',
			data: { 'seq':         seq,
			        'program':     program,
				'database':    database,
				'outFormat':   outFormat,
				'matrix':      matrix,
				'threshold':   threshold,
				'cutoffScore': cutoffScore,
				'alignToShow': alignToShow,
				'wordLength':  wordLength,
				'filter':      filter,
				'blastType':   this.props.blastType
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


	_checkParameters: function(seq, program, database, wordLength, cutoffScore) {
	
                // check sequence
                // get seq from the box or from upload file and remove unwanted characters
                if (!seq) {
                     alert("Please enter a sequence");
                     return 0;
                }


		// check database
		if (database == '-') {
		   alert("Please select a database.");
		   return 0;
		}

		// check sequence length and cutoffScore (s) value
		// if (cutoffScore != 'default' && cutoffScore < 60 && seq.length > 100) {
		//     alert("The maximum sequence length for an S value less than 60 is 100. Please adjust either the S value or sequence");
		//     return 0;
		// }		

		// check sequence length and wordlength
		if (program == 'blastn' && wordLength != 'default' && 
		    wordLength < 11 && seq.length > 10000) {
		    alert("The maximum sequence length for a word length of less than 11 is 10000. Please fix either word length or sequence.");
		    return 0;
		}

		// check database and program to make sure they match...
		
		var configData = this.state.configData;		
		var programs = configData.program;
		var datasets = configData.database;
		
		var programType = "";
		 _.map(programs, p => {
	             if (p.script == program) {
		      	  programType = p.type;
		     }
		});
		
		var dbType = {};
		_.map(datasets, d => {
		     dbType[d.dataset] = d.type;
		});		

		database = database.replace(/\,/g, " ");

		var dblist = database.split(" ");
		var goodDatabase = "";
		var badDatabase = "";
		var good = 0;
		var removed = 0;
		var databaseType = "";
		var foundDB = {};
		dblist.forEach( function(d) {
		    if (dbType[d] == 'both' || dbType[d] == programType) {
		        if (foundDB[d] == undefined) {
		             if (goodDatabase) {
			     	  goodDatabase = goodDatabase + " ";
			     }
		             goodDatabase = goodDatabase + d;
			     good += 1;
			} 
		    }
		    else {
		    	removed += 1;
			badDatabase = badDatabase + " " + d;
			databaseType = dbType[d];
		    }
		    foundDB[d] = 1;
                });
		
		if (removed >= 1) {
		    if (databaseType) {
		        if (databaseType == 'dna') {
			    databaseType = 'DNA';
			}
			if (programType == 'dna') {
			    programType = 'DNA';
			}
		        if (removed > 1) {
		            badDatabase = badDatabase.replace(/ /g, ", ");
			    badDatabase = badDatabase.replace(/^, /, "");
			    alert("The following datasets contain " + databaseType + " sequence and thus do not work with " + program.toUpperCase() + ", which requires " + programType + " sequences: " + badDatabase + "\n\n" + "Click OK to see results with these datasets excluded.");
		        }
			else {
			    alert("The following dataset contains " + databaseType + " sequence and thus does not work with " + program.toUpperCase() + ", which requires " + programType + " sequences: " + badDatabase + "\n\n" + "Click OK to see results with this dataset excluded.");
                        }
		    }
		    if (!goodDatabase) {
		    	alert("Your choice of datasets does not include one that is appropriate for " + program + ". BLASTP and BLASTX require a protein sequence database and other BLAST programs require a nucleotide sequence database. Adjust either the program or database selection before submitting your search.");
			return 0;

		    }
		}
		
		return goodDatabase;
		
	},

});

module.exports = SearchForm;
