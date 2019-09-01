import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import PropTypes from 'prop-types';

import fetchData from '../lib/fetchData';
import { authenticateUser } from '../actions/authActions';

export function requireAuthentication(Component) {
  class AuthenticatedComponent extends React.Component {
    componentWillMount () {
      this.checkAuth();
    }

    componentWillReceiveProps () {
      this.checkAuth();
    }

    checkAuth () {
      if (!this.props.isAuthenticated) {
        fetchData('/account').then( (d) => {
          this.props.dispatch(authenticateUser(d));
        }).catch( () => {
          let redirectAfterLogin = this.props.location.pathname;
          this.props
            .dispatch(push(`/login?next=${redirectAfterLogin}`));
        });
      }
    }

    render () {
      return (
        <div>
          {this.props.isAuthenticated === true
            ? <Component {...this.props} />
            : null
          }
        </div>
      );
    }
  }

  AuthenticatedComponent.propTypes = {
    dispatch: PropTypes.func,
    isAuthenticated: PropTypes.bool,
    location: PropTypes.object
  };

  const mapStateToProps = state => ({
    isAuthenticated: state.auth.get('isAuthenticated')
  });

  return connect(mapStateToProps)(AuthenticatedComponent);
}
