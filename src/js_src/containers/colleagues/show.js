import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
// import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import CategoryLabel from '../../components/categoryLabel';
import CurateLayout from '../curateHome/layout';
import ColleagueForm from '../../components/colleagueForm';
import DeleteButton from '../../components/deleteButton';
import { setMessage } from '../../actions/metaActions';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_BASE_URL = '/colleagues/triage';

class ColleagueTriageShow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    let url = `${DATA_BASE_URL}/${this.props.match.params.id}`;
    fetchData(url).then( _data => {
      this.setState({ data: _data });
    });
  }

  handleDelete() {
    this.props.dispatch(push({ pathname: '/colleagues/triage' }));
    this.props.dispatch(setMessage('Colleague triage entry was deleted.'));
  }

  handleComplete() {
    this.props.dispatch(push({ pathname: '/colleagues/triage' }));
    this.props.dispatch(setMessage('Colleague entry was successfully updated.'));
  }

  renderForm() {
    let data = this.state.data;
    let url = `${DATA_BASE_URL}/${this.props.match.params.id}/promote`;
    if (data) {
      return (
        <div>
          <h3><CategoryLabel category='colleague' hideLabel /> Colleague: {data.first_name} {data.last_name}</h3>
          <ColleagueForm defaultData={data} onComplete={this.handleComplete.bind(this)} submitUrl={url} requestMethod='PUT' />
        </div>
      );
    }
    return <Loader />;
  }

  renderActions() {
    let deleteUrl = `${DATA_BASE_URL}/${this.props.match.params.id}`;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
        <DeleteButton label='Discard colleague update' url={deleteUrl} onSuccess={this.handleDelete.bind(this)} />
      </div>
    );
  }

  render() {
    return (
      <CurateLayout>
        <div>
          {this.renderForm()}
          {this.renderActions()}
        </div>
      </CurateLayout>
    );
  }
}

ColleagueTriageShow.propTypes = {
  match: PropTypes.object,
  dispatch: PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(ColleagueTriageShow);
