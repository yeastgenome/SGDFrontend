import React, { Component } from 'react';
import { connect } from 'react-redux';
// import t from 'tcomb-form';

import FlexiForm from '../../components/flexiForm';
import Loader from '../../components/loader';
// import { updateData, setPending, clearPending} from './locusActions';
// import { setMessage, setError, clearError } from '../../actions/metaActions';

const TARGET_URL = '/locus/bgi';

class LocusBasic extends Component {
  // handleSubmit(e) {
  //   e.preventDefault();
  //   let value = this.formInput.getValue();
  //   if (value) {
  //     let id = this.props.params.id;
  //     let url = `/locus/${id}/curate`;
  //     this.props.dispatch(setPending());
  //     fetchData(url, { type: 'PUT', data: value }).then( (data) => {
  //       this.props.dispatch(updateData(data));
  //       this.props.dispatch(setMessage('Locus was updated successfully.'));
  //       this.props.dispatch(clearError());
  //       this.props.dispatch(clearPending());
  //     }).catch( (data) => {
  //       let errorMessage = data ? data.error : 'There was an error updating the locus.';
  //       this.props.dispatch(setError(errorMessage));
  //       this.props.dispatch(clearPending());
  //       let errorData = this.props.data;
  //       errorData.paragraphs = value;
  //       this.props.dispatch(updateData(errorData));
  //     });
  //   }
  // }

  // fetchData() {
  //   let id = this.props.params.id;
  //   let url = `/locus/${id}/curate`;
  //   this.props.dispatch(updateData(null));
  //   fetchData(url).then( (data) => {
  //     updateTitle(data.name);
  //     this.props.dispatch(clearPending());
  //     this.props.dispatch(updateData(data));
  //   }); 
  // }

  // renderForms() {
  //   let FormSchema = t.struct({
  //     phenotype_summary: t.maybe(t.String),
  //     regulation_summary: t.maybe(t.String),
  //     regulation_summary_pmids: t.maybe(t.String)
  //   });
  //   let options = {
  //     fields: {
  //       phenotype_summary: {
  //         type: 'textarea'
  //       },
  //       regulation_summary: {
  //         type: 'textarea'
  //       },
  //       regulation_summary_pmids: {
  //         label: 'Regulation summary PMIDs (space-separated)'
  //       }
  //     }
  //   };
  //   let data = this.props.data.paragraphs;
  //   return (
  //     <div className='sgd-curate-form row'>
  //       <div className='columns small-12 medium-6'>
  //         <form onSubmit={this.handleSubmit.bind(this)}>
  //           <t.form.Form options={options} ref={input => this.formInput = input} type={FormSchema} value={data} />
  //           <div className='form-group'>
  //             <button type='submit' className='button'>Save</button>
  //           </div>
  //       </form>
  //       </div>
  //     </div>
  //   );
  // }

  render() {
    let data = this.props.data;
    if (!data || this.props.isPending) return <Loader />;
    
    return (
      <div>
        <FlexiForm tFormOptions={reserveOptions} tFormSchema={reserveSchema} onSuccess={_onSuccess} requestMethod='PUT' updateUrl={TARGET_URL} />
      </div>
    );
  }
}

LocusBasic.propTypes = {
  data: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  isPending: React.PropTypes.bool,
  params: React.PropTypes.object
};

function mapStateToProps(state) {
  let _data = state.locus.get('data') ? state.locus.get('data').toJS() : null;
  return {
    data: _data,
    isPending: state.locus.get('isPending')
  };
}

export { LocusBasic as LocusBasic };
export default connect(mapStateToProps)(LocusBasic);
