import React, { Component } from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';

import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';
import updateTitle from '../../lib/updateTitle';
import { updateData } from './locusActions';

class LocusShow extends Component {
  componentDidMount() {
    this.fetchData();
  }

  handleSubmit(e) {
    e.preventDefault();
    let value = this.formInput.getValue();
    if (value) {
      let id = this.props.params.id;
      let url = `/locus/${id}/curate`;
      this.props.dispatch(updateData(null));
      fetchData(url, { type: 'PUT', data: value }).then( (data) => {
        this.props.dispatch(updateData(data));
      });
    }
  }

  fetchData() {
    let id = this.props.params.id;
    let url = `/locus/${id}/curate`;
    this.props.dispatch(updateData(null));
    fetchData(url).then( (data) => {
      updateTitle(data.name);
      this.props.dispatch(updateData(data));
    }); 
  }

  renderForms() {
    let FormSchema = t.struct({
      phenotype_summary: t.maybe(t.String),
      phenotype_summary_pmids: t.maybe(t.String),
      regulation_summary: t.maybe(t.String),
      regulation_summary_pmids: t.maybe(t.String)
    });
    let options = {
      fields: {
        phenotype_summary: {
          type: 'textarea'
        },
        regulation_summary: {
          type: 'textarea'
        },
      }
    };
    let data = this.props.data.paragraphs;
    return (
      <div className='sgd-curate-form row'>
        <div className='columns small-12 medium-6'>
          <form onSubmit={this.handleSubmit.bind(this)}>
            <t.form.Form options={options} ref={input => this.formInput = input} type={FormSchema} value={data} />
            <div className='form-group'>
              <button type='submit' className='button'>Save</button>
            </div>
        </form>
        </div>
      </div>
    );
  }

  render() {
    let data = this.props.data;
    if (!data) return <Loader />;
    return (
      <div>
        <h1>{data.name}</h1>
        {this.renderForms()}
      </div>
    );
  }
}

LocusShow.propTypes = {
  data: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  params: React.PropTypes.object
};

function mapStateToProps(state) {
  let _data = state.locus.get('data') ? state.locus.get('data').toJS() : null;
  return {
    data: _data
  };
}

export { LocusShow as LocusShow };
export default connect(mapStateToProps)(LocusShow);
