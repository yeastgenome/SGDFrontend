import React from 'react';
import _ from 'underscore';
import $ from 'jquery';
import Radium from 'radium';

const DataTable = require("../widgets/data_table.jsx");
const Params = require("../mixins/parse_url_params.jsx");

const SeqtoolsUrl = "/run_seqtools";

const GeneSequenceResources = React.createClass({

	getInitialState: function () {
	        
		var param = Params.getParams();
		
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			strain: 'S288C',
			resultData: {},
			notFound: null,
			param: param
		};
	},

	render() {	
	
		var formNode = this.getFormNode();
		
		return (<div>
			  <span style={{ textAlign: "center" }}><h1>Gene/Sequence Resources <a target="_blank" href="https://sites.google.com/view/yeastgenome-help/sequence-help/genesequence-resources"><img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1>
			  <hr /></span>
			  {formNode}
			</div>);
		
		 
	},

	componentDidMount() {
		var param = this.state.param;
	        if (param['submit']) {
	              this.runSeqTools('genes');
	        }
		else if (param['submit2']) {
                      this.runSeqTools('chr');
                }
		else if (param['submit3']) {
                      this.runSeqTools('seq');
                }
		else if (param['emboss']) {
		      this.runSeqTools('emboss');
		}
		      
	},

	getFormNode() {
		
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
			else if (param['submit2']) {
			     
			     var _resultTable = this.getResultTable4chr(data);
			     var _desc = this.getDesc4chr(data);
 
			     return (<div>
                                           <p dangerouslySetInnerHTML={{ __html: _desc }} />
                                           <p>{ _resultTable } </p>
                                     </div>);

			}
			else if (param['submit3']) {
			     
			     var _resultTable = this.getResultTable4seq(data['residue']);
                             var _desc = this.getDesc4seq();
			     var _complementBox = this.getComplementBox(data['residue']);

                             return (<div>
                                           <p dangerouslySetInnerHTML={{ __html: _desc }} />
					   {_complementBox}
                                           <p>{ _resultTable } </p>
                                     </div>); 
			    
			}
			else if (param['emboss']) {
			 
			     // var _desc = this.getDesc4emboss();
			     
			     var _desc = "<h2>Restriction Map</h2>";

			     return(<div>
			            <p dangerouslySetInnerHTML={{ __html: _desc }} />
				    <pre><span style={{ fontSize: 18 }}>{ data['content'] } </span></pre>
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

		        if (param['submit'] || param['submit2'] || param['submit3']) {
			     return <p>Please wait... The search may take a while to run.</p>; 

			}

			return this.get_frontpage();
			
		}
	},

	get_frontpage() {
								
		var descText = this.get_text();

		var geneNodeLeft = this.getGeneNodeLeft();
                var geneNodeRight = this.getGeneNodeRight();
                var chrNode = this.getChrNode();
               	var seqNode = this.getSeqNode();

		var _nameSection = { headers: [[<span style={{ fontSize: 18 }}><a name='gene'>1. Search a list of genes</a></span>, '']],
			    	     rows:    [[geneNodeLeft, geneNodeRight]] };
				     
		var _chrSeqSection = { headers: [[<span style={{ fontSize: 18 }}><strong style={{ color: 'red'}}>OR</strong> <a name='chr'>2. Search a specified chromosomal region</a></span>, '', '', <span style={{ fontSize: 18 }}><strong style={{ color: 'red'}}>OR</strong> <a name='seq'>3. Analyze a raw DNA or Protein sequence</a></span>]],
                                       rows:    [[chrNode, '', '', seqNode]] };
					
		return (<div>
			<div dangerouslySetInnerHTML={{ __html: descText}} />
			<div className="row">
			     <div className="large-12 columns">
			     	  <form onSubmit={this.onSubmit} target="infowin">
				        <DataTable data={_nameSection} />
			          </form>
			         <DataTable data={_chrSeqSection} />        
			     </div>
			</div>
		</div>);

	},

	getComplementBox(seq) {

	     var param = this.state.param;
	     var rev = param['rev3'];

	     if (rev == 'on') {
	     	  return (<div><h3>The reverse complement of this sequence:</h3><p><textarea value={ seq } rows='7' cols='200'></textarea></p></div>);
	     }
	     else {
	     	  return (<div></div>);
	     }

	},

	getResultTable4seq(seq) {

		var param = this.state.param;		
		var seqtype = param['seqtype'];

		var min = 1;
   		var max = 10000;
   		var seqID =  min + (Math.random() * (max-min));
			     
                var headerRow = ['', ''];

                var rows = [];

                // sequence analysis row

                var seqAnalRow = [<span style={{ fontSize: 18}}>Sequence Analysis</span>];
                window.localStorage.setItem(seqID, seq);
		if (seqtype == 'DNA') {
                     seqAnalRow.push(this.getToolsLinks4DNA(seqID, seq)); 
		}
		else {
		     seqAnalRow.push(this.getToolsLinks4protein(seqID, seq));
		}
                rows.push(seqAnalRow);

                return this.display_result_table(headerRow, rows);		   
		   
	},

	getResultTable4chr(data) {
	
		var chr = this.num_to_chr(data['chr']);
		var start = data['start'];
		var end = data['end'];
		var rev = data['rev'];
		if (rev != 1) {
		    rev = 0;
		}
		var headerRow = ['', ''];

                var rows = [];

		// browser row

                var browserRow = [<span style={{ fontSize: 18}}>Genome Display (S288C)</span>];
                var url = "https://browse.yeastgenome.org/?loc=" + chr + ":" + start + ".." + end;;
                browserRow.push(<span style={{ fontSize: 18 }}><a href={ url } target='infowin2'>JBrowse</a></span>);
                rows.push(browserRow);

		// sequence download row

                var seqDLRow = [<span style={{ fontSize: 18}}><br>Sequence Downloads</br><br>* DNA of Region</br></span>];
                var fastaUrl = SeqtoolsUrl + "?format=fasta&chr=" + data['chr'] + "&start=" + start + "&end=" + end + "&rev=" + rev;
                var gcgUrl = SeqtoolsUrl + "?format=gcg&chr=" + data['chr'] + "&start=" + start + "&end=" + end + "&rev=" + rev;
                seqDLRow.push(<span style={{ fontSize: 18}}><br></br><br><a href={ fastaUrl } target='infowin'>Fasta</a> | <a href={ gcgUrl } target='infowin'>GCG</a></br></span>);
                rows.push(seqDLRow);

		// sequence analysis row

		var seqAnalRow = [<span style={{ fontSize: 18}}>Sequence Analysis</span>];
                var seq = data['residue'];
		var seqID = chr + "_" + start + "_" + end + "_" + rev;
              	window.localStorage.setItem(seqID, seq);
                seqAnalRow.push(this.getToolsLinks4chr(seqID, seq)); 
                rows.push(seqAnalRow);

		return this.display_result_table(headerRow, rows);

	},

	getResultTable4gene(data) {
		
		var [genes, displayName4gene, sgdid4gene, seq4gene, hasProtein4gene, hasCoding4gene, hasGenomic4gene] 
			= this.getDataFromJson4gene(data);
		
		var param = this.state.param; 
				
		var headerRow = [];
		for (var i = 0; i <= genes.length; i++) {
		    headerRow.push("");
		}
		var geneList = "";
		var rows = [];
		var geneRow = [<span style={{ fontSize: 18}}>Gene Name</span>];
		_.map(genes, gene => {
		    geneRow.push(<span style={{ fontSize: 18 }}>{ displayName4gene[gene] }</span>);
		    if (geneList != "") {
		        geneList += ", ";
	            }
		    geneList += displayName4gene[gene];

		});
		rows.push(geneRow);

		// gene name row

		var locusRow = [<span style={{ fontSize: 18}}>Locus and Homolog Details</span>];
		_.map(genes, gene => { 
		    var sgdUrl = "https://www.yeastgenome.org/locus/" + sgdid4gene[gene];
		    var allianceUrl = "http://www.alliancegenome.org/gene/" + sgdid4gene[gene];
		    locusRow.push(<span style={{ fontSize: 18 }}><a href={ sgdUrl } target='infowin2'>SGD</a> | <a href={ allianceUrl } target='infowin2'>Alliance</a></span>);
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
		     return this.display_gene_table(headerRow, rows)
		}    

	        // browser row

       		var browserRow = [<span style={{ fontSize: 18}}>Genome Display (S288C)</span>];
		_.map(genes, gene => {
                    var url = "https://browse.yeastgenome.org/?loc=" + gene;
                    browserRow.push(<span style={{ fontSize: 18 }}><a href={ url } target='infowin2'>JBrowse</a></span>);
                });
                rows.push(browserRow);		

		// alignment row

		var alignRow = [<span style={{ fontSize: 18}}>Alignment/Variation</span>];
		_.map(genes, gene => {
		     var variantUrl = "https://www.yeastgenome.org/variant-viewer#/" + sgdid4gene[gene].replace("SGD:", "");
		     var strainUrl = "https://www.yeastgenome.org/cgi-bin/FUNGI/alignment.pl?locus=" + gene;
		     var fungalUrl = "https://www.yeastgenome.org/cache/fungi/" + gene + ".html";
		     alignRow.push(<span style={{ fontSize: 18 }}><br><a href={ variantUrl } target='infowin2'>Variant Viewer</a></br><br><a href={ strainUrl } target='infowin2'>Strain Alignment</a></br><br><a href={ fungalUrl } target='infowin2'>Fungal Alignment</a></br></span>);
		});
		rows.push(alignRow);
		
		// sequence download row
		
		var seqDLRow = [];
		if (hasCoding > 0) { 
		     seqDLRow = [<span style={{ fontSize: 18}}><br>Sequence Downloads</br><br>* DNA of Region</br><br>* Coding Sequence of Selected ORF</br><br>* Protein Translation of Selected ORF</br></span>];
		}
		else {
		     seqDLRow = [<span style={{ fontSize: 18}}><br>Sequence Downloads</br><br>* DNA of Region</br></span>];
		}

		var strains = window.localStorage.getItem("strains");
		
		var extraParams = "";		
		var up = 0;
		var down = 0;
		var rev = 0;
		if (param['rev1'] && param['rev1'] == 'on') {
		    extraParams = "&rev=1";
		    rev = 1;
		}
		if (param['up'] && param['up'] != '') {
		    extraParams	+= "&up=" + param['up'];
		    up = param['up'];
		}
		if (param['down'] && param['down'] != '') {
		    extraParams += "&down=" + param['down'];
		    down = param['down'];
                }

		_.map(genes, gene => {
		    var queryStr = "&genes=" + gene + "&strains=" + strains; 
		    var genomicFastaUrl = SeqtoolsUrl + "?format=fasta&type=genomic" + queryStr + extraParams;
		    var genomicGcgUrl = SeqtoolsUrl + "?format=gcg&type=genomic" + queryStr + extraParams;
		    var codingFastaUrl = SeqtoolsUrl + "?format=fasta&type=coding" + queryStr + extraParams;
                    var	codingGcgUrl = SeqtoolsUrl + "?format=gcg&type=coding" + queryStr + extraParams;
		    var proteinFastaUrl = SeqtoolsUrl + "?format=fasta&type=protein" + queryStr + extraParams;
                    var	proteinGcgUrl = SeqtoolsUrl + "?format=gcg&type=protein" + queryStr + extraParams;
		    if (hasCoding > 0) {
		         seqDLRow.push(<span style={{ fontSize: 18}}><br></br><br><a href={ genomicFastaUrl } target='infowin'>Fasta</a> | <a href={ genomicGcgUrl } target='infowin'>GCG</a></br><br><a href={ codingFastaUrl } target='infowin'>Fasta</a> | <a href={ codingGcgUrl } target='infowin'>GCG</a></br><br><a href={ proteinFastaUrl } target='infowin'>Fasta</a> | <a href={ proteinGcgUrl } target='infowin'>GCG</a></br></span>);
		    }
		    else {
		    	 seqDLRow.push(<span style={{ fontSize: 18}}><br></br><br><a href={ genomicFastaUrl } target='infowin'>Fasta</a> | <a href={ genomicGcgUrl } target='infowin'>GCG</a></br></span>);
		    } 
	        });
		rows.push(seqDLRow);
		
		var ID = up + "_" + down + "_" + rev;
		var seqAnalRow = [<span style={{ fontSize: 18}}>Sequence Analysis</span>];
		_.map(genes, gene => {
		    var s = seq4gene[gene];
		    var seqInfo = s['genomic'];
		    var selectedStrains = Object.keys(seqInfo).sort();
		    _.map(selectedStrains, strain =>  {
		    	  var seqID = gene + "_" + strain + "_" + ID;
			  var seq = seqInfo[strain];
                          window.localStorage.setItem(seqID, seq);
	            });
		    // seqAnalRow.push(this.getToolsLinks(gene, strains, ID));
		    seqAnalRow.push(this.getToolsLinks(gene, selectedStrains, ID));
		});		
		rows.push(seqAnalRow);

		return [geneList, this.display_result_table(headerRow, rows)];		
		
	},

	getToolsLinks4DNA(seqID, seq) {
		
		var blastButton = this.getToolButtonChr('/blast-sgd',  'BLAST', seqID, '');
                var fungalBlastButton = this.getToolButtonChr('/blast-fungal', 'Fungal BLAST', seqID, '');
                var primerButton = this.getToolButtonChr('/primer3', 'Design Primers', seqID, '');
                var restrictionButton = this.getToolButtonChr4post('https://www.yeastgenome.org/cgi-bin/PATMATCH/RestrictionMapper', 'Genome Restriction Map', seq, seqID);
		var translatedProteinButton = this.getToolButtonChr('/seqTools', 'Translated Protein Sequence', seqID, 'transeq');
                var sixframeButton = this.getToolButtonChr('/seqTools', '6 Frame Translation', seqID, 'remap');

		var seqlen = seq.length;

		if (seqlen > 20) {
                     return(<div className="row">
                                 <div className="large-12 columns">
                                      { blastButton }
                                      { fungalBlastButton }
                                      { primerButton }
                                      { restrictionButton }
				      { translatedProteinButton }
				      { sixframeButton }
                                 </div>
                     </div>);
		}
		else {

		     return(<div className="row">
                                 <div className="large-12 columns">
                                      { blastButton }
                                      { fungalBlastButton }
                                      { primerButton }
				      <form method="GET" action='/nph-patmatch' target="toolwin">
				      	   <input type="hidden" name="seqtype" value='dna' />
					   <input type="hidden" name="seq" value={ seq } />
					   <input type="submit" value="Genome Pattern Matching" style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                                      </form>
                                      { restrictionButton }
                                 </div>
                     </div>);

		}

	},

	getToolsLinks4protein(seqID, seq) {
			    
		var blastButton = this.getToolButtonChr('/blast-sgd',  'BLAST', seqID);
		var fungalBlastButton = this.getToolButtonChr('/blast-fungal', 'Fungal BLAST', seqID);

		var seqlen = seq.length;

                if (seqlen > 20) {
		
		     return(<div className="row">
                            	 <div className="large-12 columns">
                                      { blastButton }
                                      { fungalBlastButton }
                                 </div>
                     </div>);

		}
		else {
		     
		     return(<div className="row">
                                 <div className="large-12 columns">
                                      { blastButton }
                                      { fungalBlastButton }
				      <form method="GET" action='/nph-patmatch' target="toolwin">	
                                           <input type="hidden" name="seq" value={ seq } />
                                           <input type="submit" value="Genome Pattern Matching" style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                                      </form>   
                                 </div>
                     </div>);

		}
	},

	getToolsLinks4chr(seqID, seq) {
			    
                var blastButton = this.getToolButtonChr('/blast-sgd',  'BLAST', seqID, '');
                var fungalBlastButton = this.getToolButtonChr('/blast-fungal', 'Fungal BLAST', seqID, '');
                var primerButton = this.getToolButtonChr('/primer3', 'Design Primers', seqID, '');
                var restrictionButton = this.getToolButtonChr4post('https://www.yeastgenome.org/cgi-bin/PATMATCH/RestrictionMapper', 'Genome Restriction Map', seq);
		var restrictFragmentsButton = this.getToolButtonChr('/seqTools', 'Restriction Fragments', seqID, 'restrict');
                var sixframeButton = this.getToolButtonChr('/seqTools', '6 Frame Translation', seqID, 'remap');
		
                return(<div className="row">
                            <div className="large-12 columns">
                                 { blastButton }
                                 { fungalBlastButton }
                                 { primerButton }
                                 { restrictionButton }
				 { restrictFragmentsButton }
				 { sixframeButton }
                            </div>
                </div>);

	},

	getToolsLinks(gene, strains, ID) {

		var strainPulldown = this.getStrainPulldown(strains);
		var blastButton = this.getToolButton(gene, '/blast-sgd',  'BLAST', ID, '');
		var fungalBlastButton = this.getToolButton(gene, '/blast-fungal', 'Fungal BLAST', ID, '');	
		var primerButton = this.getToolButton(gene, '/primer3', 'Design Primers', ID, '');
		var restrictionButton = this.getToolButton4post(gene, 'https://www.yeastgenome.org/cgi-bin/PATMATCH/RestrictionMapper', 'Genome Restriction Map', ID);
		var restrictFragmentsButton = this.getToolButton(gene, '/seqTools', 'Restriction Fragments', ID, 'restrict');
		var sixframeButton = this.getToolButton(gene, '/seqTools', '6 Frame Translation', ID, 'remap');

		return(<div className="row">
                            <div className="large-12 columns">	
                       	    	 { strainPulldown }
		       		 { blastButton } 
		       		 { fungalBlastButton }
		       		 { primerButton } 
		       		 { restrictionButton }
				 { restrictFragmentsButton }
				 { sixframeButton } 
		            </div>
                </div>);

	},

	
	getToolButton(name, program, button, ID, emboss) {

                var strain = this.state.strain;
                var seqID = name + "_" + strain + "_" + ID;
                var seq = window.localStorage.getItem(seqID);

                // <input type="submit" value={ button } className="button small secondary"></input>

		if (emboss == '') {
                   return (<form method="GET" action={ program } target="toolwin">
                                <input type="hidden" name="sequence_id" value={ seqID }  />
                                <input type="submit" value={ button } style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                           </form>);
	        }
		else {

		     return (<form method="GET" action={ program } target="toolwin">
                                <input type="hidden" name="sequence_id" value={ seqID }  />
				<input type="hidden" name="emboss" value={ emboss }  />
                                <input type="submit" value={ button } style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                           </form>);
		}

        },

	getToolButton4post(name, program, button, ID) {

		var strain = this.state.strain;
		var seqID = name + "_" + strain + "_" + ID;
		var seq = window.localStorage.getItem(seqID);

		// <input type="submit" value={ button } className="button small secondary"></input>
		
		return (<form method="POST" action={ program } target="toolwin">
		                <input type="hidden" name="seq" value={ seq }  />
                                <input type="submit" value={ button } style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                        </form>);

	},

	getToolButtonChr(program, button, seqID, emboss) {

		if (emboss != '') {	
	                return (<form method="GET" action={ program } target="toolwin">
                                <input type="hidden" name="sequence_id" value={ seqID }  />
				<input type="hidden" name="emboss" value={ emboss }  />
                                <input type="submit" value={ button } style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                        </form>);
		}
		else {
		     return (<form method="GET" action={ program } target="toolwin">
                             <input type="hidden" name="sequence_id" value={ seqID }  />
                             <input type="submit" value={ button } style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                     </form>);

		}

        },

        getToolButtonChr4post(program, button, seq) {


                return (<form method="POST" action={ program } target="toolwin">
                                <input type="hidden" name="seq" value={ seq }  />
                                <input type="submit" value={ button } style={{ fontSize: 18, background: 'none', border: 'none', color: '#7392b7' }}></input>
                        </form>);

        },


	// getDownloadSeqButton(genes, strains, type) {
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

	display_result_table(headerRow, rows) {

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

	getDataFromJson4gene(data) {
	        
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


	onSubmit(e) {
		
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
		this.validateGenes(genes);		
		var not_found = this.state.notFound;
		if (not_found != "") {
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
	
		window.localStorage.clear();
                window.localStorage.setItem("genes", genes);
                window.localStorage.setItem("strains", strains);

	},

	onSubmit2(e) {

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

        },

	onSubmit3(e) {

                var seq = this.refs.seq.value.trim();
		seq = seq.replace(/[^A-Za-z]/g, '');	
                if (seq == '') {
                   alert("Please enter a raw sequence.");
                   e.preventDefault();
                   return 1;
                }

		var seqtype = this.refs.seqtype.value.trim();
		
		if (seqtype == 'DNA') {
		   var re = /[^ATCGatcg]/;
		   var OK = re.exec(seq);
		   if (OK != null) {
		       alert("Looks like you are entering a PROTEIN sequence instead of DNA sequence. Please pick a right sequence type and try it again.");
		       e.preventDefault();
                       return 1;     
		   }
		}

        },

	getGeneNodeLeft() {
			  
	        var reverseCompNode = this.getReverseCompNode('rev1');

                return (<div style={{ textAlign: "top" }}>
                        <h3>Enter a list of names:</h3>
			<p>(space-separated gene names (and/or ORF and/or SGDID). Example: ACT1 YHR023W SGD:S000000001) 
			<textarea ref='genes' name='genes' onChange={this.onChange} rows='2' cols='50'></textarea></p>
			<h3><b>If available,</b> add flanking basepairs</h3>
			<p>Upstream: <input type='text' ref='up' name='up' onChange={this.onChange} size='50'></input>
			Downstream: <input type='text' ref='down' name='down' onChange={this.onChange} size='50'></input></p>
			{ reverseCompNode }			
                </div>);

        },
	
	getGeneNodeRight() {

                var strainNode = this.getStrainNode();

                return (<div>
                        <h3>Pick one or more strains:</h3>
                        { strainNode }
			<p><input type="submit" ref='submit' name='submit' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset' name='reset' value="Reset Form" className="button secondary"></input></p>
                </div>);

        },

	getChrNode() {
		 		    	      
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
		
		var reverseCompNode = this.getReverseCompNode('rev2');

                return(<div>
		       <form onSubmit={this.onSubmit2} target="infowin">
                       <h3>Pick a chromosome: </h3>
                       <p><select ref='chr' name='chr' onChange={this.onChangeGenome}>{_elements}</select></p>
		       <p>Then enter coordinates (optional)
		       <input type='text' ref='start' name='start' onChange={this.onChange} size='50'></input></p>
		       <p>to
                       <input type='text' ref='end' name='end' onChange={this.onChange} size='50'></input></p>
		       <p>The entire chromosome sequence will be displayed if no coordinates are entered.</p>
		       <p><b>Note</b>: Enter coordinates in ascending order for the Watson strand and descending order for the Crick strand.</p>
		       { reverseCompNode }
		       <p><input type="submit" ref='submit2' name='submit2' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset2' name='reset2' value="Reset Form" className="button secondary"></input></p>
		       </form>
                </div>);
 		 
	},

	getSeqNode() {

		var seqtypeNode = this.getSeqtypeNode();
		var reverseCompNode = this.getReverseCompNode('rev3');

		return(<div>
		       <form onSubmit={this.onSubmit3} target="infowin">
                       <h3>Type or Paste a: </h3>
		       { seqtypeNode }
		       <p>Sequence:
                       <textarea ref='seq' name='seq' onChange={this.onChange} rows='7' cols='50'></textarea></p>
                       <p>The sequence <b>MUST</b> be provided in RAW format, no comments (numbers are okay).</p>
                       { reverseCompNode }
		       <p><input type="submit" ref='submit3' name='submit3' value="Submit Form" className="button secondary"></input> <input type="reset" ref='reset3' name='reset3' value="Reset Form" className="button secondary"></input></p>
		       </form>
                </div>);    

	},

	getSeqtypeNode() {

		var _elements = [];
               	_elements.push(<option value='DNA' selected="selected">DNA</option>);
               	_elements.push(<option value='Protein'>Protein</option>);
                
		return(<div>
                      <p><select name='seqtype' ref='seqtype' onChange={this.onChange}>{_elements}</select></p>
                </div>);

	},

	getReverseCompNode(name) {

		// <p><input ref={name} name={name} id={name} type="checkbox" value={this.state.rev} onChange={this.onChangeCB}/> Use the reverse complement</p>

	        return (<div>
		       <p><input ref={name} name={name} id={name} type="checkbox" onChange={this.onChange}/> Use the reverse complement</p> 
		       </div>);

        },

	getStrainMapping() {
			   
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

	getStrainPulldown(strains) {

		var strainMapping = this.getStrainMapping();
		var defaultStrain = "";
		

		var _elements = _.map(strains, s => {
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
                       <p><select ref='strain' name='strain' id='strain' onChange={this.onChange4strain}>{_elements}</select></p>
                </div>);

	},

	getStrainNode() {

	        var strain2label = this.getStrainMapping();

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
                       <select ref='strains' name='strains' id='strains' onChange={this.onChange} size='11' multiple>{_elements}</select></p>
                </div>);

        },

        onChange(e) {
                this.setState({ text: e.target.value});
        },

	onChange4strain(e) {
                this.setState({ text: e.target.value,
				strain: e.target.value });
        },

	runSeqTools(searchType) {

		var paramData = {};
		
		var param = this.state.param;

		if (searchType == 'genes') {

		   paramData['genes'] = window.localStorage.getItem("genes");
		   paramData['strains'] = window.localStorage.getItem("strains");

		   if (param['up']) {		   
		      paramData['up'] = param['up'];
		   }
		   if (param['down']) {
		      paramData['down'] = param['up'];
		   }
		   if (param['rev1'] && param['rev1'] == 'on') {
		      paramData['rev'] = 1
		   }
		   this.sendRequest(paramData)
		   return
		}
		
		if (searchType == 'chr') {
		   paramData['chr'] = param['chr'];
		   if (param['start']) {
                      paramData['start'] = param['start'];
		   }
		   if (param['end']) {
                      paramData['end'] = param['end'];
                   }
		   if (param['rev2'] && param['rev2'] == 'on') {
                      paramData['rev'] = 1;
                   }
		   this.sendRequest(paramData)
                   return
		}

		if (searchType == 'seq') {
		   var seq = param['seq'];
		   seq = seq.toUpperCase().replace(/[^A-Z]/g, '');
		   paramData['seq'] = seq;
                   paramData['seqtype'] = param['seqtype']
		   if (param['rev3'] && param['rev3'] == 'on') {
                      paramData['rev'] = 1;
                   }
		   this.sendRequest(paramData)
                   return
		}		

		if (searchType == 'emboss') {
		   paramData['emboss'] = param['emboss'];
		   var seqID = param['sequence_id'];
		   paramData['seq'] = window.localStorage.getItem(seqID);
		   this.sendRequest(paramData)
                   return		   
		}		
 		
	},
	
        validateGenes(name) {

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

	sendRequest(paramData) {
        
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
	
	get_text() {

	        return "<p><h3>Try <a target='infowin' href='https://yeastmine.yeastgenome.org/yeastmine/begin.do'>Yeastmine</a> for flexible queries and fast retrieval of chromosomal features, sequences, GO annotations, interaction data and phenotype annotations. The video tutorial <a target='infowin' href='https://vimeo.com/28472349'>Template Basics</a> describes how to quickly retrieve this type of information in YeastMine. To find a comprehensive list of SGD's tutorials describing the many other features available in YeastMine and how to use them, visit SGD's <a target='infowin' href='https://sites.google.com/view/yeastgenome-help/video-tutorials/yeastmine?authuser=0'>YeastMine Video Tutorials</a> page.</h3></p><p><h3>This resource allows retrieval of a list of options for accessing biological information, table/map displays, and sequence analysis tools for <b><a href='#gene'>1. a list of named genes or sequences.</a> <a href='#chr'>2. a specified chromosomal region</a>, or <a href='#seq'>3. a raw DNA or protein sequence.</a></b></h3></p>";
      
       },
       
       getDesc4gene(geneList) {

	     var param = this.state.param;
	     var rev = param['rev1'];
	     var up = param['up'];
	     var down = param['down'];

       	     var text = "The currently selected gene(s)/sequence(s) are ";
	     text += "<font color='red'>" + geneList + "</font>";
	     if (up && down) {
	     	  text += " <b>plus " + up + " basepair(s) of upstream sequence and " + down + " basepair(s) of downstream sequence.</b>";
	     }
	     else if (up) {
	     	  text += " <b>plus " + up + " basepair(s) of upstream sequence.</b>";
             }
	     else if (down) {
	          text += " <b>plus " + down + " basepair(s) of downstream sequence.</b>";
	     }

	     text = "<h3>" + text + "</h3>";

	     if (rev == 'on') {
	     	  text += "<h3>You have selected the reverse complement of this gene/sequence list.</h3>";
	     }   

	     return text;

       },

       getDesc4chr(data) {

       	     var chrnum = data['chr'];
	     
	     var text = "The current selection is: ";
	    
	     text += "<font color='red'>chromosome " + this.num_to_chr(chrnum) + " coordinates " + data['start'] + " to " + data['end'] + "</font>";
	     text = "<h3>" + text + "</h3>";
	     
	     var param = this.state.param;

	     if (param['rev2'] == 'on' || data['start'] > data['end']) {
		 text += "<h3>You have selected the reverse complement of this sequence. The reverse complement is on the Crick strand and will be displayed 5'->3' for all Sequence Downloads and Analysis options.</h3>"; 
	     }	     

	     return text;

       },

       getDesc4seq() {

       	     var param = this.state.param;
	     var seqtype = param['seqtype'];
	     return "<h3>The current raw sequence you have entered is: <font color='red'>" + seqtype + " sequence</font></h3>";
	     	  
       },

       getDesc4emboss() {

       	     return "<h2>Restriction Map</h2>";

       	     var param = this.state.param;

	     var emboss = param['emboss'];
	     
	     var text = "";

	     if (emboss == 'restrict') {
	     	 text = "Restriction Map";
	     }
	     else if (emboss == 'remap') {
	     	 text = "6 Frame Translation";
	     }
	     else {
	     	 text = "Protein Translation";
             }  	 
	     text = "<h2>" + text + "</h2>";
	     
	     var pieces = param['sequence_id'].split('_');

	     var gene = pieces[0];
	     var strain = pieces[1];
	     var up = pieces[2];
	     var down = pieces[3]
	     var rev = pieces[4]; 

	     text += "The currently selected gene/sequence is ";

             text += "<font color='red'>" + gene + "</font>";

             if (up && down) {
                  text += " <b>plus " + up + " basepair(s) of upstream sequence and " + down + " basepair(s) of downstream sequence.</b>";
             }
             else if (up) {
                  text += " <b>plus " + up + " basepair(s) of upstream sequence.</b>";
             }
             else if (down) {
                  text += " <b>plus " + down + " basepair(s) of downstream sequence.</b>";
             }

             text = "<p>" + text + "</p>";

             if (rev == 'on') {

                  text += "<p>You have selected the reverse complement of this gene/sequence.</p>";
             }

	     return text;

       },

       num_to_chr(num) {
       		 
		 var num2chr = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
		     	         7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 
				 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI',
				 '17': 'Mito' };

		return num2chr[num];

       }

});

const mystyle = {
      button: { fontSize: 18, background: 'none', border: 'none', color: '#7392b7' },
      textFont: { fontSize: 18 }
};

export default Radium(GeneSequenceResources);

