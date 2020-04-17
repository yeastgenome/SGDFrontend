/**
 * author: fgondwe@stanford.edu
 * date: 02/09/2018
 * purpose: render radio button for status e.g downloads_page
 */
import React, { Component } from 'react';
import S from 'string';
import ClassNames from 'classnames';
import PropTypes from 'prop-types';

class StatusBtns extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let cStyle = { marginLeft: '0.2rem' };
    let activityStyle = this.props.flag ? 'active-agg' : 'inactive-agg';
    let klass = this.props.flag ? 'search-agg active' : 'search-agg';
    if (this.props.flag) {
      cStyle = { color: 'white', marginLeft: '0.2rem' };
    }
    let key = this.props.keyValue;
    return (
      <div
        key={`agg1${key}`}
        className={ClassNames(klass, activityStyle, 'status-btn')}
      >
        <label className={'status-btn-label'}>
          <input
            type="radio"
            value={this.props.name}
            checked={this.props.flag}
            name={this.props.name}
            onChange={this.props.btnClick}
            key={key}
          />
          <span style={cStyle}>{S(this.props.name).capitalize().s}</span>
        </label>
      </div>
    );
  }
}

StatusBtns.propTypes = {
  keyValue: PropTypes.any,
  name: PropTypes.any,
  btnClick: PropTypes.any,
  flag: PropTypes.any,
};

export default StatusBtns;
