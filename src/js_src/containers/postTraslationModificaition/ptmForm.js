import React, { Component } from 'react';
import fetchData from '../../lib/fetchData';
import { connect } from 'react-redux';
import Loader from '../../components/loader';
import { setError, setMessage } from '../../actions/metaActions';
import { setPTM } from '../../actions/ptmActions';
import DataList from '../../components/dataList';

const PTMS = '/ptm';
const GET_STRAINS = '/get_strains';
const GET_PSIMODS = '/get_psimod';
const SKIP = 5;

class PtmForm extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleGetPTMS = this.handleGetPTMS.bind(this);
    this.handleSelectPTM = this.handleSelectPTM.bind(this);

    this.handle_next_previous = this.handle_next_previous.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.handleToggleInsertUpdate = this.handleToggleInsertUpdate.bind(this);
    this.handleResetForm = this.handleResetForm.bind(this);
    this.handleDelete = this.handleDelete.bind(this);

    this.state = {
      isUpdate: false,
      taxonomy_id_to_name: [],
      psimods: [],
      list_of_ptms: [],
      isPending: false,
      visible_ptm_index: -1,
      referenceLabel: 'SGDID',
      psimod_text_value : ''
    };

    this.getTaxonomy();
    this.getPsimods();
  }

  handleChange() {
    var currentPtm = {};
    var data = new FormData(this.refs.form);
    for (var key of data.entries()) {
      currentPtm[key[0]] = key[1];
    }
    this.props.dispatch(setPTM(currentPtm));
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ isPending: true });
    var formData = new FormData();
    for(var key in this.props.ptm){
      formData.append(key,this.props.ptm[key]);
    }

    fetchData(PTMS, {
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false
    }).then((data) => {
      this.setState({ isPending: false, list_of_ptms: data.ptms });
      this.props.dispatch(setMessage(data.success));
    }).catch((err) => {
      this.setState({ isPending: false });
      this.props.dispatch(setError(err.error));
    });
  }

  handle_next_previous(value) {
    this.setState({ visible_ptm_index: this.state.visible_ptm_index + value });
  }

  getTaxonomy() {
    fetchData(GET_STRAINS, {
      type: 'GET'
    }).then(data => {
      var values = data['strains'].map((strain, index) => {
        return <option value={strain.taxonomy_id} key={index}> {strain.display_name} </option>;
      });
      this.setState({ taxonomy_id_to_name: [<option value='' key='-1'> -----select taxonomy----- </option>, ...values] });
    }).catch(err => this.props.dispatch(setError(err.error)));
  }

  getPsimods() {
    fetchData(GET_PSIMODS, {
      type: 'GET'
    }).then(data => {
      this.setState({ psimods: data['psimods'] });
    }).catch(err => this.props.dispatch(setError(err.error)));
  }

  handleGetPTMS(value) {
    this.handleResetForm();
    this.setState({ list_of_ptms: [], isPending: true, visible_ptm_index: value });
    var url = `${PTMS}/${this.props.ptm.dbentity_id}`;
    fetchData(url, {
      type: 'GET'
    }).then(data => {
      this.setState({ list_of_ptms: [...data['ptms']], isPending: false });
    })
      .catch(err => {
        this.setState({ isPending: false });
        this.props.dispatch(setError(err.error));
      });
  }

  handleSelectPTM(index) {
    var ptm = this.state.list_of_ptms[index];
    var reference_id = '';

    if (ptm.reference.pubmed_id) {
      this.setState({ referenceLabel: 'Pubmed Id' });
      reference_id = ptm.reference.pubmed_id;
    }
    else {
      this.setState({ referenceLabel: 'SGDID' });
      reference_id = ptm.reference.sgdid;
    }

    var psimod_text = this.state.psimods.filter((item) => item.psimod_id == ptm.psimod_id)[0].display_name;

    var currentPtm = {
      id: ptm.id,
      dbentity_id: ptm.locus.format_name,
      reference_id: reference_id,
      site_index: ptm.site_index,
      site_residue: ptm.site_residue,
      psimod_id: ptm.psimod_id.toString(),
      taxonomy_id: ptm.taxonomy.taxonomy_id,
      modifier_id: ptm.modifier.format_name
    };
    this.props.dispatch(setPTM(currentPtm));
    this.setState({psimod_text_value:psimod_text});
  }

  handleResetForm() {
    var currentPtm = {
      id: 0,
      dbentity_id: '',
      reference_id: '',
      site_index: '',
      site_residue: '',
      psimod_id: '',
      taxonomy_id: '',
      modifier_id: '',
    };
    this.props.dispatch(setPTM(currentPtm));
    this.setState({psimod_text_value:''});
  }

  handleToggleInsertUpdate() {
    this.setState({ isUpdate: !this.state.isUpdate, list_of_ptms: [] });
    this.handleResetForm();
  }

  handleDelete(e) {
    e.preventDefault();
    if (this.props.ptm.id > 0) {
      fetchData(`${PTMS}/${this.props.ptm.id}`, {
        type: 'DELETE'
      })
        .then((data) => {
          this.props.dispatch(setMessage(data.success));
          this.setState({ list_of_ptms: data.ptms });
          this.handleResetForm();
        })
        .catch((err) => {
          this.props.dispatch(setError(err.error));
        });
    }
    else {
      this.props.dispatch(setError('No ptm is selected to delete.'));
    }
  }

  renderActions() {
    if (this.state.isPending) {
      return (
        <div className='row'>
          <div className='columns medium-12'>
            <Loader />
          </div>
        </div>
      );
    }

    var currentIndex = this.state.visible_ptm_index;
    var count_of_ptms = this.state.list_of_ptms.length;

    var buttons = this.state.list_of_ptms.filter((i, index) => {
      return index >= currentIndex && index < currentIndex + SKIP;
    })
      .map((i, index) => {
        var new_index = index + currentIndex;
        return <li key={new_index} onClick={() => this.handleSelectPTM(new_index)} className='button medium-only-expanded'>{i.site_index + ' ' + i.site_residue}</li>;
      });

    if (this.state.isUpdate) {
      return (
        <div>
          {count_of_ptms > 0 &&
            <div>
              <div className='row'>
                <div className='columns medium-12'>
                  <div className='expanded button-group'>
                    <li type='button' className='button warning' disabled={count_of_ptms < 0 || currentIndex <= 0 ? true : false} onClick={() => this.handle_next_previous(-SKIP)}> <i className="fa fa-chevron-circle-left"></i> </li>
                    {buttons}
                    <li type='button' className='button warning' disabled={count_of_ptms == 0 || currentIndex + SKIP >= count_of_ptms ? true : false} onClick={() => this.handle_next_previous(SKIP)}> <i className="fa fa-chevron-circle-right"></i></li>
                  </div>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-6'>
                  <button type='submit' className="button expanded" >Update</button>
                </div>
                <div className='columns medium-3'>
                  <button type='button' className="button alert expanded" onClick={(e) => { if (confirm('Are you sure, you want to delete selected PTM ?')) this.handleDelete(e); }}>Delete</button>
                </div>
              </div>
            </div>
          }
          {
            count_of_ptms <= 0 &&
            <p className='callout alert'>No PTM to select & update</p>
          }
        </div>
      );
    }

    return (
      <div>
        <div className='row'>
          <div className='columns medium-6'>
            <button type='submit' className="button expanded" >Add</button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className='row'>
          <div className='columns medium-6 small-6'>
            <button type="button" className="button expanded" onClick={this.handleToggleInsertUpdate} disabled={!this.state.isUpdate}>Add new ptm</button>
          </div>
          <div className='columns medium-6 small-6 end'>
            <button type="button" className="button expanded" onClick={this.handleToggleInsertUpdate} disabled={this.state.isUpdate}>Update existing ptm</button>
          </div>
        </div>

        {this.state.isUpdate &&
          <ul>
            <li>Enter gene name</li>
            <li>Click Get database value</li>
            <li>Click on the value to edit</li>
            <li>Edit the field and click update to save</li>
          </ul>
        }

        <form onSubmit={this.handleSubmit} ref='form'>
          <input name='id' value={this.props.ptm.id} className="hide" />
          {/* Gene */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Gene (sgdid, systematic name) </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' name='dbentity_id' placeholder='Enter Gene' value={this.props.ptm.dbentity_id} onChange={this.handleChange} />
                </div>
              </div>
            </div>
          </div>

          {this.state.isUpdate &&
            <div className='row'>
              <div className='columns medium-6'>
                <input type="button" className="button" value="Get database value" onClick={() => this.handleGetPTMS(0)} />
              </div>
            </div>
          }

          {/* Taxonomy */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Taxonomy </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <select value={this.props.ptm.taxonomy_id} onChange={this.handleChange} name='taxonomy_id'>
                    {this.state.taxonomy_id_to_name}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Reference (sgdid, pubmed id, reference no) </label>
                </div>
              </div>
              <div className='row'>
                <div className="input-group columns medium-12">
                  {this.state.isUpdate &&
                    <span className="input-group-label">{this.state.referenceLabel}</span>
                  }
                  <input className='input-group-field' type='text' placeholder='Enter Reference' name='reference_id' value={this.props.ptm.reference_id} onChange={this.handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Site Index */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Site Index </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' placeholder='Enter site index' name='site_index' value={this.props.ptm.site_index} onChange={this.handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Site Residue */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Site Residue </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' placeholder='Enter site residue' name='site_residue' value={this.props.ptm.site_residue} onChange={this.handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Psimod */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Psimod </label>
                </div>
              </div>
              <div className='row'>
                <DataList options={this.state.psimods} id='psimod_id' value1='display_name' value2='format_name'  selectedIdName='psimod_id' onOptionChange={this.handleChange} selectedId={this.props.ptm.psimod_id} />
              </div>
            </div>
          </div>

          {/* Modifier */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Modifier(sgdid, systematic name) </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' placeholder='Enter modifier' name='modifier_id' value={this.props.ptm.modifier_id} onChange={this.handleChange} />
                </div>
              </div>
            </div>
          </div>

          {this.renderActions()}

        </form>

      </div>
    );
  }
}

PtmForm.propTypes = {
  dispatch: React.PropTypes.func,
  ptm: React.PropTypes.object
};


function mapStateToProps(state) {
  return {
    ptm: state.ptm['currentPtm']
  };
}

export default connect(mapStateToProps)(PtmForm);