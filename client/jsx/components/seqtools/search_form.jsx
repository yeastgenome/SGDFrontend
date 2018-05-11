import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require("../widgets/data_table.jsx");
const Checklist = require("../widgets/checklist.jsx");
const Params = require("../mixins/parse_url_params.jsx");
const MultiSequenceDownload = require("./multi_sequence_download.jsx");

const SeqtoolsUrl = "/run_seqtools";

// const LETTERS_PER_CHUNK = 10;
// const LETTERS_PER_LINE = 60;

const SearchForm = React.createClass({

	getInitialState: function () {
	        
		var param = Params.getParams();
		
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			seqtype: 'DNA',
			genes: null,
			strains: null,
			strain: 'S288C',
			up: null,
			down: null,
			chr: null,
			start: null,
			end: null,
			seq: null,
			rev: 'off',
			resultData: {},
			notFound: null,
			param: param,
			didSeqAnal: 0,
			submitted: param['submit'],
			submitted2: param['submit2'], 
			submitted3: param['submit3']
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
	              this._runSeqTools('genes');
	        }
		else if (this.state.submitted2) {
                      this._runSeqTools('chr');
                }
		else if (this.state.submitted3) {
                      this._runSeqTools('seq');
                }
	},

	_getFormNode: function () {
		
	        if (this.state.isComplete) {

			var data = this.state.resultData;

			if (this.state.submitted) {
			   
			     var [_geneList, _resultTable] = this._getResultTable4gene(data);
			     var desc = this._getDesc4gene(_geneList);
			     return (<div>
					   <div dangerouslySetInnerHTML={{ __html: desc }} />
			                   <div>{ _resultTable } </div>
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

		        if (this.state.submitted || this.state.submitted2 || this.state.submitted3) {
			     return <p>Please wait... The search may take a while to run.</p>; 

			}

			return this._get_frontpage();
			
		}
	},

	_get_frontpage: function() {
								
		var descText = this._get_text();

		var geneNodeLeft = this._getGeneNodeLeft();
                var geneNodeRight = this._getGeneNodeRight();
                var chrNode = this._getChrNode();
               	var seqNode = this._getSeqNode();

		var _nameSection = { headers: [[<span style={{ fontSize: 20 }}>1. Search a list of genes</span>, '']],
			    	     rows:    [[geneNodeLeft, geneNodeRight]] };

		var _chrSeqSection = { headers: [[<span style={{ fontSize: 20 }}><strong style={{ color: 'red'}}>OR</strong> 2. Search a specified chromosomal region</span>, '', '', <span style={{ fontSize: 20 }}><strong style={{ color: 'red'}}>OR</strong> 3. Analyze a raw DNA or Protein sequence</span>]],
                                       rows:    [[chrNode, '', '', seqNode]] };
					
		return (<div>
			<div dangerouslySetInnerHTML={{ __html: descText}} />
			<div className="row">
			     <div className="large-12 columns">
			     	  <form onSubmit={this._onSubmit} target="infowin">
				        <DataTable data={_nameSection} />
			          </form>
			         <DataTable data={_chrSeqSection} />        
			     </div>
			</div>
		</div>);

	},

	_getResultTable4gene: function(data) {
		
		var [genes, displayName4gene, sgdid4gene, seq4gene, hasProtein4gene, hasCoding4gene, hasGenomic4gene] 
			= this._getDataFromJson4gene(data);
				
		var headerRow = [];
		for (var i = 0; i <= genes.length; i++) {
		    headerRow.push("");
		}
		var geneList = "";
		var rows = [];
		var geneRow = [<span style={{ fontSize: 20}}>Gene Name</span>];
		_.map(genes, gene => {
		    geneRow.push(<span style={{ fontSize: 20 }}>{ displayName4gene[gene] }</span>);
		    if (geneList != "") {
		        geneList += ", ";
	            }
		    geneList += displayName4gene[gene];

		});
		rows.push(geneRow);

		// gene name row

		var locusRow = [<span style={{ fontSize: 20}}>Locus and Homolog Details</span>];
		_.map(genes, gene => { 
		    var sgdUrl = "https://www.yeastgenome.org/locus/" + sgdid4gene[gene];
		    var allianceUrl = "http://www.alliancegenome.org/gene/" + sgdid4gene[gene];
		    locusRow.push(<span style={{ fontSize: 20 }}><a href={ sgdUrl } target='infowin2'>SGD</a> | <a href={ allianceUrl } target='infowin2'>Alliance</a></span>);
		});	
		rows.push(locusRow);


		// check to see if there is seq for any of the genes
		    
		var hasProtein = 0;
                var hasCoding = 0;
                var hasGenomic = 0;
                _.map(genes, gene => {
                     hasProtein += hasProtein4gene[gene];
                     hasCoding  += hasCoding4gene[gene];
                     hasGenomic += hasGenomic4gene[gene];
                });
                var hasSeq = hasProtein + hasCoding + hasGenomic;
		    
		if (hasSeq == 0) {
		     return this._display_gene_table(headerRow, rows)
		}    

	        // browser row

       		var browserRow = [<span style={{ fontSize: 20}}>Genome Display (S288C)</span>];
		_.map(genes, gene => {
                    var url = "https://browse.yeastgenome.org/?loc=" + gene;
                    browserRow.push(<span style={{ fontSize: 20 }}><a href={ url } target='infowin2'>JBrowse</a></span>);
                });
                rows.push(browserRow);		

		// alignment row

		var alignRow = [<span style={{ fontSize: 20}}>Alignment/Variation</span>];
		_.map(genes, gene => {
		     var variantUrl = "https://www.yeastgenome.org/variant-viewer#/" + sgdid4gene[gene].replace("SGD:", "");
		     var strainUrl = "https://www.yeastgenome.org/cgi-bin/FUNGI/alignment.pl?locus=" + gene;
		     var fungalUrl = "https://www.yeastgenome.org/cache/fungi/" + gene + ".html";
		     alignRow.push(<span style={{ fontSize: 20 }}><br><a href={ variantUrl } target='infowin2'>Variant Viewer</a></br><br><a href={ strainUrl } target='infowin2'>Strain Alignment</a></br><br><a href={ fungalUrl } target='infowin2'>Fungal Alignment</a></br></span>);
		});
		rows.push(alignRow);
		
		// sequence download row
		
		var seqDLRow = [];
		if (hasCoding > 0) { 
		     seqDLRow = [<span style={{ fontSize: 20}}><br>Sequence Downloads</br><br>* DNA of Region</br><br>* Coding Sequence of Selected ORF</br><br>* Protein Translation of Selected ORF</br></span>];
		}
		else {
		     seqDLRow = [<span style={{ fontSize: 20}}><br>Sequence Downloads</br><br>* DNA of Region</br></span>];
		}

		var strains = window.localStorage.getItem("strains");
		var rev = window.localStorage.getItem("rev");
		var up = window.localStorage.getItem("up");
		var down = window.localStorage.getItem("down");
		_.map(genes, gene => {
		    var genomicFastaUrl = SeqtoolsUrl + "?format=fasta&type=genomic&genes=" + gene + "&strains=" + strains + "&rev=" + rev + "&up=" + up + "&down=" + down;
		    var genomicGcgUrl = SeqtoolsUrl + "?format=gcg&type=genomic&genes=" + gene + "&strains=" + strains + "&rev=" + rev + "&up=" + up + "&down=" + down;
		    var codingFastaUrl = SeqtoolsUrl + "?format=fasta&type=coding&genes=" + gene + "&strains=" + strains;
                    var	codingGcgUrl = SeqtoolsUrl + "?format=gcg&type=coding&genes=" + gene + "&strains=" + strains;
		    var proteinFastaUrl = SeqtoolsUrl + "?format=fasta&type=protein&genes=" + gene + "&strains=" + strains;
                    var	proteinGcgUrl = SeqtoolsUrl + "?format=gcg&type=protein&genes=" + gene + "&strains=" + strains;
		    if (hasCoding > 0) {
		         seqDLRow.push(<span style={{ fontSize: 20}}><br></br><br><a href={ genomicFastaUrl } target='infowin2'>Fasta</a> | <a href={ genomicGcgUrl } target='infowin2'>GCG</a></br><br><a href={ codingFastaUrl } target='infowin2'>Fasta</a> | <a href={ codingGcgUrl } target='infowin2'>GCG</a></br><br><a href={ proteinFastaUrl } target='infowin2'>Fasta</a> | <a href={ proteinGcgUrl } target='infowin2'>GCG</a></br></span>);
		    }
		    else {
		    	 seqDLRow.push(<span style={{ fontSize: 20}}><br>Batch seuence file</br><br><a href={ genomicFastaUrl } target='infowin2'>Fasta</a> | <a href={ genomicGcgUrl } target='infowin2'>GCG</a></br></span>);
		    } 
	        });
		rows.push(seqDLRow);

		// testing section
		// var downloadTestRow = [<span style={{ fontSize: 20}}>Sequence Download TEST</span>];
		// _.map(genes, gene => {
		//      var s = seq4gene[gene];
		//      var genomicSeq = s['genomic']['S288C'];
		//      // var codingSeq = s['coding']['S288C'];
		//      // var proteinSeq = s['protein']['S288C'];
		//      downloadTestRow.push(this._getDownloadSeqButton(gene, strains, 'genomic')); 
		// });		
		// rows.push(downloadTestRow);
		// end of testing
		
		var ID = up + "_" + down + "_" + rev;
		var seqAnalRow = [<span style={{ fontSize: 20}}>Sequence Analysis</span>];
		_.map(genes, gene => {
		    var s = seq4gene[gene];
		    var seqInfo = s['genomic'];
		    var selectedStrains = Object.keys(seqInfo);
		    _.map(selectedStrains, strain =>  {
		    	  var seqID = gene + "_" + strain + "_" + ID;
			  var seq = seqInfo[strain];
                          window.localStorage.setItem(seqID, seq);
	            });
		    seqAnalRow.push(this._getToolsLinks(gene, strains, ID));
		});		
		rows.push(seqAnalRow);

		return [geneList, this._display_gene_table(headerRow, rows)];		
		
	},

	_getToolsLinks: function(gene, strains, ID) {

		var strainPulldown = this._getStrainPulldown(strains);
		var blastButton = this._getToolButton(gene, '/blast-sgd',  'BLAST', ID);
		var fungalBlastButton = this._getToolButton(gene, '/blast-fungal', 'Fungal BLAST', ID);	
		var primerButton = this._getToolButton(gene, '/primer3', 'Design Primers', ID);
		var restrictionButton = this._getToolButton4post(gene, 'https://www.yeastgenome.org/cgi-bin/PATMATCH/RestrictionMapper', 'Genome Restriction Map');
		return(<div className="row">
                            <div className="large-12 columns">	
                       	    	 { strainPulldown }
		       		 { blastButton } 
		       		 { fungalBlastButton }
		       		 { primerButton } 
		       		 { restrictionButton }
		            </div>
                </div>);

	},


	_getToolButton: function(name, program, button, ID) {

                var strain = this.state.strain;
                var seqID = name + "_" + strain + "_" + ID;
                var seq = window.localStorage.getItem(seqID);

                // <input type="submit" value={ button } className="button small secondary"></input>

                return (<form method="GET" action={ program } target="toolwin">
                                <input type="hidden" name="sequence_id" value={ seqID }  />
                                <input type="submit" value={ button } style={{ color: 'grey', fontSize: 18 }}></input>
                        </form>);



        },

	_getToolButton4post: function(name, program, button) {

		var strain = this.state.strain;
		var seqID = name + "_" + strain;
		var seq = window.localStorage.getItem(seqID);

		// <input type="submit" value={ button } className="button small secondary"></input>
		
		return (<form method="POST" action={ program } target="toolwin">
		                <input type="hidden" name="sequence" value={ seq }  />
                                <input type="submit" value={ button } style={{ color: 'grey', fontSize: 18 }}></input>
                        </form>);

	},

	// _getDownloadSeqButton: function(genes, strains, type) {
        //
	//        // return (<form ref={ genes } method="POST" action="/run_seqtools" key={"hiddenNode_" + genes}>
	//	return (<form method="POST" action="/run_seqtools">
        //                       <input type="hidden" name="format" value='fasta' />
        //                        <input type="hidden" name="type" value={ type } />
        //                        <input type="hidden" name="genes" value={ genes } />
	//			<input type="hidden" name="strains" value={ strains } />
	//			<input type="submit" value="FASTA" className="button secondary"></input>
        //               </form>);
        //
	// },

	_display_gene_table: function(headerRow, rows) {

                var _tableData = {
                     headers: [headerRow],
                     rows: rows
                };

                var _dataTableOptions = {
                     bPaginate: false,
                     bFilter: false,
                     bInfo: false,
                     bSort: false,
                     oLanguage: { "sEmptyTable": "" }
                };

                return <DataTable data={_tableData}  usePlugin={true} pluginOptions={_dataTableOptions} />;			     

	},

	_getDataFromJson4gene: function(data) {
	        
		var genes = Object.keys(data).sort();
		var displayName4gene = {};
		var sgdid4gene = {};
		var hasProtein4gene = {};
		var hasCoding4gene = {};
		var hasGenomic4gene = {};
		var seq4gene = {}
		_.map(genes, gene => {
                      var seqInfo = data[gene];
                      var proteinSeq4strain = {};
                      var codingSeq4strain = {};
                      var genomicSeq4strain = {};
                      var seqTypes = Object.keys(seqInfo);
		      hasProtein4gene[gene] = 0;
		      hasCoding4gene[gene] = 0;
		      hasGenomic4gene[gene] = 0;
                      _.map(seqTypes, seqType => {
                             var strainInfo = seqInfo[seqType];
                             var strains = Object.keys(strainInfo);
                             _.map(strains, strain => {
                                    var strainDetails = strainInfo[strain];
                                    if (typeof(displayName4gene[gene]) == "undefined") {
                                        var display_name = strainDetails['display_name'];
					if (display_name != gene) {
					     displayName4gene[gene] = display_name + "/" + gene;
					}
					else {
					     displayName4gene[gene] = display_name;
					}
					sgdid4gene[gene] = strainDetails['sgdid'];
                                    }
				    // var headline = strainDetails['headline'];
				    // var locus_type = strainDetails['locus_type'];
				    
                                    if (seqType == 'protein') {
                                         proteinSeq4strain[strain] = strainDetails['residue'];
					 hasProtein4gene[gene] += 1;
                                    }
                                    else if (seqType == 'coding_dna') {
                                         codingSeq4strain[strain] = strainDetails['residue'];
					 hasCoding4gene[gene] += 1;
                                    }
                                    else if (seqType == 'genomic_dna') {
                                         genomicSeq4strain[strain] = strainDetails['residue'];
					 hasGenomic4gene[gene] += 1;
                                    }
				    
                             })

                      })

		      seq4gene[gene] = { 'protein': proteinSeq4strain,
		                         'coding': codingSeq4strain,
					 'genomic': genomicSeq4strain }; 
                                         

                });

		return [genes, displayName4gene, sgdid4gene, seq4gene, hasProtein4gene, hasCoding4gene, hasGenomic4gene];
			  
	},


	_onSubmit: function (e) {
		
		var genes = this.refs.genes.value.trim();
		var re = /\+/g;
		genes = genes.replace(re, " ");		
		var re = / +/g;
		genes = genes.replace(re, "|");
		if (genes == '') {
		   alert("Please enter one or more gene names.");
		   e.preventDefault();
                   return 1;
		}
		this.setState({ notFound: "" });
		this._validateGenes(genes);		
		var not_found = this.state.notFound;
		// console.log("not_found="+not_found);
		if (not_found != "") {
		   	// alert("These gene name(s) do not exist in the database: " + not_found);
		        e.preventDefault();
			return 1;
		}

		var up = this.refs.up.value.trim();
                var down = this.refs.down.value.trim();
                if (isNaN(up) || isNaN(down)) {
                   alert("Please enter a number for up & downstream basepairs.");
		   e.preventDefault();
                   return 1;
		}

		var strainList = document.getElementById('strains');
                var strains = '';
		for (var i = 0; i < strainList.options.length; i++) {
                     if (strainList.options[i].selected) {
                         if (strains) {
                              strains = strains + '|' + strainList.options[i].value;
			 }
                         else {
                              strains = strainList.options[i].value;
                         }
                     }
                }

		if (strains == '') {
		   alert("Please pick one or more strains.");
                   e.preventDefault();
                   return 1;
		}	
	
		var rev = this.refs.rev1.value.trim();         // on or off
		
		if (rev == 'off') {
		   rev = '';
		} 		
		
		window.localStorage.clear();
                window.localStorage.setItem("genes", genes);
                window.localStorage.setItem("strains", strains);
		window.localStorage.setItem("rev", rev);
		window.localStorage.setItem("up", up);
                window.localStorage.setItem("down", down);
		
		
	},

	_onSubmit2: function (e) {

                var chr = this.refs.chr.value.trim();		
                if (chr == 0) {
                   alert("Please pick a chromosome.");
                   e.preventDefault();
                   return 1;
		}

		var start = this.refs.start.value.trim();
                var end = this.refs.end.value.trim();
		if (isNaN(start) || isNaN(end)) {
                   alert("Please enter a number for chromosomal coordinates.");
                   e.preventDefault();
                   return 1;
                }

		window.localStorage.setItem("chr", chr);
		window.localStorage.setItem("start", start);
		window.localStorage.setItem("end", end);

		var rev = this.refs.rev2.value.trim();
		if (rev == 'off') {
		   rev = '';
		}
		window.localStorage.setItem("rev", rev);

        },

	_onSubmit3: function (e) {

                var seq = this.refs.seq.value.trim();
                if (seq == '') {
                   alert("Please enter a raw sequence.");
                   e.preventDefault();
                   return 1;
                }
		
		var seqtype = this.refs.seqtype.value.trim();
                var rev = this.refs.rev3.value.trim();
		if (rev == 'off') {
		   rev = '';
		}
				
		window.localStorage.setItem("seq", seq);
		window.localStorage.setItem("seqtype", seqtype);
		
		if (seqtype == 'DNA') {
		   window.localStorage.setItem("rev", rev);
		}
		else {
		   window.localStorage.setItem("rev", '');
		}

        },

	_getGeneNodeLeft: function() {
			  
	        var reverseCompNode = this._getReverseCompNode('rev1');

                return (<div style={{ textAlign: "top" }}>
                        <h3>Enter a list of names:</h3>
			<p>(space-separated gene names (and/or ORF and/or SGDID). Example: ACT1 YHR023W SGD:S000000001) 
			<textarea ref='genes' name='genes' onChange={this._onChange} rows='2' cols='50'></textarea></p>
			<h3><b>If available,</b> add flanking basepairs</h3>
			<p>Upstream: <input type='text' ref='up' name='up' onChange={this._onChange} size='50'></input>
			Downstream: <input type='text' ref='down' name='down' onChange={this._onChange} size='50'></input></p>
			{ reverseCompNode }			
                </div>);

        },
	
	_getGeneNodeRight: function() {

                var strainNode = this._getStrainNode();

                return (<div>
                        <h3>Pick one or more strains:</h3>
                        { strainNode }
			<p><input type="submit" ref='submit' name='submit' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset' name='reset' value="Reset Form" className="button secondary"></input></p>
                </div>);

        },

	_getChrNode: function() {
		 		    	      
		var chr2num = { '-- choose a chromosome --': 0, 
		    	        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
                                'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12,
                                'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'Mito': 17 };

                var chromosomes = Object.keys(chr2num);

                var _elements = _.map(chromosomes, c => {
                       if (chr2num[c] == 0) {
                            return <option value={ chr2num[c] } selected="selected">{ c }</option>;
                       }
                       else {
                            return <option value={ chr2num[c] }>{ c }</option>;
                       }
                });
		
		var reverseCompNode = this._getReverseCompNode('rev2');

                return(<div>
		       <form onSubmit={this._onSubmit2} target="infowin">
                       <h3>Pick a chromosome: </h3>
                       <p><select ref='chr' name='chr' onChange={this._onChangeGenome}>{_elements}</select></p>
		       <p>Then enter coordinates (optional)
		       <input type='text' ref='start' name='start' onChange={this._onChange} size='50'></input></p>
		       <p>to
                       <input type='text' ref='end' name='end' onChange={this._onChange} size='50'></input></p>
		       <p>The entire chromosome sequence will be displayed if no coordinates are entered.</p>
		       <p><b>Note</b>: Enter coordinates in ascending order for the Watson strand and descending order for the Crick strand.</p>
		       { reverseCompNode }
		       <p><input type="submit" ref='submit2' name='submit2' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset2' name='reset2' value="Reset Form" className="button secondary"></input></p>
		       </form>
                </div>);
 		 
	},

	_getSeqNode: function() {

		var seqtypeNode = this._getSeqtypeNode();
		var reverseCompNode = this._getReverseCompNode('rev3');

		return(<div>
		       <form onSubmit={this._onSubmit3} target="infowin">
                       <h3>Type or Paste a: </h3>
		       { seqtypeNode }
		       <p>Sequence:
                       <textarea ref='seq' name='seq' onChange={this._onChange} rows='7' cols='50'></textarea></p>
                       <p>The sequence <b>MUST</b> be provided in RAW format, no comments (numbers are okay).</p>
                       { reverseCompNode }
		       <p><input type="submit" ref='submit3' name='submit3' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset3' name='reset3' value="Reset Form" className="button secondary"></input></p>
		       </form>
                </div>);    

	},

	_getSeqtypeNode: function() {

		var _elements = [];
               	_elements.push(<option value='DNA' selected="selected">DNA</option>);
               	_elements.push(<option value='Protein'>Protein</option>);
                
		return(<div>
                      <p><select name='seqtype' ref='seqtype' onChange={this._onChange}>{_elements}</select></p>
                </div>);

	},

	_getReverseCompNode: function(name) {

	        return (<div>
		       <p><input ref={name} name={name} id={name} type="checkbox" value={this.state.rev} onChange={this._onChangeCB}/> Use the reverse complement</p> 
		       </div>);

        },

	_getStrainMapping: function() {
			   
                return { 'S288C':      'S. cerevisiae Reference Strain S288C',
                         'CEN.PK':     'S. cerevisiae Strain CEN.PK2-1Ca_JRIV01000000',
                         'D273-10B':   'S. cerevisiae Strain D273-10B_JRIY00000000',
                         'FL100':      'S. cerevisiae Strain FL100_JRIT00000000',
                         'JK9-3d':     'S. cerevisiae Strain JK9-3d_JRIZ00000000',
                         'RM11-1a':    'S. cerevisiae Strain RM11-1A_JRIP00000000',
                         'SEY6210':    'S. cerevisiae Strain SEY6210_JRIW00000000',
                         'Sigma1278b': 'S. cerevisiae Strain Sigma1278b-10560-6B_JRIQ00000000',
                         'W303':       'S. cerevisiae Strain W303_JRIU00000000',
                         'X2180-1A':   'S. cerevisiae Strain X2180-1A_JRIX00000000',
                         'Y55':        'S. cerevisiae Strain Y55_JRIF00000000'
                }; 
	
	},

	_getStrainPulldown: function(strains) {

		var strainMapping = this._getStrainMapping();
		var strainList = strains.split("|");
		var defaultStrain = "";
		var _elements = _.map(strainList, s => {
		      // var label = strainMapping[s].replace("S. cerevisia ", "").replace("strain ");
		      var label = s; 
		      if (s == 'S288C') {
		            defaultStrain = 'S288C';
		      	    return <option value={s} selected='selected'>{label}</option>;
	              }
		      else {
		      	    if (defaultStrain == '') {
			        defaultStrain = s;
			    }
		      	    return <option value={s}>{label}</option>;
	              }
		});
		
		// this.setState({ strain: defaultStrain });

		return(<div>
                       <p><select ref='strain' name='strain' id='strain' onChange={this._onChange4strain}>{_elements}</select></p>
                </div>);

	},

	_getStrainNode: function() {

	        var strain2label = this._getStrainMapping();

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
		       <p>(Select or unselect multiple strains by pressing the Control (PC) or Command (Mac) key while clicking.)
                       <select ref='strains' name='strains' id='strains' onChange={this._onChange} size='11' multiple>{_elements}</select></p>
                </div>);

        },

        _onChange: function(e) {
                this.setState({ text: e.target.value});
        },

	_onChange4strain: function(e) {
                this.setState({ text: e.target.value,
				strain: e.target.value });
        },

	_onChangeCB: function() {
		if (this.state.rev == 'off') {
		     this.setState({ rev: 'on' });
		}
		else {
		     this.setState({ rev: 'off' });
		}
	},

	_runSeqTools: function(searchType) {

		var paramData = {};

		if (searchType == 'genes') {
		   paramData['genes'] = window.localStorage.getItem("genes");
		   paramData['strains'] = window.localStorage.getItem("strains");
		   
		   // console.log("genes="+paramData['genes']);
		   // console.log("strains="+paramData['strains']);
		
		   if (window.localStorage.getItem("up")) {
		      paramData['up'] = window.localStorage.getItem("up");
		   }
		   if (window.localStorage.getItem("down")) {
		      paramData['down'] = window.localStorage.getItem("down");
		   }
		   if (window.localStorage.getItem("rev")) {
		      paramData['rev'] = window.localStorage.getItem("rev");
		   }
		   this._sendRequest(paramData)
		   return
		}
		
		if (searchType == 'chr') {
		   paramData['chr'] = window.localStorage.getItem("chr");
		   if (window.localStorage.getItem("start")) {
                      paramData['start'] = window.localStorage.getItem("start");
		   }
		   if (window.localStorage.getItem("end")) {
                      paramData['end'] = window.localStorage.getItem("end");
		   }
		   if (window.localStorage.getItem("rev")) {
                      paramData['rev'] = window.localStorage.getItem("rev");
		   }
		   this._sendRequest(paramData)
                   return
		}

		if (searchType == 'seq') {
		   paramData['seq'] = window.localStorage.getItem("seq");
                   paramData['seqtype'] = window.localStorage.getItem("seqtype");
		   if (window.localStorage.getItem("rev")) {
                      paramData['rev'] = window.localStorage.getItem("rev");
		   }
		   this._sendRequest(paramData)
                   return
		}		
   		
	},
	
        _validateGenes: function(name) {

                $.ajax({
			url: SeqtoolsUrl,
                      	dataType: 'json',
		      	data: { 'check' : name },
		      	success: function(data) {
				this.setState({notFound: data});
				if (data != "") {
				    alert("These gene name(s) do not exist in the database: " + data);
				}
                      	}.bind(this),
                      	error: function(xhr, status, err) {
                              console.error(SeqtoolUrl, status, err.toString());
                      	}.bind(this)
                });

        },

	_sendRequest: function(paramData) {
        
		$.ajax({
			url: SeqtoolsUrl,
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
	
	_get_text: function() {

	        return "<p>Try <a target='infowin' href='https://yeastmine.yeastgenome.org/yeastmine/begin.do'>Yeastmine</a> for flexible queries and fast retrieval of chromosomal features, sequences, GO annotations, interaction data and phenotype annotations. The video tutorial <a target='infowin' href='https://vimeo.com/28472349'>Template Basics</a> describes how to quickly retrieve this type of information in YeastMine. To find a comprehensive list of SGD's tutorials describing the many other features available in YeastMine and how to use them, visit SGD's <a target='infowin' href='https://sites.google.com/view/yeastgenome-help/video-tutorials/yeastmine?authuser=0'>YeastMine Video Tutorials</a> page. </p><p>This resource allows retrieval of a list of options for accessing biological information, table/map displays, and sequence analysis tools for 1. a named gene or sequence. 2. a specified chromosomal region, or 3. a raw DNA or protein sequence.</p>";
      
       },
       
       _getDesc4gene: function(geneList) {

       	     var up = window.localStorage.getItem("up");
	     var down = window.localStorage.getItem("down"); 
	     var rev = window.localStorage.getItem("rev");

       	     var text = "The currently selected gene(s)/sequence(s) are ";
	     text += "<font color='red'>" + geneList + "</font>";
	     if (up && down) {
	     	  text += " <b>plus " + up + " basepair(s) of upstream sequence and " + down + " basepair(s) od downstream sequence.</b>";
	     }
	     else if (up) {
	     	  text += " <b>plus " + up + " basepair(s) of upstream sequence.</b>";
             }
	     else if (down) {
	          text += " <b>plus " + down + " basepair(s) of downstream sequence.</b>";
	     }

	     text = "<p>" + text + "</p>";

	     if (rev) {
	     	  
	     	  text += "<p>You have selected the reverse complement sequence(s) of this gene/sequence list.</p>";
	     }   

	     return "<font size='100'>" + text + "</font>";
       }

});

module.exports = SearchForm;
