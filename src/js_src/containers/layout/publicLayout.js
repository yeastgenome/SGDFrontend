import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import style from './style.css';
import { clearError, clearMessage } from '../../actions/metaActions';

class PublicLayout extends Component {
  renderError() {
    if (!this.props.error) return null;
    let handleClick = () => {
      this.props.dispatch(clearError());
    };
    return (
      <div className={`alert callout ${style.errorContainer}`}>
        <h3 className={style.closeIcon} onClick={handleClick}><i className='fa fa-close' /></h3>
        <p>
          {this.props.error}
        </p>
      </div>
    );
  }

  renderMessage() {
    if (!this.props.message) return null;
    let handleClick = () => {
      this.props.dispatch(clearMessage());
    };
    return (
      <div className={`primary callout ${style.errorContainer}`}>
        <h3 className={style.closeIcon} onClick={handleClick}><i className='fa fa-close' /></h3>
        <p dangerouslySetInnerHTML={{ __html: this.props.message}} />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderError()}
        <div className='row'>
          <div className='small-centered small-10'>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

PublicLayout.propTypes = {
  children: PropTypes.node,
  error: PropTypes.string,
  message: PropTypes.string,
  dispatch: PropTypes.func
};

function mapStateToProps(state) {
  return {
    error: state.meta.get('error'),
    message: state.meta.get('message'),
  };
}

export default connect(mapStateToProps)(PublicLayout);
