'use strict';
var Radium = require('radium');
var React = require('react');
var _ = require('underscore');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

var VariantViewerComponent = require('sgd_visualization_new')
  .VariantViewerComponent;
var RadioSelector = require('../widgets/radio_selector.jsx');

var AsyncVariantViewer = createReactClass({
  propTypes: {
    hideTitle: PropTypes.bool,
    sgdid: PropTypes.string.isRequired,
    store: PropTypes.object.isRequired,
  },

  getInitialState: function () {
    return {
      isPending: true,
      isProteinMode: false,
      isUpstreamMode: false,
      isDownstreamMode: false,
      labelsVisible: true,
      data: null,
      childIsUpstream: this.props.parentIsUpstream,
      childIsDownstream: this.props.parentIsDownstream,
    };
  },

  getDefaultProps: function () {
    return {
      hideTitle: false,
      parentIsUpstream: false,
      parentIsDownstream: false,
    };
  },

  render: function () {
    return <div>{this._renderContentNode()}</div>;
  },

  componentDidMount: function () {
    this.props.store.fetchLocusData(this.props.sgdid, (err, _data) => {
      this.setState({ data: _data });
    });
  },

  _renderContentNode: function () {
    var data = this.state.data;
    if (!data)
      return (
        <div className="sgd-loader-container">
          <div className="sgd-loader" />
        </div>
      );

    var vizNode = '';
    if (this.state.childIsProtein) {
      vizNode = this._renderProteinViz();
    } else if (this.state.childIsUpstream) {
      vizNode = this._renderUpstreamViz();
    } else if (this.state.childIsDownstream) {
      vizNode = this._renderDownstreamViz();
    } else {
      vizNode = this._renderDnaViz();
    }
    return (
      <div>
        {this._renderHeader()}
        {vizNode}
      </div>
    );
  },

  _renderHeader: function () {
    var data = this.state.data;
    if (!data) return null;
    var name =
      data.name === data.format_name
        ? data.name
        : `${data.name} / ${data.format_name}`;
    var nameNode;
    if (data.href) {
      nameNode = <a href={data.href}>{name}</a>;
    } else {
      nameNode = name;
    }

    // init radio selector
    var _elements = [
      { name: 'Genomic DNA', key: 'dna' },
      { name: 'Protein', key: 'protein' },
    ];

    if (data.upstream_format_name) {
      _elements.push({ name: 'Upstream IGR', key: 'upstream' });
    }
    if (data.downstream_format_name) {
      _elements.push({ name: 'Downstream IGR', key: 'downstream' });
    }

    var _onSelect = (key) => {
      this.setState({ childIsProtein: key === 'protein' });
      this.setState({ childIsUpstream: key === 'upstream' });
      this.setState({ childIsDownstream: key === 'downstream' });
    };
    var _init = 'dna';
    if (this.state.childIsProtein) {
      _init = 'protein';
    } else if (this.state.childIsUpstream) {
      _init = 'upstream';
    } else if (this.state.childIsDownstream) {
      _init = 'downstream';
    }

    var radioNode = (
      <RadioSelector
        elements={_elements}
        onSelect={_onSelect}
        initialActiveElementKey={_init}
      />
    );
    var titleNode = (
      <div style={[style.textWrapper]}>
        <h1 style={[style.textElement]}>{nameNode}</h1>
        <p style={[style.textElement, style.description]}>{data.description}</p>
      </div>
    );
    if (this.props.hideTitle) {
      titleNode = null;
    }
    return (
      <div style={[style.headerWrapper]}>
        {titleNode}
        <div style={[style.radio]}>{radioNode}</div>
      </div>
    );
  },

  _renderDnaViz: function () {
    var data = this.state.data;
    var dnaSeqs = data.aligned_dna_sequences.map((d) => {
      return {
        name: d.strain_display_name,
        id: d.strain_id,
        href: d.strain_link,
        sequence: d.sequence,
      };
    });
    var variantData = data.variant_data_dna.map((d) => {
      return _.extend(d, { snpType: d.snp_type });
    });
    if (variantData.length === 0) return this._renderEmptyNode();
    var caption = this._getDateStr();
    return (
      <VariantViewerComponent
        name={data.name}
        chromStart={data.chrom_start}
        chromEnd={data.chrom_end}
        blockStarts={data.block_starts}
        blockSizes={data.block_sizes}
        contigName={data.contig_name}
        contigHref={data.contig_href}
        alignedDnaSequences={dnaSeqs}
        variantDataDna={variantData}
        dnaLength={data.dna_length}
        strand={'+'}
        orientation={data.strand}
        isProteinMode={false}
        isUpstreamMode={false}
        isDownstreamMode={false}
        downloadCaption={caption}
        isRelative={true}
      />
    );
  },

  _renderUpstreamViz: function () {
    var data = this.state.data;
    var dnaSeqs = data.upstream_aligned_dna_sequences.map((d) => {
      return {
        name: d.strain_display_name,
        id: d.strain_id,
        href: d.strain_link,
        sequence: d.sequence,
      };
    });
    var variantData = data.upstream_variant_data_dna.map((d) => {
      return _.extend(d, { snpType: d.snp_type });
    });
    var caption = this._getDateStr();
    var intergenicDisplayName =
      'between ' + data.upstream_format_name.replace('_', ' and ');
    if (variantData.length === 0)
      return this._renderEmptyNode(intergenicDisplayName);

    return (
      <VariantViewerComponent
        name={data.name}
        chromStart={data.upstream_chrom_start}
        chromEnd={data.upstream_chrom_end}
        blockStarts={data.upstream_block_starts}
        blockSizes={data.upstream_block_sizes}
        contigName={data.contig_name}
        contigHref={data.contig_href}
        alignedDnaSequences={dnaSeqs}
        variantDataDna={variantData}
        dnaLength={data.upstream_dna_length}
        strand={'+'}
        isProteinMode={false}
        isUpstreamMode={true}
        isDownstreamMode={false}
        intergenicDisplayName={intergenicDisplayName}
        downloadCaption={caption}
        isRelative={true}
      />
    );
  },

  _renderDownstreamViz: function () {
    var data = this.state.data;
    var dnaSeqs = data.downstream_aligned_dna_sequences.map((d) => {
      return {
        name: d.strain_display_name,
        id: d.strain_id,
        href: d.strain_link,
        sequence: d.sequence,
      };
    });
    var variantData = data.downstream_variant_data_dna.map((d) => {
      return _.extend(d, { snpType: d.snp_type });
    });

    var caption = this._getDateStr();
    var intergenicDisplayName =
      'between ' + data.downstream_format_name.replace('_', ' and ');
    if (variantData.length === 0)
      return this._renderEmptyNode(intergenicDisplayName);

    return (
      <VariantViewerComponent
        name={data.name}
        chromStart={data.downstream_chrom_start}
        chromEnd={data.downstream_chrom_end}
        blockStarts={data.downstream_block_starts}
        blockSizes={data.downstream_block_sizes}
        contigName={data.contig_name}
        contigHref={data.contig_href}
        alignedDnaSequences={dnaSeqs}
        variantDataDna={variantData}
        dnaLength={data.downstream_dna_length}
        strand={'+'}
        isProteinMode={false}
        isUpstreamMode={false}
        isDownstreamMode={true}
        intergenicDisplayName={intergenicDisplayName}
        downloadCaption={caption}
        isRelative={true}
      />
    );
  },

  _renderProteinViz: function () {
    var data = this.state.data;
    var proteinSeqs = data.aligned_protein_sequences.map((d) => {
      return {
        name: d.strain_display_name,
        id: d.strain_id,
        href: d.strain_link,
        sequence: d.sequence,
      };
    });
    // correct the fact that some ids are null for domains
    var _id;
    var _domains = data.protein_domains.map((d, i) => {
      _id = d.id || i;
      return _.extend(d, { id: _id });
    });
    var variantData = data.variant_data_protein.map((d) => {
      return _.extend(d, { snpType: 'nonsynonymous' });
    });
    if (variantData.length === 0) return this._renderEmptyNode();
    var caption = this._getDateStr();
    return (
      <VariantViewerComponent
        name={data.name}
        chromStart={data.chrom_start}
        chromEnd={data.chrom_end}
        contigName={data.contig_name}
        contigHref={data.contig_href}
        alignedProteinSequences={proteinSeqs}
        variantDataProtein={variantData}
        proteinLength={data.protein_length}
        strand={'+'}
        orientation={data.strand}
        isProteinMode={true}
        isUpstreamMode={false}
        isDownstreamMode={false}
        domains={_domains}
        downloadCaption={caption}
        isRelative={true}
      />
    );
  },

  _renderEmptyNode: function (intergenicDisplayName) {
    var isProtein = this.state.childIsProtein;
    var data = this.state.data;
    var numSequences = isProtein
      ? data.aligned_protein_sequences.length
      : data.aligned_dna_sequences.length;
    var contigTextNode = data.contig_href ? (
      <a href={data.contig_href}>{data.contig_name}</a>
    ) : (
      <span>{data.contig_name}</span>
    );
    var text;
    if (numSequences <= 1) {
      text =
        'Sequence is only available from one strain.  No comparison could be made.';
    } else {
      text = 'These sequences are identical.';
    }
    return (
      <div>
        <h3>
          Location: {contigTextNode} {data.chrom_start}..{data.chrom_end}{' '}
          {intergenicDisplayName}
        </h3>
        <p style={[style.emptyNode]}>{text}</p>
      </div>
    );
  },

  _getDateStr: function () {
    var now = new Date();
    var month = (now.getMonth() + 1).toString();
    var date = now.getDate().toString();
    if (month.length === 1) month = '0' + month;
    if (date.length === 1) date = '0' + date;
    var txt = 'SGD ' + now.getFullYear() + '-' + month + '-' + date;
    return txt;
  },
});

var style = {
  headerWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: -12,
  },
  textWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  textElement: {
    marginTop: 0,
    marginBottom: 0,
  },
  description: {
    marginBottom: '0.2rem',
    marginLeft: '1rem',
  },
  radio: {
    width: '100rem',
    marginTop: 5,
    marginRight: '2rem',
  },
  emptyNode: {
    marginTop: '5rem',
    textAlign: 'center',
  },
};

module.exports = Radium(AsyncVariantViewer);
