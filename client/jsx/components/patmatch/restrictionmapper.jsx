import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require("../widgets/data_table.jsx");
const Params = require("../mixins/parse_url_params.jsx");
const RestBarChart = require("./restmap_bar_chart.jsx");

const style = {
      textFontRed: { fontSize: 18, color: 'red' },
      textFont: { fontSize: 18 }
};

const MAX_NUM_ENZYME = 15;

const restUrl = "/run_restmapper";

const RestrictionMapper = React.createClass({

	getInitialState() {
	        
		var param = Params.getParams();
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			gene: '',
			seq: '',
			resultData: {},
			notFound: null,
			param: param
		};
	},

	render() {	
	
		var page_to_display = this.getPage();
		
		return (<div>
			  <span style={{ textAlign: "center" }}><h1>Yeast Genome Restriction Analysis<a target="_blank" href="https://sites.google.com/view/yeastgenome-help/analyze-help/restriction-mapper?authuser=0"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			  <hr /></span>
			  {page_to_display}
			</div>);
				 
	},

	componentDidMount() {
		var param = this.state.param;
	        if (param['gene']) {
	              this.runRestTools('name');
	        }
		else if (param['seq']) {
                      this.runRestTools('seq');
                }
	},

	getPage() {
		
		var param = this.state.param;

		if (param['gene'] && param['seq']) {
                     return <div><span style={ style.textFont }>Enter either a gene name or a DNA sequence.</span></div>
                }

	        if (this.state.isComplete) {

			var data = this.state.resultData;
			var notCutEnzymeTable = "";
			if (param['type'] == 'all') {
			     notCutEnzymeTable = this.getNotCutEnzymeTable(data['notCutEnzyme']);
			}
			var cuts = data['data'];
			var seqLength = data['seqLength'];
			
			if (seqLength == 0) {
			    var message = "";
			    if (param['gene']) {
			         message = "Please enter a single valid gene name.";
			    }
			    else {
			    	 message = "Please enter a valid DNA sequence.";
			    }
			    return <div><span style={ style.textFont }>{ message }</span></div>
			}

			var desc = this.getDesc(data['seqName'], seqLength, data['chrCoords']);
			 
			var graphNode = (<RestBarChart 
                                data={cuts}
				seqLength={seqLength}
                        />);
			
			var graphStyle = { width: "1000", marginLeft: "auto", marginRight: "auto" };
             		
			return (<div>
                               <div className="row">
			       	    <p dangerouslySetInnerHTML={{ __html: desc }} />
				    <div>
					<table style={graphStyle}>
					       <tr><td>{graphNode}</td></tr>
					</table>
				    </div>
                                    <p>{ notCutEnzymeTable }</p>
                               </div>
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
		        if (param['gene'] || param['seq']) {
			     return <p>Please wait while we retrieve the requested information.</p>; 

			}
			
			return this.getFrontPage();
			
		}
	},

	getFrontPage() {

		var geneNode = this.getGeneNode();
		var seqNode = this.getSeqNode();
		var enzymeNode = this.getEnzymeNode();
		var submitNode = this.getSubmitNode();

		var searchSection = { headers: [[<span style={ style.textFont }><strong>Step 1: Enter a Gene Name</strong></span>, <span style={ style.textFontRed }><strong>OR</strong></span>, <span style={ style.textFont }><strong>Type or Paste a DNA Sequence</strong></span>]],
			    	     rows:    [[geneNode, '', seqNode], [enzymeNode, '', submitNode]] };
				     					
		return (<div>
			<div><span style={ style.textFont }>This form allows you to perform a restriction analysis by entering a sequence name or arbitrary DNA sequence.</span></div>
			<p></p>
			<div className="row">
			     <div className="large-12 columns">
			     	  <form onSubmit={this.onSubmit} target="infowin">
				        <DataTable data={searchSection} />
			          </form>
			     </div>
			</div>
		</div>);

	},

	getGeneNode() {
			  
                return (<div style={{ textAlign: "top" }}>
			<p>Enter a single standard gene name (or ORF or SGDID); note that other<br></br>
			   feature types (such as RNAs, CENs or ARSs) are not supported. Example: <br></br>
			   SIR2, YHR023W, or SGD:S000000001.
			<input type='text' name='gene' ref='gene' onChange={this._onChange}  size='50'></input>
			</p>
                </div>);

        },

	getSeqNode() {
		     
		var param = this.state.param;

		var seqID = param['sequence_id'];
	
		var sequence = window.localStorage.getItem(seqID);

		return(<div>
                       <textarea ref='seq' name='seq' value={sequence} onChange={this.onChange} rows='5' cols='75'></textarea>
		       Only DNA sequences containing A, G, C, and T are allowed. Any other characters will be removed automatically before analysis. 
                </div>);    

	},

	getEnzymeNode() {

                var enzymes = ["all", "3'overhang", "5'overhang", "blunt end", "cut once", "cut twice", "Six-base cutters"];

                var _elements = _.map(enzymes, e => {
                       if (e == 'all') {
                            return <option value={ e } selected="selected">{ e }</option>;
                       }
                       else {
                            return <option value={ e }>{ e }</option>;
                       }
                });

                return(<div>
                       <span style={ style.textFont }><strong>Step2: Choose Restriction Enzyme Set: </strong></span>
                       <p><select ref='type' name='type' onChange={this.onChange}>{_elements}</select>
		       <font color='red'>Note</font>: To find enzymes that do not cut, choose 'all' and see the resulting list at bottom.</p>
                </div>);

        },

	getSubmitNode: function() {

		       return(<div>
                      <p><input type="submit" value="DISPLAY MAP" className="button secondary"></input><input type="reset" value="RESET FORM" className="button secondary"></input>
                      </p>
                </div>);

        },

	getNotCutEnzymeTable(notCutEnzymes) {

		var tableRows = [];
		var cells = []
		var headers = []
		var headerDone = 0;
		var i = 0;
		_.map(notCutEnzymes, e => {
		     if (i == MAX_NUM_ENZYME) {
		     	 tableRows.push(cells);
			 cells = [];
			 i = 0;
			 headerDone = 1;
		     }
		     cells.push(e);
		     if (headerDone == 0) {
		     	headers.push('');
		     }
		     i = i + 1;
		     
		});

		if (i != 0) {
		     for (var j = i; j < MAX_NUM_ENZYME; j++) {
		     	 cells.push(" ");
		     }
		     tableRows.push(cells);
		}
	
		var notCutTable = { headers: [headers],
                                     rows:   tableRows };

	        return(<div>
		       <center>
                       <span style={ style.textFont }><strong>Enzymes that do not cut: </strong></span>
		       <DataTable data={notCutTable} />
		       </center>
                </div>);

	},


        onChange(e) {
                this.setState({ text: e.target.value});
        },

	runRestTools(searchType) {

		var paramData = {};
		
		var param = this.state.param;
		
		paramData['type'] = param['type'];

		if (searchType == 'seq') {
		   var seq = param['seq'];
		   seq = seq.replace(/%0D/g, '');
		   seq = seq.replace(/%0A/g, '');
		   // seq = seq.toUpperCase().replace(/[^A-Z]/g, '');
		   seq = seq.toUpperCase().replace(/[^ATCG]/g, '');
		   paramData['seq'] = seq;
		   this.sendRequest(paramData)
                   return
		}		

		if (searchType == 'name') {
		   var gene = param['gene'];
		   gene = gene.replace("SGD:", "");
		   gene	= gene.replace("SGD%3A", "");
		   paramData['name'] = gene;
		   this.sendRequest(paramData)
                   return		   
		}		
 		
	},
	
	sendRequest(paramData) {
        	
		$.ajax({
			url: restUrl,
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

	getDesc(seqName, seqLength, chrCoords) {
	
		if (seqName == 'Unnamed') {
		     return "<center><h3>The unnamed sequence (sequence length: " + seqLength + ")</h3></center>";
		}
		else {
		     return "<center><h3>The genomic sequence for <font color='red'>" + seqName + "</font>, " + chrCoords + " (sequence length: " + seqLength + ")</h3></center>";
		}
	}
	
});

module.exports = RestrictionMapper;

