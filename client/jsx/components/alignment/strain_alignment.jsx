import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require("../widgets/data_table.jsx");
const Params = require("../mixins/parse_url_params.jsx");

const alignUrl = "/get_alignment";

const StrainAlignment = React.createClass({

	getInitialState() {
	        
		var param = Params.getParams();
		
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			type: 'protein',
			resultData: {},
			notFound: null,
			locus: param['locus'],
			type: param['type'],
			param: param
		};
	},

	render() {	
	
		var page_to_display = this.getPage();
		
		if (this.state.isComplete) {

		     var data = this.state.resultData;
                     var displayName = data['displayName'];

		     return (<div>
                          <span style={{ textAlign: "center" }}><h1> { displayName } <i>S. cerevisiae</i> Strain Sequence Alignment<a target="_blank" href="https://sites.google.com/view/yeastgenome-help/sequence-help/align-strain-sequences"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
                          </span>
                          {page_to_display}
                        </div>);
		}
		else {
		     return (<div>
		             <span style={{ textAlign: "center" }}><h1>Search for Sequence Alignment pages at SGD<a target="_blank" href="https://sites.google.com/view/yeastgenome-help/sequence-help/align-strain-sequences"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			  </span>
                          {page_to_display}
			 </div>);
		}
			
		 
	},

	componentDidMount() {
		if (this.state.locus) {
	              this.runAlignTools();
	        }				      
	},

	getPage() {
		
		var param = this.state.param;

	        if (this.state.isComplete) {

		        var data = this.state.resultData;
                        var images_url = data['dendrogram_url'];
		        var treeImage = "<center><img src=" + images_url + "></img></center>";
			var alignment = data['alignment']
			var searchBox = this.getFrontPage() 			
			var seqSection = "<pre>" + data['seqs'] + "</pre>";
			var downloadSeqSection = this.getDownloadSeqSection();
			return (<div>
			       <p dangerouslySetInnerHTML={{ __html: treeImage }} />
			       { searchBox }
			       <p dangerouslySetInnerHTML={{ __html: alignment }} />
			       { downloadSeqSection }
			       <p dangerouslySetInnerHTML={{ __html: seqSection }} />
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

		        if (param['locus']) {
			     return <p>Please wait while we retrieve the requested information.</p>; 
			}

			return this.getFrontPage();
			
		}
	},

	getFrontPage() {

		var submitBox = this.submitBox();
		var seqTypeBox = this.getSeqTypeBox();
		var geneBox = this.getGeneBox();

		var _searchSection = { headers: [['', '', '']],
                            rows:    [[geneBox, seqTypeBox, submitBox]] };
	
	        return (<div>
		        <center>
			    <form method='GET' onSubmit={this.onSubmit}>
		      		<DataTable data={_searchSection} />
                	    </form>
			</center>
			</div>);

	},

	submitBox() {

                return (<div>
                       <br></br><input type="submit" ref='submit' name='submit' value="Submit" className="button secondary"></input>
                       </div>);

        },

	// we can delete the following if only submit box is ok
	submitReset() {

		return (<div>
		       <p><input type="submit" ref='submit' name='submit' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset' name='reset' value="Reset Form" className="button secondary"></input></p>
		       </div>);

	},

	getSeqTypeBox() {

	       var _elements = [];
	       if (this.state.type == 'dna') {
	       	   _elements.push(<option value='protein' selected="selected">Protein</option>);
              	   _elements.push(<option value='dna'>DNA</option>);
	       }
	       else {
	       	   _elements.push(<option value='protein'>Protein</option>);
                   _elements.push(<option value='dna' selected="selected">DNA</option>);
	       }
		   
               return(<div>
		      <h3>Pick sequence type:</h3>
                      <select name='type' ref='type' onChange={this.onChange2}>{_elements}</select>
                </div>);
	},

	getGeneBox() {

	       if (this.state.locus) {
	       	    return (<div>
				<h3>Enter a gene name/systematic name/SGDID:</h3>
			    	<input type='text' ref='locus' name='locus' value={ this.state.locus } onChange={this.onChange} size='50'></input>
                           </div>);
	       }
	       else {
	       	    return (<div>
			        <h3>Enter a gene name/systematic name/SGDID:</h3>
                            	<input type='text' ref='locus' name='locus' size='50'></input>
                            </div>);
	       }		     
        },

	getDownloadSeqSection() {

	      var downloadUrl = alignUrl + "?locus=" + this.state.locus + "&download=1&type=" + this.state.type ;
	  
	      return (<div>
	      	     <hr></hr>
		     <span style={{ fontSize: 18 }}><a href={ downloadUrl }>DOWNLOAD</a> all sequences in alignment, in FASTA format. GCG format sequences are displayed below.</span><p></p>
		     <hr></hr>
	      </div>);

	},

        onChange(e) {
                this.setState({ locus: e.target.value});
        },

	runAlignTools() {

		var paramData = {};

		var param = this.state.param;
		
		paramData['locus'] = param['locus']
		paramData['type'] = param['type'];
		
		this.sendRequest(paramData)

		return
		 		
	},
	
	sendRequest(paramData) {

		$.ajax({
			url: alignUrl,
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

export default StrainAlignment;

