import React from 'react';
import Loader from '../../components/widgets/loader';

const COLLEAGUE_GET_URL = '/colleagues';

const ColleaguesShow = React.createClass({
  getInitialState () {
    return {
      data: null,
      isPending: false
    };
  },

  render () {
    if (this.state.isPending) return <Loader />;
    if (!this.state.data) return null;
    let data = this.state.data;
    return (
      <div>
        <h1>{data.first_name} {data.last_name}</h1>
        <hr />
        {this._renderInfoField('email', 'envelope')}
        {this._renderInfoField('position', 'flask')}
        {this._renderInfoField('profession', 'clipboard')}
        {this._renderInfoField('organization', 'university')}
        {this._renderInfoField('orcid', 'info')}
        {this._renderInfoField('work_phone', 'phone')}
        {this._renderAddress()}
        {this._renderResearchInterests()}
      </div>
    );
  },

  componentDidMount () {
    this._fetchData();
  },

  _renderInfoField (fieldName, iconClass) {
    let data = this.state.data;
    if (!data[fieldName]) return null;
    let iconNode = (iconClass) ? <span><i className={`fa fa-${iconClass}`} /> </span> : null;
    return <p>{iconNode}{data[fieldName]}</p>;
  },

  _renderAddress () {
    let data = this.state.data;
    let addressArray = data.address || [];
    addressArray.push(`${data.city}, ${data.state} ${data.postal_code} ${data.country}`);
    let nodes = addressArray.map( (d, i) => {
      return <p key={`colAdd${i}`}>{d}</p>;
    });
    return (
      <div>
        <label>Address</label>
        {nodes}
      </div>
    );
  },

  _renderResearchInterests () {
    let interests = this.state.data.research_interests;
    if (!interests) return null;
    let nodes = interests.split(', ').map( (d, i) => {
      return <p key={`colRI${i}`}>{d}</p>;
    });
    return (
      <div>
        <label>Research Interests</label>
        {nodes}
      </div>
    );
  },

  _fetchData () {
    this.setState({ isPending: true });
    let displayName = this.props.routeParams.colleagueDisplayName;
    fetch(`${COLLEAGUE_GET_URL}/${displayName}`, {
      credentials: 'same-origin',
    }).then( response => {
      return response.json();
    }).then( json => {
      this.setState({ data: json, isPending: false });
    });
  }
});

export default ColleaguesShow;
