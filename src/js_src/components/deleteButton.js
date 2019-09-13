import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setError } from '../actions/metaActions';
import fetchData from '../lib/fetchData';

class DeleteButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false
    };
  }

  UNSAFE_componentDidMount() {
    this._isMounted = true;
  }

  UNSAFE_componentWillUnmount() {
    this.isMounted = false;
  }

  handleClick(e) {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete? This may not be possible to reverse.')) {
      let options = {
        type: 'DELETE',
        headers: {
          'X-CSRF-Token': window.CSRF_TOKEN
        }
      };
      this.setState({ isPending: true });
      fetchData(this.props.url, options).then(this.props.onSuccess).catch( (data) => {
        if (this._isMounted) {
          this.setState({ isPending: false });
        }
        let errorMessage = data ? data.message : 'Unable to delete.';
        this.props.dispatch(setError(errorMessage));
      });
    }
  }

  render() {
    let label = this.props.label || 'Delete';
    let classSuffix = this.state.isPending ? ' disabled' : '';
    return <a className={`button alert${classSuffix}`} onClick={this.handleClick.bind(this)}><i className='fa fa-trash' /> {label}</a>;
  }
}

DeleteButton.propTypes = {
  dispatch: PropTypes.func,
  url: PropTypes.string,
  label: PropTypes.string,
  onSuccess: PropTypes.func
};

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(DeleteButton);
