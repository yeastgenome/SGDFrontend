const React = require('react');
const _ = require('underscore');
const Radium = require('radium');
const DownloadButton = require('../widgets/download_button.jsx');

const PUBMED_BASE_URL = 'http://www.ncbi.nlm.nih.gov/pubmed/';
const GEO_BASE_URL = 'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=';

const SearchResult = React.createClass({
  propTypes: {
    category: React.PropTypes.string.isRequired,
    description: React.PropTypes.string,
    name: React.PropTypes.string.isRequired,
    href: React.PropTypes.string,
    download_metadata: React.PropTypes.object // uses _ not camel case for nested values { pubmed_ids, geo_ids, download_url }
  },

  getInitialState() {
    return {
      isFullDataVisible: false// only used for download results
    };
  },

  render: function () {
    let innerNode = this._getBasicResultNode();
    return (
      <div className='search-result' style={[style.wrapper]}>
        {innerNode}
      </div>
    );
  },

  _getBasicResultNode: function () {
    let description = this.props.description || '';
    let name = this.props.name || '(no name available)';
    return (
      <div>
        <h2 style={[style.title]}>
          <a href={this.props.href} dangerouslySetInnerHTML={{ __html: name }}></a> <span className='radius secondary label'>{this.props.category}</span>
        </h2>
        <p style={[style.description]} dangerouslySetInnerHTML={{ __html: description }}></p>
      </div>
    );
  },

  // not used for now
  _getDownloadResultNode: function () {
    let data = this.props.download_metadata;
    let pmidsNodes = null;
    if (data.pubmed_ids.length) {
      var _links = data.pubmed_ids.map( d => {
        return <li key={'searchPmid' + d}><a href={`${PUBMED_BASE_URL}'${d}`} target='_new'>{d}</a> </li>;
      });
      pmidsNodes = <ul className='inline-list clearfix' style={[style.resourceList]}><li>PUBMED:</li>{_links}</ul>;
    }

    let geoNodes = null;
    if (data.geo_ids.length) {
      var _links = data.geo_ids.map( d => {
        return <li key={'geo' + d}><a href={`${GEO_BASE_URL}${d}`} target='_new'>{d}</a> </li>;
      });
      geoNodes = <ul className='inline-list clearfix' style={[style.resourceList]}><li>GEO:</li>{_links}</ul>;
    }

    return (
      <div>
        <h2 style={[style.title]}>
          <a href={this.props.href} target='_new'>{name}</a> <span className='radius secondary label'>{this.props.category}</span>
        </h2>
        <p style={[style.description]}>{this.props.description}</p>
        <div>
            <dl className='key=value'>
              <dt>Title</dt>
              <dd>{data.title}</dd>
              <dt>Citation</dt>
              <dd>Experiment Type</dd>
              <dt></dt>
              <dd>Summary</dd>
              <dt></dt>
              <dd>Keywords</dd>
              <dt></dt>
              <dd>PUBMED ID(s)</dd>
              <dt></dt>
              <dd>Samples</dd>
              <dt></dt>
            </dl>
        </div>
        <div>
          <DownloadButton url={data.download_url} extension='.gz' />
        </div>
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
  title: {
    marginBottom: 0
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
  resourceList: {
    marginTop: '0.25rem',
    marginBottom: '0.25rem'
  }
}

module.exports = Radium(SearchResult);
