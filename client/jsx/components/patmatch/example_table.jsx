var React = require("react");
var DataTable = require("../widgets/data_table.jsx");
var $ = require("jquery");

module.exports = {

	examples: function() {
		 
		// rows.push(["Peptide Searches", "IFVLWMAGCYPTSHEDQNKR", "Exact match", "<a href=/nph-patmatch?pattern=ELVIS>ELVIS</a>"]);

		var rows = [];
		
		var cell = "<a href=/nph-patmatch?pattern=ELVIS>ELVIS</a>";
		rows.push(["Peptide Searches", "IFVLWMAGCYPTSHEDQNKR", "Exact match", cell]);
		rows.push(["Peptide Searches", "J", "Any hydrophobic residue (IFVLWMAGCY)", "<a href=/nph-patmatch?pattern=AAAAAAJJ>AAAAAAJJ</a>"]);
		rows.push(["Peptide Searches", "O", "Any hydrophilic residue (TSHEDQNKR)", "<a href=/nph-patmatch?pattern=GLFGO>GLFGO</a>"]);
		rows.push(["Peptide Searches", "B", "D or N", "<a href=/nph-patmatch?pattern=FLGB>FLGB</a>"]);
	        rows.push(["Peptide Searches", "Z", "E or Q", "<a href=/nph-patmatch?pattern=GLFGZ</a>"]);
		rows.push(["Peptide Searches", "X or .", "Any amino acid", "<a href=/nph-patmatch?pattern=DXXXDN..RQS>DXXXDN..RQS</a>"]);
		rows.push(["Nucleotide Searches", "ACTGU", "Exact match", "<a href=/nph-patmatch?seqtype=nuc&pattern=ACGGCGTA>ACGGCGTA</a>"]);
		rows.push(["Nucleotide Searches", "R", "Any purine base (AG)", "<a href=/nph-patmatch?seqtype=nuc&pattern=AATTTGGRGGR>AATTTGGRGGR</a>"]);
		rows.push(["Nucleotide Searches", "Y", "Any pyrimidine base (CT)", "<a href=/nph-patmatch?seqtype=nuc&pattern=CCCATAYYGGYY>CCCATAYYGGYY</a>"]);
		rows.push(["Nucleotide Searches", "S", "G or C", "<a href=/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTGTY>YGGTWCAMWTGTY</a>"]);
		rows.push(["Nucleotide Searches", "W", "A or T", "<a href=/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTGTY>YGGTWCAMWTGTY</a>"]);
		rows.push(["Nucleotide Searches", "M", "A or C", "<a href=/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTGTY>YGGTWCAMWTGTY</a>"]);
		rows.push(["Nucleotide Searches", "K", "G or T", "<a href=/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTGTY>YGGTWCAMWTGTY</a>"]);
		rows.push(["Nucleotide Searches", "V", "A or C or G", "<a href=/nph-patmatch?seqtype=nuc&pattern=CGG...WH.{3,5}HW...CCG>CGG...WH.{3,5}HW...CCG</a>"]);
		rows.push(["Nucleotide Searches", "H", "A or C or T", "<a href=/nph-patmatch?seqtype=nuc&pattern=CGG...WH.{3,5}HW...CCG>CGG...WH.{3,5}HW...CCG</a>"]);
		rows.push(["Nucleotide Searches", "D", "A or G or T", "<a href=/nph-patmatch?seqtype=nuc&pattern=CGG...WH.{3,5}HW...CCG>CGG...WH.{3,5}HW...CCG</a>"]);		
		rows.push(["Nucleotide Searches", "B", "C or G or T", "<a href=/nph-patmatch?seqtype=nuc&pattern=CGG...WH.{3,5}HW...CCG>CGG...WH.{3,5}HW...CCG</a>"]);
		rows.push(["Nucleotide Searches", "N or X or .", "Any base", "<a href=/nph-patmatch?seqtype=nuc&pattern=ATGCNNNNNATCG>ATGCNNNNNATCG</a>"]);
		rows.push(["All Searches", "[]", "A subset of elements", "<a href=/nph-patmatch?seqtype=pep&pattern=[WFY]XXXDN[RK][ST]>[WFY]XXXDN[RK][ST]</a>"]);
		rows.push(["All Searches", "[^]", "An excluded subset of elements", "<a href=/nph-patmatch?seqtype=pep&pattern=NDBB...[VILM]Z[DE]...[^PG]>NDBB...[VILM]Z[DE]...[^PG]</a>"]);
		rows.push(["All Searches", "()", "Specifies a sub-pattern", "<a href=/nph-patmatch?seqtype=pep&pattern=(YDXXX){2,}>(YDXXX){2,}</a>"]);
		rows.push(["All Searches", "{m,n}", "{m} = exactly m times<br>{m,} = at least m times<br>{,m} = 0 to m times<br>{m,n} = between m and n times", "<a href=/nph-patmatch?seqtype=pep&pattern=L{3,5}X{5}DGO>L{3,5}X{5}DGO</a>"]);
		rows.push(["All Searches", "<", "Constrains pattern to N-terminus or 5' end", "<a href='/nph-patmatch?seqtype=pep&pattern=<MNTD'><MNTD</a> (pep)<br><a href=/nph-patmatch?seqtype=nuc&pattern=<ATGX{6,10}RTTRTT><ATGX{6,10}RTTRTT (nuc)</a>"]);
		rows.push(["All Searches", ">", "Constrains pattern to C-terminus or 3' end", "<a href='/nph-patmatch?seqtype=pep&pattern=sjgo>'>sjgo></a> (pep)<br><a href='/nph-patmatch?seqtype=nuc&pattern=yattrtga>'>yattrtga></a> (nuc)"]);
		 
		var tableData = {
                        headers: [["Search type", "Character", "Meaning", "Examples"]],
                        rows: rows
                };

 		return<DataTable data={tableData} />;
		
	}
};

