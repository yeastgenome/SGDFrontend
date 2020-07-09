import React from 'react';
import Radium from 'radium';
import { connect } from 'react-redux';
import createReactClass from 'create-react-class';
import ColleaguesFormShow from './colleagues_form_show.jsx';
import PropTypes from 'prop-types';

const ColleaguesShow = createReactClass({
  propTypes: {
    match: PropTypes.any,
  },
  render() {
    return (
      <div style={[style.container]}>
        <ColleaguesFormShow
          isReadOnly={true}
          isCurator={false}
          colleagueDisplayName={this.props.match.params.formatName}
        />
        <a className="button secondary small" href="/colleague_update">
          Update Colleague
        </a>
      </div>
    );
  },
});

const style = {
  container: {
    marginBottom: '2rem',
  },
};

function mapStateToProps(_state) {
  return {};
}

export default connect(mapStateToProps)(Radium(ColleaguesShow));
