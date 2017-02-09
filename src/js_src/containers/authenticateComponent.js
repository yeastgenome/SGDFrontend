import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

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
        let redirectAfterLogin = this.props.location.pathname;
        this.props
          .dispatch(push(`/login?next=${redirectAfterLogin}`));
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
    dispatch: React.PropTypes.func,
    isAuthenticated: React.PropTypes.bool,
    location: React.PropTypes.object
  };

  const mapStateToProps = state => ({
    isAuthenticated: state.auth.get('isAuthenticated')
  });

  return connect(mapStateToProps)(AuthenticatedComponent);
}
