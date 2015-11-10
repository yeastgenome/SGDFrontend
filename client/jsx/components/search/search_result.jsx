var React = require('react');
var _ = require('underscore');
var Radium = require('radium');

var SearchResult = React.createClass({
  propTypes: {
    category: React.PropTypes.string.isRequired,
    description: React.PropTypes.string,
    name: React.PropTypes.string.isRequired,
    href: React.PropTypes.string.isRequired,
  },

  render: function () {
    var innerNodeFns = {
      gene: this._getBasicResultNode,
      download: this._getDownloadResultNode,
    };

    return (
      <div style={[style.wrapper]}>
        {innerNodeFns['gene']()}
      </div>
    );
  },

  _getBasicResultNode: function () {
    let description = this.props.description || "(no description available)";
    let name = this.props.name || "(no name available)";
    return (
      <div>
        <h3 style={[style.title]}>
          <a href={this.props.href}>{name}</a> <span className='radius secondary label'>{this.props.category}</span>
        </h3>
        <p style={[style.description]}>{description}</p>
      </div>
    );
  },

  _getDownloadResultNode: function (d, i) {
    var d = this.props.d;
    var i = this.props.i;
    var pmidsNodes = null;
    var pubmedData = d.pubmed_data || [];
    if (pubmedData.length) {
      var _links = _.map(pubmedData, (_d, _i) => {
        return <li key={"searchPmid" + i + "_" + _i}><a href={_d.link_url}>{_d.pmid}</a> </li>;
      });
      pmidsNodes = <ul className="inline-list clearfix"><li>PUBMED:</li>{_links}</ul>;
    }

    var geoNodes = null;
    var geoData = d.geo_data || [];
    if (geoData.length) {
      var _links = _.map(geoData, (_d, _i) => {
        return <li key={"searchPmid" + i + "_" + _i}><a href={_d.link_url}>{_d.geo_id}</a> </li>;
      });
      geoNodes = <ul className="inline-list clearfix"><li>GEO:</li>{_links}</ul>;
    }

    return (
      <div>
        <h3 style={[style.title]}>{d.name}</h3>
        <p>{d.description}</p>
        <div>
          {pmidsNodes}
          {geoNodes}
        </div>
        <div>
          <DownloadButton url={d.url} extension=".gz" />
        </div>
      </div>
    );
  }
});

const style = {
  wrapper: {
    borderBottom: "1px solid #ddd",
    paddingBottom: "1rem",
    marginBottom: "1rem"
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
  }
}

module.exports = Radium(SearchResult);
