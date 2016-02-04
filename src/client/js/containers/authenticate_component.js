import React from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux';

export function requireAuthentication(Component) {
  class AuthenticatedComponent extends React.Component {

    componentWillMount () {
      this.checkAuth();
    }

    componentWillReceiveProps (nextProps) {
      this.checkAuth();
    }

    checkAuth () {
      if (!this.props.isAuthenticated) {
        let redirectAfterLogin = this.props.location.pathname;
        this.props
          .dispatch(routeActions.push(`/login?next=${redirectAfterLogin}`));
      }
    }

    render () {
      return (
        <div>
          {this.props.isAuthenticated === true
            ? <Component {...this.props}/>
            : null
          }
        </div>
      );

    }
  }

  const mapStateToProps = state => ({
    token: state.auth.token,
    username: state.auth.username,
    isAuthenticated: state.auth.isAuthenticated
  });

  return connect(mapStateToProps)(AuthenticatedComponent);
}
