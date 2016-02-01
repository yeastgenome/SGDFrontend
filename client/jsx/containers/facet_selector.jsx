import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Radium from 'radium';

const SEARCH_URL = '/search';

const FacetSelector = React.createClass({
  render() {
    let klass = this.props.isMobile ? '' : 'panel';
    return (
      <div className={klass} style={[style.panel]}>
        {this.props.activeCategory ? this._renderCatAggs() : this._renderCatSelector()}
      </div>
    );
  },

  _renderCatSelector () {
    let keySuffix = this.props.isMobile ? 'm': '';
    let aggNodes = this.props.categoryAggs.map( (d, i) => {
      let key = `aggNode${d.key}${keySuffix}`;
      let href = `${this._getRawUrl()}&category=${d.key}`;
      return this._renderAgg(d.name, d.total, d.key, href);
    });
    return (
      <div>
        <h3>Categories</h3>
        {aggNodes}
      </div>
    );
  },

  _renderCatAggs () {
    return (
      <div>
        <p><Link to={this._getRawUrl()}><i className='fa fa-chevron-left'/> Show all categories</Link></p>
        <h3>{this.props.activeCategoryName}</h3>
      </div>
    );
  },

  _renderAgg (name, total, _key, href) {
    return (
      <Link to={href} key={_key}>
        <div style={[style.agg, style.inactiveAgg]}>        
          <span>{name}</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </Link>
    );
  },

  _getRawUrl () {
    return `${SEARCH_URL}?q=${this.props.query}`;
  }
});




const LINK_COLOR = '#11728b';
var style = {
  agg: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    marginBottom: '0.25rem',
    borderRadius: '0.25rem',
    userSelect: 'none'
  },
  activeAgg: {
    background: LINK_COLOR,
    color: 'white',
    border: '1px solid #e6e6e6',
    ':hover': {
      background: LINK_COLOR
    }
  },
  inactiveAgg: {
    background: 'none',
    color: LINK_COLOR,
    border: '1px solid transparent',
    ':hover': {
      background: '#e6e6e6'
    }
  },
  panel: {
    marginTop: '0.5rem'
  },
};


function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    query: state.query,
    activeCategory: state.activeCategory,
    activeCategoryName: state.activeCategoryName,
    categoryAggs: state.categoryAggs,
    secondaryAggs: state.secondaryAggs
  };
};

module.exports = connect(mapStateToProps)(Radium(FacetSelector));
