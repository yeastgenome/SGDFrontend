import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

// const DataTable = require("../widgets/data_table.jsx");

const Checklist = require("../widgets/checklist.jsx");
const Params = require("../mixins/parse_url_params.jsx");

const SeqtoolsUrl = "/run_seqtools";


// const LETTERS_PER_CHUNK = 10;
// const LETTERS_PER_LINE = 60;

var SearchForm = React.createClass({

	getInitialState: function () {
	        
		var param = Params.getParams();
		
		var submitted = null;				
		if (param['chr'] || param['genes'] || param['seq']) {
		     submitted = 1;
		}

		return {
			isComplete: false,
			isPending: false,
			userError: null,
			genome: 'S288C',
			seqtype: 'pep',
			genes: null,
			strains: null,
			up: null,
			down: null,
			chr: null,
			start: null,
			end: null,
			seq: null,
			resultData: {},
			param: param,
			didSeqAnal: 0,
			submitted: submitted
		};
	},

	render: function () {	
	
		var formNode = this._getFormNode();
		
		return (<div>
			  <span style={{ textAlign: "center" }}><h1>Gene/Sequence Resources <a target="_blank" href="https://sites.google.com/view/yeastgenome-help/sequence-help/genesequence-resources"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			  <hr /></span>
			  {formNode}
			</div>);
		
		 
	},

	componentDidMount: function () {
	        if (this.state.submitted) {
	              this._runSeqTools();
	        }
	},

	_getFormNode: function () {
		
	        if (this.state.isComplete) {

			var data = this.state.resultData;

			
			var _resultTable = this._getResultTable(data);

		       	// return (<div>
			//	     <p><center>{_resultTable}</center></p>
			//	     <p><center><blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}><a href={downloadUrl}>Download Full Results</a></blockquote></center></p>
			//       </div>);			

		} 
		else if (this.state.isPending) {

		        return (<div>
			       <div className="row">
			       	    <p><b>Something wrong with your search!</b></p>
			       </div>
			</div>);
			
		}
		else {

		        if (this.state.submitted) {
			     return <p>Please wait... The search may take a while to run.</p>; 

			}
			
			var geneNode = this._getGeneNode();
			var chrNode = this._getChrNode(); 
			var seqNode = this._getSeqNode();
			
			var descText = "<p>Try <a target='infowin' href='https://yeastmine.yeastgenome.org/yeastmine/begin.do'>Yeastmine</a> for flexible queries and fast retrieval of chromosomal features, sequences, GO annotations, interaction data and phenotype annotations. The video tutorial <a target='infowin' href='https://vimeo.com/28472349'>Template Basics</a> describes how to quickly retrieve this type of information in YeastMine. To find a comprehensive list of SGD's tutorials describing the many other features available in YeastMine and how to use them, visit SGD's <a target='infowin' href='https://sites.google.com/view/yeastgenome-help/video-tutorials/yeastmine?authuser=0'>YeastMine Video Tutorials</a> page. </p><p>This resource allows retrieval of a list of options for accessing biological information, table/map displays, and sequence analysis tools for 1. a named gene or sequence. 2. a specified chromosomal region, or 3. a raw DNA or protein sequence.</p>";
							
			return (<div>
			        <div dangerouslySetInnerHTML={{ __html: descText}} />
				<form onSubmit={this._onSubmit} target="infowin">
					<div className="row">
                        		     <div className="large-12 columns">
                               		     	  { geneNode }
                   		             </div>
                                       </div>
				</form>
			</div>);
		}
	},
	
	_getGeneNode: function() {

		var reverseCompNode = this._getReverseCompNode('rev1');
		var strainNode = this._getStrainNode();
		var seqtypeNode = this._getSeqtypeNode('seqtype1');

                return (<div>
                        <h3>1. Enter a list of Gene/ORF name or SGDID:</h3>
			<p>(space delimited gene list eg. ACT1 YHR023W SGD:S000000001)</p> 
			<textarea ref='genes' name='genes' onChange={this._onChange} rows='1' cols='50'></textarea>
			<p>Pick one or more strains:<br></br>Select or unselect multiple strains by pressing the Control (PC) or Command (Mac) key while clicking.</p>
			{ strainNode }
			<h3>Pick a sequence type:</h3>
			{ seqtypeNode }
			<p><b>If available,</b> add flanking basepairs</p>
			<p>upstream</p>
			<textarea ref='up' name='up' onChange={this._onChange} rows='1' cols='50'></textarea>
			<p>and downstream</p>
			<textarea ref='down' name='down' onChange={this._onChange} rows='1' cols='50'></textarea>
			{ reverseCompNode }
                </div>);

        },
	
	_getChrNode: function() {
		 
		var chr2num = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 
		    	      	'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12,
				'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'Mito': 17 }; 
		    	      
                var chromosomes = Object.keys(chr2num);

                var _elements = _.map(chromosomes, c => {
                       if (c == 'I') {
                            return <option value={ chr2num[c] } selected="selected">{ c }</option>;
                       }
                       else {
                            return <option value={ chr2num[c] }>{ c }</option>;
                       }
                });
		
		var reverseCompNode = this._getReverseCompNode('rev2');

                return(<div>
                       <h3>2. Pick a chromosome: </h3>
                       <p><select ref='chr' name='chr' onChange={this._onChangeGenome}>{_elements}</select></p>
		       <br>Then enter coordinates (optional)</br>
		       <textarea ref='start' name='start' onChange={this._onChange} rows='1' cols='50'></textarea>
		       <br>to</br>
                       <textarea ref='end' name='end' onChange={this._onChange} rows='1' cols='50'></textarea>
		       <p>The entire chromosome sequence will be displayed if no coordinates are entered.</p>
		       <p><b>Note</b>: Enter coordinates in ascending order for the Watson strand and descending order for the Crick strand.</p>
		       { reverseCompNode }
                </div>);
 		 
	},

	_getSeqNode: function() {

		var seqtypeNode = this._getSeqtypeNode('seqtype3');
		var reverseCompNode = this._getReverseCompNode('rev3');

		return(<div>
                       <h3>3. Type or Paste a: </h3>
		       { seqtypeNode }
		       <p>Sequence:</p>
                       <textarea ref='seq' name='seq' onChange={this._onChange} rows='10' cols='50'></textarea>
                       <p>The sequence <b>MUST</b> be provided in RAW format, no comments (numbers are okay).</p>
                       { reverseCompNode }
                </div>);    

	},

	_getSeqtypeNode: function(name) {

		var _elements = [];
               	_elements.push(<option value='DNA' selected="selected">DNA</option>);
               	_elements.push(<option value='Protein'>Protein</option>);
                
		return(<div>
                      <p><select name={name} ref={name} onChange={this._onChangeSeqtype}>{_elements}</select></p>
                </div>);

	},

	_getReverseCompNode: function(name) {

	        return (<div>
		       <p><input ref={name} id={name} type="checkbox" /> Use the reverse complement</p> 
		       </div>);

        },

	_getSubmitNode: function() {
               
                return(<div>
                      <p><input type="submit" value="Submit Form" className="button secondary"></input> OR  <input type="reset" value="Reset Form" className="button secondary"></input>
		      </p>
                </div>);

        },

	_getStrainNode: function() {

                var strain2label = { 'S288C':      'S. cerevisiae Reference Strain S288C',
		    		     'CEN.PK':     'S. cerevisiae Strain CEN.PK2-1Ca_JRIV01000000',
				     'D273-10B':   'S. cerevisiae Strain D273-10B_JRIY00000000', 
				     'FL100':      'S. cerevisiae Strain FL100_JRIT00000000',
				     'JK9-3d':     'S. cerevisiae Strain JK9-3d_JRIZ00000000',
				     'RM11-1a':    'S. cerevisiae Strain RM11-1A_JRIP00000000',
				     'SEY6210':    'S. cerevisiae Strain SEY6210_JRIW00000000', 
				     'Sigma1278b': 'S. cerevisiae Strain Sigma1278b-10560-6B_JRIQ00000000', 
				     'W303':       'S. cerevisiae Strain W303_JRIU00000000', 
				     'X2180-1A':   'S. cerevisiae Strain X2180-1A_JRIX00000000', 
				     'Y55':	   'S. cerevisiae Strain Y55_JRIF00000000' 
		    		   };

		var strains = Object.keys(strain2label)

                var _elements = _.map(strains, s => {
                       var label = strain2label[s];
                       if(s == 'S288C') {
                            return <option value={s} selected='selected'>{label}</option>;
                       }
                       else {
                            return <option value={s}>{label}</option>;
                       }
                });

                return(<div>
                       <p><select ref='strains' id='strains' onChange={this._onChange} size='11' multiple>{_elements}</select></p>
                </div>);

        },

        _onChange: function(e) {
                this.setState({ text: e.target.value});
        },

	_runSeqTools: function() {

	        var param = this.state.param;

		paramData = {};

		var genes = param['genes'];
		if (typeof(genes) != "undefined") {
		   paramData['genes'] = genes.join(":")
		   var strains = param['strains']
		   if (typeof(strains) != "undefined") {
		      paramData['strains'] = param['strains'].join(":")
		   }
		   else {
		      paramData['strains'] = 'S288C'
		   }
		   if (typeof(param['up']) != "undefined") {
		      this._checkNumber(param['up'])
		      paramData['up'] = param['up']
		   }
		   if (typeof(param['down']) != "undefined") {
		      this._checkNumber(param['down'])
                      paramData['down'] = param['down']
		   }   
		   paramData['seqtype'] = param['seqtype1']
		   paramData['rev'] = param['rev1']
		   this._sendRequest(paramData)
		   return
		}
		
		if (tyoeof(param['chr']) != "undefined") {
		   paramData['chr'] = param['chr']
		   if (typeof(param['start']) != "undefined") {
		      this._checkNumber(param['start'])
                      paramData['start'] = param['start']
                   }
		   if (typeof(param['end']) != "undefined") {
		      this._checkNumber(param['end'])
                      paramData['end'] = param['end']
		   }
		   paramData['rev'] = param['rev2']
		   this._sendRequest(paramData)
                   return
		}

		if (typeof(param['seq']) != "undefined") {
		   paramData['seq'] = param['seq']
		   paramData['seqtype'] = param['seqtype3']
		   paramData['rev'] = param['rev3']
		   this._sendRequest(paramData)
                   return
		}		
   		
	},

	_checkNumber: function(num) {

		if (isNaN(num)) {
		   alter("Please enter a number");
		}

	},

	_sendRequest: function(paramData) {

		$.ajax({
			url: PatmatchUrl,
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

	}

});

module.exports = SearchForm;
