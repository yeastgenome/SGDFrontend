var React = require('react');
var Radium = require('radium');

var ColorScaleLegend = require('./color_scale_legend.jsx');
var Dendrogram = require('./dendrogram.jsx');
var HelpIcon = require('../widgets/help_icon.jsx');
var RadioSelector = require('../widgets/radio_selector.jsx');
var SearchBar = require('../widgets/search_bar.jsx');
var SettingsDropdown = require('./settings_dropdown.jsx');
var ScrollyHeatmap = require('./scrolly_heatmap.jsx');
var StrainSelector = require('./strain_selector.jsx');
var VariantViewerStore = require('../../stores/variant_viewer_store.jsx');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

var VariantViewer = createReactClass({
  // mixins: [Navigation, State],
  displayName: 'VariantViewer',

  propTypes: {
    store: PropTypes.object.isRequired,
    visibleLocusId: PropTypes.string,
    children: PropTypes.any,
    history: PropTypes.any,
  },

  getDefaultProps: function () {
    return {
      store: new VariantViewerStore(),
      visibleLocusId: null,
    };
  },

  getInitialState: function () {
    return {
      isPending: true,
      isProteinMode: false,
      labelsVisible: true,
    };
  },

  render: function () {
    var helpText =
      'SGD’s Variant Viewer displays similarity scores and sequence variants for open reading frames (ORFs) within a reference panel of 12 widely-used <i>S. cerevisiae</i> genomes. All scores and variants are presented relative to the S288C reference genome. The sequence data are all from Song et al., 2015. AGAPE (Automated Genome Analysis PipelinE) for Pan-Genome Analysis of <i>Saccharomyces cerevisiae</i>. PLoS One 10(3):e0120671 PMID:25781462';
    return (
      <div>
        {React.cloneElement(this.props.children, {
          isProteinMode: this.state.isProteinMode,
        })}
        <h1>
          <span style={{ marginRight: '0.5rem' }}>Variant Viewer</span>
          <HelpIcon text={helpText} />
        </h1>
        <hr />
        {this._renderControls()}
        {this._renderViz()}
      </div>
    );
  },

  componentDidMount: function () {
    this.__isMounted = true;
    this.props.store.fetchInitialData((err) => {
      this.setState({ isPending: false });
    });
  },

  componentWillUnmount() {
    this.__isMounted = false;
  },

  _renderControls: function () {
    var radioElements = [
      { name: 'DNA', key: 'dna' },
      { name: 'Protein', key: 'protein' },
    ];
    var radioOnSelect = (key) => {
      this.setState({ isProteinMode: key === 'protein' }, () => {
        this.props.store.setIsProteinMode(this.state.isProteinMode);
      });
    };
    var onSettingsUpdate = this.forceUpdate.bind(this);

    return (
      <div>
        {this._renderLocus()}
        <div className="row">
          <div className="columns small-12 large-6">
            {this._renderSearchBar()}
          </div>
          <div
            className="columns small-12 large-6 end"
            style={[style.vizWrapper]}
          >
            <div className="row">
              <div className="columns small-3">
                <StrainSelector
                  store={this.props.store}
                  onUpdate={onSettingsUpdate}
                />
              </div>
              <div className="columns small-5">
                <div
                  style={{
                    marginTop: '0.5rem',
                    marginLeft: '1.8rem',
                    minWidth: '13rem',
                  }}
                >
                  <RadioSelector
                    elements={radioElements}
                    onSelect={radioOnSelect}
                    initialActiveElementKey="dna"
                  />
                </div>
              </div>
              <div
                className="columns small-4 end"
                style={{ textAlign: 'right' }}
              >
                <SettingsDropdown
                  store={this.props.store}
                  onUpdate={onSettingsUpdate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  _renderLocus: function () {
    if (!this.props.visibleLocusId) return null;
    return <h1>{this.props.visibleLocusId}</h1>;
  },

  _renderViz: function () {
    if (this.state.isPending)
      return (
        <div className="sgd-loader-container">
          <div className="sgd-loader" />
        </div>
      );
    var heatmapData = this.props.store.getHeatmapData();
    if (heatmapData.length === 0) return this._renderEmptyNode();
    return (
      <div>
        {this._renderDendro()}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          {this._renderHeatmap()}
          {this._renderHeatmapNav()}
          <div style={{ marginLeft: 'auto' }}>
            <ColorScaleLegend />
          </div>
        </div>
      </div>
    );
  },

  _renderDendro: function () {
    var _data = this.props.store.getClusteredStrainData();
    var _left = this.state.labelsVisible ? LABEL_WIDTH : 0;
    var _width =
      this.props.store.getHeatmapStrainData().length * (NODE_SIZE + 0.5);
    var _height = 150;
    return (
      <div style={{ marginLeft: _left, height: _height, marginBottom: 5 }}>
        <Dendrogram data={_data} width={_width} height={_height} />
      </div>
    );
  },

  _renderHeatmap: function () {
    var _heatmapData = this.props.store.getHeatmapData();
    var _strainData = this.props.store.getHeatmapStrainData();
    var _zoom = this.props.store.getHeatmapZoom();
    var _onClick = (d) => {
      this.props.history.push('/' + d.id);
    };
    return (
      <ScrollyHeatmap
        data={_heatmapData}
        onClick={_onClick}
        strainData={_strainData}
        nodeSize={_zoom}
      />
    );
  },

  _renderHeatmapNav: function () {
    var zoom = this.props.store.zoomHeatmap;
    var zoomIn = (e) => {
      zoom(1);
      this.forceUpdate();
    };
    var zoomOut = (e) => {
      zoom(-1);
      this.forceUpdate();
    };

    return (
      <div>
        <div key="zoomBtn1" onClick={zoomIn} style={[style.button]}>
          <i className="fa fa-plus" />
        </div>
        <div
          key="zoomBtn2"
          onClick={zoomOut}
          style={[style.button, { borderTop: '1px solid #b9b9b9' }]}
        >
          <i className="fa fa-minus" />
        </div>
      </div>
    );
  },

  _renderSearchBar: function () {
    var _onSubmit = (query) => {
      this.props.store.setQuery(query);
      this.submitSearch();
    };
    // var _text = 'Enter gene name, GO term, chromosome, or list of gene names';
    var _text = 'Enter gene names (comma-separated) or a GO term (eg “ascospore”)';
    return <SearchBar placeholderText={_text} onSubmit={_onSubmit} />;
  },

  // this._pendingTimer
  // cb(err)
  submitSearch: function (cb) {
    if (this._pendingTimer) clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => {
      this.setState({ isPending: true });
    }, MIN_PENDING_TIME);
    this.props.store.fetchSearchResults((err) => {
      if (this.__isMounted) {
        this.props.store.clusterStrains((err) => {
          if (this._pendingTimer) clearTimeout(this._pendingTimer);
          this.setState({ isPending: false });
          if (typeof cb === 'function') return cb(err);
        });
      }
    });
  },

  _renderEmptyNode: function () {
    var text = `No results for "${this.props.store.getQuery()}."  Please enter valid gene/ORF names or SGDID (comma-separated) or double-quoted GO term (eg "actin binding") and try again.`;
    return <h3>{text}</h3>;
  },
});

var style = {
  vizWrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  button: {
    userSelect: 'none',
    backgroundColor: '#e7e7e7',
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#b9b9b9',
    },
  },
};

var LABEL_WIDTH = 100;
var NODE_SIZE = 16;
var MIN_PENDING_TIME = 250; // millis before loading state invoked

module.exports = Radium(VariantViewer);
