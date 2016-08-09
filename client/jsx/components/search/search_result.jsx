const React = require('react');
const _ = require('underscore');
const Radium = require('radium');
const DownloadButton = require('../widgets/download_button.jsx');

const CROPPED_LOCI_SIZE = 100;

const SearchResult = React.createClass({
  propTypes: {
    category: React.PropTypes.string.isRequired,
    description: React.PropTypes.string,
    highlights: React.PropTypes.object,
    name: React.PropTypes.string.isRequired,
    href: React.PropTypes.string,
    loci: React.PropTypes.array // i.e. ['rad54', ...]
  },

  getInitialState() {
    return {
      isLociCropped: true
    };
  },

  render () {
    let innerNode = this._getBasicResultNode();
    return (
      <div className='search-result' style={[style.wrapper]}>
        {innerNode}
      </div>
    );
  },

  _getBasicResultNode () {
    let name = this.props.name || '(no name available)';
    return (
      <div>
        <div className='search-result-title-container' style={[style.titleContainer]}>
          <h2 style={[style.title]}>
            <a href={this.props.href}>{name}</a>
          </h2>
          <span><span className={`search-cat ${this.props.category}`}/> {this.props.categoryName}</span>
        </div>
        {this._renderHighlightsNode()}
        {this._renderDisplayedLoci()}
      </div>
    );
  },

  _renderDisplayedLoci () {
    // TEMP
    return null;
    //
    
    let loci = this.props.loci;
    let totalLoci = this.props.loci;
    if (!loci || loci.length === 0) return null;
    const labelSuffix = (loci.length > 1) ? 's' : '';
    const onToggleCrop = e => {
      e.preventDefault();
      this.setState({ isLociCropped: !this.state.isLociCropped });
    };
    // crop loci if necessary and show a message for UI
    let cropMessage;
    let actionMessageNode;
    if (totalLoci.length <= CROPPED_LOCI_SIZE) {
      cropMessage =  `${totalLoci.length.toLocaleString()} associated gene${labelSuffix}`;
      actionMessageNode = null;
    } else if (this.state.isLociCropped) {
      loci = loci.slice(0, CROPPED_LOCI_SIZE);
      cropMessage = `Showing ${CROPPED_LOCI_SIZE} of ${totalLoci.length.toLocaleString()} associated gene${labelSuffix}`;
      actionMessageNode = <a onClick={onToggleCrop}>Show All</a>;
    } else {
      cropMessage = `Showing all ${totalLoci.length.toLocaleString()} associated gene${labelSuffix}`;
      actionMessageNode = <a onClick={onToggleCrop}>Show {CROPPED_LOCI_SIZE}</a>;
    }
    
    let nodes = loci.map( (d, i) => {
      let separatorNode = (i === loci.length - 1) ? null : <span> | </span>;
      let href = `/locus/${d}/overview`;
      return <span key={`${this.props.href}.searchLocusLink${i}`}><a href={href}>{d}</a>{separatorNode}</span>;
    });

    return (
      <div>
        <div><span>{cropMessage} {actionMessageNode}</span></div>
        <p style={[style.geneList]}>{nodes}</p>
      </div>
    );
  },

  // if highlights, returns highlighted HTML in <dl>, otherise description
  _renderHighlightsNode () {
    // format highlights
    let highlightKeys = this.props.highlights ? Object.keys(this.props.highlights) : [];
    let highlightNodes = highlightKeys.map( (d, i) => {
      let highLabel = d.replace(/_/g, ' ');
      let highVal = this.props.highlights[d].join('...');
      return <p style={[style.description]} key={`resHigh${i}`}><span style={[style.highlightKey]}>{highLabel}</span>: <span dangerouslySetInnerHTML={{ __html: highVal }} /></p>;
    });
    return (
      <div>
        <p style={[style.description, style.primaryDescription]}>{this.props.description}</p>
        {highlightNodes}
      </div>
    );
  }
});

const style = {
  wrapper: {
    borderBottom: '1px solid #ddd',
    paddingBottom: '1rem',
    marginBottom: '1rem'
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  title: {
    marginBottom: 0,
    width: '75%'
  },
  description: {
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    'WebkitLineClamp': 2,
    'WebkitBoxOrient': 'vertical',
    overflow: 'hidden',
    maxHeight: '3.6rem',
    marginBottom: 0
  },
  primaryDescription: {
    marginBottom: '0.5rem'
  },
  geneList: {
    marginBottom: 0
  },
  highlightKey: {
    fontWeight: 'bold'
  },
  resourceList: {
    marginTop: '0.25rem',
    marginBottom: '0.25rem'
  }
};

module.exports = Radium(SearchResult);
