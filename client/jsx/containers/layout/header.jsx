import React, { Component } from 'react';

import AppSearchBar from '../app_search_bar.jsx';

const Header = React.createClass({
  render() {
    return (
      <header id="layout-page-header" ref="wrapper">
        {/* top black section */}
        <div className="row top-header hide-for-small">
          {/* left */}
          <div className="columns medium-8 large-9">
          </div>
          {/* right */}
          <div className="columns medium-4 large-3 header-right">
            <div className="site-links">
              <div><a href="/about">About</a></div>
              <div><a href="/blog">Blog</a></div>
              <div><a href="/download-data">Download</a></div>
              <div><a href="/help">Help</a></div>
              <div><a href="http://yeastmine.yeastgenome.org/yeastmine/begin.do">Yeastmine</a></div>
            </div>
          </div>
        </div>
        {/* purple bar */}
        <section className="contain-to-grid">
          <div className="row menu-bar-container">
            <div className="large-3 columns top-menu-container hide-for-medium hide-for-small">
              <a href="/">
                <div className="logo">
                  <span className="logo-label">Saccharomyces Genome Database</span>
                </div>
              </a>
            </div>
            <div className="medium-8 large-6 columns top-menu-container">
              {this._renderMenu()}   
            </div>
            <div className="medium-4 large-3 columns search-container" id="j-search-container">
              <AppSearchBar />
            </div>
          </div>
        </section>
      </header>
    );
  },

  _renderMenu() {
    return (
      <nav className="top-bar" data-topbar role="navigation">
        <ul className="title-area">
          <li className="name">
            <span className="hide-for-large-up">
              <a href="/" className="show-for-medium">
                <div className="logo">
                  <span className="logo-label">Saccharomyces Genome Database</span>
                </div>
              </a>
              <a href="/" className="show-for-small">
                <div className="logo small-logo">
                  <span className="logo-label">Saccharomyces Genome Database</span>
                </div>
              </a>
            </span>
          </li>
          <li className="toggle-topbar menu-icon"><a href="#"><span>Menu</span></a></li>
        </ul>
        <section className="top-bar-section">
          <ul className="left">
            <li className="has-dropdown"><a href="#">Analyze</a>
              <ul className="dropdown">
                <li><a className="disabled-header-a" href="http://yeastmine.yeastgenome.org/yeastmine/bag.do">Gene Lists</a></li>
                <li><a className="disabled-header-a" href="http://yeastmine.yeastgenome.org/yeastmine/bag.do">Yeastmine</a></li>
                <li><a className="disabled-header-a" href="/blast-sgd">BLAST</a></li>
                <li><a className="disabled-header-a" href="/blast-fungal">Fungal BLAST</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/GO/goTermFinder.pl">GO Term Finder</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/GO/goSlimMapper.pl">GO Slim Mapper</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/PATMATCH/nph-patmatch">Pattern Matching</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/web-primer">Design Primers</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/PATMATCH/RestrictionMapper">Restriction Mapper</a></li>
              </ul>
            </li>
            <li className="has-dropdown"><a href="#">Sequence</a>
              <ul className="dropdown">
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/download-data/sequence">Download</a></li>
                <li><a className="disabled-header-a" href="http://browse.yeastgenome.org/fgb2/gbrowse/scgenome/">Genome Browser</a></li>
                <li><a className="disabled-header-a" href="/blast-sgd">BLAST</a></li>
                <li><a className="disabled-header-a" href="/blast-fungal">Fungal BLAST</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/seqTools">Gene/Sequence Resources</a></li>
                <li className="has-dropdown">
                  <a href="#">Reference Genome</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://downloads.yeastgenome.org/sequence/S288C_reference/genome_releases/">Download Genome</a></li>
                    <li><a className="disabled-header-a" href="/genomesnapshot">Genome Snapshot</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/chromosomeHistory.pl">Chromosome History</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cache/chromosomes.shtml">Systematic Sequencing Table</a></li>
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Original_Sequence_Papers">Original Sequence Papers</a></li>
                  </ul>
                </li>
                <li className="has-dropdown">
                  <a href="#">Strains and Species</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/FUNGI/alignment.pl">Align Strain Sequences</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/FUNGI/FungiMap">Synteny Viewer</a></li>
                  </ul>
                </li>
                <li className="has-dropdown">
                  <a href="#">Homology</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/FUNGI/showAlign">Fungal Alignment</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/protein/get3d">PDB Search</a></li>
                  </ul>
                </li>
                <li className="has-dropdown">
                  <a href="#">Resources</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.uniprot.org/">UniProtKB</a></li>
                    <li><a className="disabled-header-a" href="http://www.ebi.ac.uk/interpro/">InterPro (EBI)</a></li>
                    <li><a className="disabled-header-a" href="http://www.ncbi.nlm.nih.gov/homologene">HomoloGene (NCBI)</a></li>
                    <li><a className="disabled-header-a" href="http://wolfe.gen.tcd.ie/ygob/">YGOB (Trinity College)</a></li>
                  </ul>
                </li>
              </ul>
            </li>
            <li className="has-dropdown"><a href="">Function</a>
              <ul className="dropdown">
                <li className="has-dropdown">
                  <a href="#">GO</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/GO/goTermFinder.pl">GO Term Finder</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/GO/goSlimMapper.pl">GO Slim Mapper</a></li>
                    <li><a className="disabled-header-a" href="http://downloads.yeastgenome.org/curation/literature/go_slim_mapping.tab">GO Slim Mapping File</a></li>
                  </ul>
                </li>
                <li><a className="disabled-header-a" href="http://spell.yeastgenome.org/">Expression</a></li>
                <li><a className="disabled-header-a" href="http://pathway.yeastgenome.org">Biochemical Pathways</a></li>
                <li className="has-dropdown">
                  <a href="#">Phenotypes</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="/ontology/phenotype/ypo/overview">Browse All Phenotypes</a></li>
                  </ul>
                </li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/interaction_search">Interactions</a></li>
                <li><a className="disabled-header-a" href="http://yeastgfp.yeastgenome.org/">YeastGFP</a></li>
                <li className="has-dropdown">
                  <a href="#">Resources</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.geneontology.org/">GO Consortium</a></li>
                    <li><a className="disabled-header-a" href="http://thebiogrid.org/">BioGRID (U. Toronto)</a></li>
                  </ul>
                </li>
              </ul>
            </li>
            <li className="has-dropdown"><a href="">Literature</a>
              <ul className="dropdown">
                <li><a className="disabled-header-a" href="http://textpresso.yeastgenome.org/">Full-text Search</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/reference/recent">New Yeast Papers</a></li>
                <li><a className="disabled-header-a" href="http://www.genetics.org/site/misc/yeastbook.xhtml">YeastBook</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cache/genome-wide-analysis.html">Genome-wide Analysis Papers</a></li>
                <li className="has-dropdown">
                  <a href="#">Resources</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.ncbi.nlm.nih.gov/pubmed/">PubMed (NCBI)</a></li>
                    <li><a className="disabled-header-a" href="http://www.ncbi.nlm.nih.gov/pmc/">PubMed Central (NCBI)</a></li>
                    <li><a className="disabled-header-a" href="http://scholar.google.com/">Google Scholar</a></li>
                  </ul>
                </li>
              </ul>
            </li>
            <li className="has-dropdown"><a href="#">Community</a>
              <ul className="dropdown">
                <li className="has-dropdown">
                  <a href="#">Colleague Information</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/colleague/colleagueInfoSearch">Find a Colleague</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/colleague/colleagueSearch">Add or Update Info</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cache/yeastLabs.html">Find a Yeast Lab</a></li>
                  </ul>
                </li>
                <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Career_Resources">Career Resources</a></li>
                <li className="has-dropdown">
                  <a href="#">Meetings</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Meetings#Upcoming_Conferences_.26_Courses">Future</a></li>
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Meetings#Past_Yeast_Meetings">Yeast Genetics</a></li>
                  </ul>
                </li>
                <li className="has-dropdown">
                  <a href="#">Nomenclature</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/registry/geneRegistry">Submit a Gene Registration</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/help/community/gene-registry">Gene Registry</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/help/community/nomenclature-conventions">Nomenclature Conventions</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cgi-bin/geneHunter">Global Gene Hunter</a></li>
                  </ul>
                </li>
                <li className="has-dropdown">
                  <a href="#">Methods and Reagents</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Strains">Strains and Constructs</a></li>
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Reagents">Reagents</a></li>
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Methods">Protocols and Methods</a></li>
                  </ul>
                </li>
                <li className="has-dropdown">
                  <a href="#">Historical Data</a>
                  <ul className="dropdown">
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Combined_Physical_and_Genetic_Maps_of_S._cerevisiae">Physical &amp; Genetic Maps</a></li>
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Yeast_Mortimer_Maps_-_Edition_12">Genetic Maps</a></li>
                    <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Historical_Systematic_Sequence_Information">Sequence</a></li>
                    <li><a className="disabled-header-a" href="http://www.yeastgenome.org/cache/geneSummarytable.html">Gene Summary Paragraphs</a></li>
                  </ul>
                </li>
                <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/Main_Page">Wiki</a></li>
                <li><a className="disabled-header-a" href="http://wiki.yeastgenome.org/index.php/External_Links">Resources</a></li>
              </ul>
            </li>
            <li className="has-dropdown" id="info-menu"><a href="#">Info &amp; Downloads</a>
              <ul className="dropdown">
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/about">About</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/blog">Blog</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/download-data">Downloads</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/site-map">Site Map</a></li>
                <li><a className="disabled-header-a" href="http://www.yeastgenome.org/help">Help</a></li>
              </ul>
            </li>
          </ul>
        </section>
      </nav>
    );
  },

  componentDidMount: function () {
    $(document).foundation();
  }
});

export default Header;
