/*
  A react component which can render locus diagrams, sub-feature tables, and a sequence toggler.
  If it doesn't have the models, returns the right loaders
*/
import React from 'react';
import _ from 'underscore';

import DataTable from "../widgets/data_table.jsx";
import DownloadButton from "../widgets/download_button.jsx";
import DropdownSelector  from "../widgets/dropdown_selector.jsx";
import HelpIcon  from "../widgets/help_icon.jsx";
import LocusDiagram from "../viz/locus_diagram.jsx";
import MultiSequenceDownload from "./multi_sequence_download.jsx";
import SequenceToggler from "./sequence_toggler.jsx";


const Loader = React.createClass({
  render () {
    return <div className='sgd-loader-container'><div className='sgd-loader'></div></div>;
  }
});

const SequenceComposite = React.createClass({
  getDefaultProps: function () {
    return  {
      isSimplified: false, // simplified is for LSP
      geneticPosition: null,
      neighborsModel: null,
      detailsModel: null,
      focusLocusDisplayName: null,
      showAltStrains: false,
      showSequence: true,
      showSubFeatures: true,
      showSubFeaturesTable: true,
    };
  },

  getInitialState: function () {
    var _strainKey = null;
    if (this.props.defaultAltStrainKey) {
      _strainKey = this.props.defaultAltStrainKey;
    }

    return {
      activeStrainKey: _strainKey
    };
  },

  render: function () {
    if (!this.props.neighborsModel && !this.props.detailsModel) {
      return <Loader />;
    } else {
      var titleNode = this._getTitleNode();
      var neighborsNode = this._getNeighborsNode();
      var detailsNode = this._getDetailsNode();
      var sequenceNode = this._getSequenceNode();
      return (<div>
        {titleNode}
        {neighborsNode}
        {detailsNode}
        {sequenceNode}
      </div>);
    }
  },

  _getStrainSelectorNode: function () {
    var node = null;
    if (this.props.showAltStrains && this.props.detailsModel && this.state.activeStrainKey) {
      var _elements = _.map(this.props.detailsModel.attributes.altStrainMetaData, (s, i) => {
        return {
          value: s.key,
          name: s.name,
          description: s.description
        };
      });
      var _onChange = (key) => {
        this.setState({ activeStrainKey: key });
      };
      node = <DropdownSelector elements={_elements} onChange={_onChange} />;        
    }

    return node;
  },

  _getTitleNode: function () {
    var node;
    if (this.props.showAltStrains) {
      var selectNode = this._getStrainSelectorNode();
      var helpNode = <HelpIcon text="Alternative Reference strains are major laboratory yeast strains with a substantial history of use and experimental results. These strains include W303, Sigma1278b, SK1, SEY6210, CEN.PK, D273-10B, JK9-3d, FL100, RM11-1a, and Y55." isInfo={true} />;
      node = (<div>
        <h2>Alternative Reference Strains {helpNode}</h2>
        <hr />
        {selectNode}
      </div>);
    } else {
      var helpNode = <HelpIcon text={"<span>The <i>S. cerevisiae</i> reference genome sequence is derived from laboratory strain S288C.</span>"} isInfo={true} />;
      var _jbHref = "https://browse.yeastgenome.org/?loc=" + this.props.focusLocusFormatName;
      node = (<div>
        <div className="row title-right-text">
          <div className="columns small-6">
            {this.props.isSimplified ? this._getSimplifiedSequenceNode() : <h2>Reference Strain: S288C {helpNode}</h2>}
          </div>
          <div className="columns small-6">
            <p className="text-right locus-external-links">View in: <a href={_jbHref}>JBrowse</a></p>
          </div>
        </div>
        {this.props.isSimplified ? null : <hr />}
      </div>);
      
    }

    return node;
  },

  _getNeighborsNode: function () {
    var node = <Loader />;
    if (this._canRenderNeighbors()) {
      var attr = this._getActiveStrainNeighborsData();
      if (!attr) return null;
      var geneticPositionNode = this.props.geneticPosition ? <dl className="key-value"><dt>Genetic Position</dt><dd id="genetic_position">{this.props.geneticPosition}</dd></dl> : null;
      node = (<div className="panel sgd-viz">
        <h3 className="sequence-viz-label">
          <span dangerouslySetInnerHTML={{ __html: this.props.focusLocusDisplayName }} /> Location: <a href={attr.contigData.href}>{attr.contigData.name}</a> {attr.focusLocusDomain[0]}..{attr.focusLocusDomain[1]}
        </h3>
        <LocusDiagram
          contigData={attr.contigData}
          data={attr.data}
          domainBounds={attr.domainBounds}
          focusLocusDisplayName={this.props.focusLocusDisplayName}
          showSubFeatures={false}
          watsonTracks={Math.abs(attr.trackDomain[1])}
          crickTracks={Math.abs(attr.trackDomain[0])}
        />
        {geneticPositionNode}
      </div>);
    }
    return node;
  },

  _getDetailsNode: function () {
    if (!this.props.showSubFeatures) return null;

    var innerNode = <Loader />;
    var tableNode = null;
    var downloadNode = null;
    if (this._canRenderDetails()) {
      var attr = this._getActiveStrainDetailsData();
      innerNode = (<LocusDiagram
        contigData={attr.contigData}
        data={attr.data}
        domainBounds={attr.domainBounds}
        focusLocusDisplayName={this.props.focusLocusDisplayName}
        showSubFeatures={true}
        watsonTracks={Math.abs(attr.trackDomain[1])}
        crickTracks={Math.abs(attr.trackDomain[0])}
      />);

      tableNode = this._getSubFeaturesTable();
      var _params = _.extend(this.props.detailsModel.attributes.subFeatureDownloadData, { display_name: `${this.props.focusLocusDisplayName}_subfeatures` });
      downloadNode = this.props.isSimplified ? null : <DownloadButton buttonId="subfeature_table_download" url="/download_table" params={_params} />;

    }

    return (<div className="panel sgd-viz sequence-details-container">
      {innerNode}
      {tableNode}
      {downloadNode}
    </div>);
  },
  _getSequenceNode: function () {
    if (!this.props.showSequence || this.props.isSimplified) return null;

    var innerNode = <Loader />;
    if (this._canRenderDetails()) {
      var _buttonId = this.props.showAltStrains ? "alternative_download" : "reference_download";
      var _text = this.props.showAltStrains ? "Sequence" : "Sequence - S288C";
      var _detailsData = this._getActiveStrainDetailsData()
      var _sequences = _detailsData.sequences;
      var _contigName = _detailsData.contigData.formatName;
      innerNode = (<SequenceToggler
        sequences={_sequences} text={_text}
        locusDisplayName={this.props.focusLocusDisplayName} locusFormatName={this.props.focusLocusFormatName}
        contigName={_contigName} showCustomRetrieval={!this.props.showAltStrains}
        subFeatureData={_detailsData.data.locci[0].tags} buttonId={_buttonId}
      />);
    }

    return <div className="panel sgd-viz">{innerNode}</div>;
  },

  _canRenderNeighbors: function () {
    return (this.props.neighborsModel && (!this.props.showAltStrains || this.state.activeStrainKey));
  },

  _canRenderDetails: function () {
    return (this.props.detailsModel && (!this.props.showAltStrains || this.state.activeStrainKey));
  },

  _getSubFeaturesTable: function () {
    if (!this.props.showSubFeaturesTable && !this._canRenderDetails()) return null;

    var _options = {
      aaSorting: [[1, "asc"]],
      aoColumns: [
        null, { "sType": "range" }, { "sType": "range" }, null, null
      ],
      bPaginate: false,
      oLanguage: { "sEmptyTable": "No subfeatures for " + this.props.focusLocusDisplayName + '.' }
    };
    var _tableData = this._getActiveStrainDetailsData().tableData;
    return <DataTable data={_tableData} usePlugin={true} pluginOptions={_options} tableId="subfeature_table" />;
  },

  _getActiveStrainNeighborsData: function () {
    if (this.props.showAltStrains) {
      return _.findWhere(this.props.neighborsModel.attributes.altStrains, { strainKey: this.state.activeStrainKey });
    } else {
      return this.props.neighborsModel.attributes.mainStrain;
    }
  },

  _getActiveStrainDetailsData: function () {
    if (this.props.showAltStrains) {
      return _.findWhere(this.props.detailsModel.attributes.altStrains, { strainKey: this.state.activeStrainKey });
    } else {
      return this.props.detailsModel.attributes.mainStrain; 
    }
  },

  _getSimplifiedSequenceNode: function () {
    if (this.props.detailsModel) {
      var attr = this._getActiveStrainDetailsData();
      return (<MultiSequenceDownload
        sequences={attr.sequences} locusDisplayName={this.props.focusLocusDisplayName}
        contigName={attr.contigData.name} locusFormatName={this.props.focusLocusFormatName}
      />);
    } else {
      return <a className="button dropdown small secondary disabled multi-sequence-download-button"><i className="fa fa-download" /> Download (.fsa)</a>;
    }   
  }
});

export default SequenceComposite;
