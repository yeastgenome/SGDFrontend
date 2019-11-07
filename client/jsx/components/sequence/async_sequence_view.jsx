import React from 'react';
import _ from 'underscore';

import HelpIcon from '../widgets/help_icon.jsx';
import HistoryTable from './history_table.jsx';
import SequenceDetailsModel from '../../models/sequence_details_model.jsx';
import SequenceNeighborsModel from '../../models/sequence_neighbors_model.jsx';
import SequenceComposite from './sequence_composite.jsx';
import SequenceToggler from './sequence_toggler.jsx';
import AsyncVariantViewer from "../variant_viewer/async_variant_viewer.jsx";
import VariantViewerStore from "../../stores/variant_viewer_store.jsx";

/*
  Fetches data from model and renders locus diagram (or loader while fetching).
*/
var AsyncSequenceView = React.createClass({

  getDefaultProps: function () {
    return {
      detailsCallback: null, // (err, detailsModel)
      geneticPosition: null,
      isSimplified: false, // simplified is for LSP
      locusDisplayName: null,
      locusHistoryData: null,
      locusFormatName: null,
      showAltStrains: true,
      showVariants: false,
      showOtherStrains: true,
      showHistory: true,
      locusId: null,
    };
  },

  getInitialState: function () {
    return {
      neighborsModel: null,
      detailsModel: null
    };
  },

  render: function () {
    var mainStrainNode = this._getMainStrainNode();
    var altStrainsNode = this._getAltStrainsNode();
    var variantNode = this._getVariantsNode();
    var otherStrainsNode = this._getOtherStrainsNode();
    var historyNode = this._getHistoryNode();

    return (<div>
      {mainStrainNode}
      {altStrainsNode}
      {variantNode}
      {otherStrainsNode}
      {historyNode}
    </div>);
  },

  componentDidMount: function () {
    this._fetchData();
  },

  // from locusId, get data and update
  _fetchData: function () {
    var _neighborsModel = new SequenceNeighborsModel({ id: this.props.locusId });
    _neighborsModel.fetch( (err, response) => {
      if (this.isMounted()) {
        this.setState({ neighborsModel: _neighborsModel });
        var _detailsModel = new SequenceDetailsModel({
          id: this.props.locusId,
          locusDiplayName: this.props.locusDisplayName,
          locusFormatName: this.props.locusFormatName,
          locusSGDID: this.props.locusSGDID
        });
        _detailsModel.fetch( (err, response) => {
          if (this.isMounted()) this.setState({ detailsModel: _detailsModel });

          // call details callback (if defined)
          if (this.props.detailsCallback) {
            this.props.detailsCallback(err, _detailsModel);
          }
        });
      }
    });
  },

  _getMainStrainNode: function () {
    var innerNode = (<SequenceComposite
      isSimplified={this.props.isSimplified}
      focusLocusDisplayName={this.props.locusDisplayName}
      focusLocusFormatName={this.props.locusFormatName}
      geneticPosition={this.props.geneticPosition}
      neighborsModel={this.state.neighborsModel}
      detailsModel={this.state.detailsModel}
      showAltStrains={false}
    />);

    if (this.props.isSimplified) {
      return <div>{innerNode}</div>;
    } else {
      return (<section id='reference'>
        {innerNode}
      </section>);
    }
  },

  _getAltStrainsNode: function () {
    var node = null;
    if (!this.props.showAltStrains) return node;
    if (this.state.detailsModel ? this.state.detailsModel.attributes.altStrainMetaData.length : false) {
      var _defaultAltStrainKey = this.state.detailsModel.attributes.altStrainMetaData[0].key;
      node = (<section id='alternative'><SequenceComposite
        focusLocusDisplayName={this.props.locusDisplayName}
        neighborsModel={this.state.neighborsModel}
        detailsModel={this.state.detailsModel}
        defaultAltStrainKey={_defaultAltStrainKey}
        showAltStrains={true}
        showSubFeatures={false}
      /></section>);
    }

    return node;
  },

  _getVariantsNode: function () {
    if (!this.props.showVariants) return null;
    var variantViewerStore = new VariantViewerStore();
    return (
      <section id='variants'>
        <h2>Variants</h2>
        <hr />
        <AsyncVariantViewer hideTitle sgdid={this.props.locusSGDID} store={variantViewerStore} />
      </section>
    );
  },  

  _getOtherStrainsNode: function () {
    var node = null
    if (!this.props.showOtherStrains) return node;
    if (this.state.detailsModel ? this.state.detailsModel.attributes.otherStrains.length : false) {
      var outerHelpNode = <HelpIcon text='Other laboratory, industrial, and environmental isolates; sequences available via the Download button.' isInfo={true} />;
      var innerHelpNode = <HelpIcon text='Select a strain using the pull-down in order to download its sequence as an .fsa file using the Download button located directly below.' />;
      node = (<section id='other'>
        <h2>Other Strains {outerHelpNode}</h2>
        <hr />
        <div className='panel sgd-viz'>
          <h3>Strains Available for Download {innerHelpNode}</h3>
          <SequenceToggler
            sequences={this.state.detailsModel.attributes.otherStrains}
            locusDisplayName={this.props.locusDisplayName} showSequence={false}
            buttonId='other_download'
          />
        </div>
      </section>);
    }

    return node;
  },

  _getHistoryNode: function () {
    var node = null;
    if (this.props.showHistory && this.props.locusHistoryData) {
      node = <HistoryTable data={this.props.locusHistoryData} dataType='SEQUENCE' />;
    }

    return node;
  },

});

export default AsyncSequenceView;
