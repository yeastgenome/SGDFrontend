import React, { Component } from 'react';
import fetchData from '../../lib/fetchData';
import { connect } from 'react-redux';
import Loader from '../../components/loader';
import { setError, setMessage } from '../../actions/metaActions';

const GET_PTMs_URL = '/ptm/';
const GET_STRAINS = '/get_strains';
const GET_PSIMODS = '/get_psimod';
const UPDATE_PTM = '/update_ptm';
const SKIP = 5;

class PtmForm extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleGetPTMS = this.handleGetPTMS.bind(this);
    this.setPtm = this.setPtm.bind(this);

    this.handle_next_previous = this.handle_next_previous.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.handleNewForm = this.handleNewForm.bind(this);
    this.handleEditForm = this.handleEditForm.bind(this);
    this.handleResetForm = this.handleResetForm.bind(this);
    this.handleDelete = this.handleDelete.bind(this);

    this.newPTM = {
      id: 0,
      locus: {
        id: '',
        format_name: ''
      },
      reference: {
        pubmed_id: ''
      },
      site_index: '',
      site_residue: '',
      type: '',
      taxonomy: {
        taxonomy_id: ''
      },
      modifier: {
        format_name: ''
      }
    };

    this.state = {
      isUpdate: false,
      taxonomy_id_to_name: [],
      psimod_id_to_name: [],
      list_of_ptms: [],

      isPending: false,
      id: 0,
      dbentity_id: '',
      taxonomy_id: '',
      reference_id: '',
      site_index: '',
      site_residue: '',
      psimod_id: '',
      modifier_id: '',

      visible_ptm_index: -1
    };

    this.getStrainsForTaxonomy();
    this.getPsimods();
  }

  handleChange(event) {
    var value = event.target.value;
    var name = event.target.name;
    this.setState({
      [name]: value
    });
  }

  handle_next_previous(value) {
    this.setState({ visible_ptm_index: this.state.visible_ptm_index + value });
  }

  getStrainsForTaxonomy() {
    fetchData(GET_STRAINS, {
      type: 'GET'
    })
      .then(data => {
        var values = data['strains'].map((strain, index) => {
          return <option value={strain.taxonomy_id} key={index}> {strain.display_name} </option>;
        });
        this.setState({ taxonomy_id_to_name: values });
      })
      .catch(err => this.props.dispatch(setError(err.error)));
  }

  getPsimods() {
    fetchData(GET_PSIMODS, {
      type: 'GET'
    })
      .then(data => {
        var values = data['psimods'].map((psimod, index) => {
          return <option value={psimod.psimod_id} key={index}>{psimod.display_name}</option>;
        });
        this.setState({ psimod_id_to_name: values });
      })
      .catch(err => this.props.dispatch(setError(err.error)));
  }

  handleGetPTMS(value) {
    this.handleResetForm();
    this.setState({ list_of_ptms: [], isPending: true, visible_ptm_index: value });
    var url = `${GET_PTMs_URL}${this.state.dbentity_id}`;
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

  setPtm(index) {
    var ptm = this.state.list_of_ptms[index];
    this.setState({
      id: ptm.id,
      dbentity_id: ptm.locus.format_name,
      reference_id: ptm.reference.pubmed_id,
      site_index: ptm.site_index,
      site_residue: ptm.site_residue,
      psimod_id: ptm.psimod_id,
      taxonomy_id: ptm.taxonomy.taxonomy_id,
      modifier_id: ptm.modifier.format_name
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ isPending: true });
    var formData = new FormData(this.refs.form);
    fetchData(UPDATE_PTM, {
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false
    }).then((data) => {
      this.setState({ isPending: false });
      this.props.dispatch(setMessage(data.success));
    })
      .catch((err) => {
        this.setState({ isPending: false });
        this.props.dispatch(setError(err.error));
      });
  }

  handleResetForm() {
    var ptm = this.newPTM;
    this.setState({
      id: ptm.id,
      dbentity_id: ptm.locus.format_name,
      reference_id: ptm.reference.pubmed_id,
      site_index: ptm.site_index,
      site_residue: ptm.site_residue,
      psimod_id: ptm.psimod_id,
      taxonomy_id: ptm.taxonomy.taxonomy_id,
      modifier_id: ptm.modifier.format_name
    });
  }

  handleNewForm() {
    this.setState({ isUpdate: false, list_of_ptms: [] });
    this.handleResetForm();
  }

  handleEditForm() {
    this.setState({ isUpdate: true, list_of_ptms: [] });
    this.handleResetForm();
  }

  handleDelete(e){
    e.preventDefault();
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
        return <li key={new_index} onClick={() => this.setPtm(new_index)} className='button medium-only-expanded'>{i.site_index + ' ' + i.site_residue}</li>;
      });

    if (this.state.isUpdate) {
      return (
        <div>
          {count_of_ptms > 0 &&
            <div className='row'>
              <div className='columns medium-12'>
                <div className='expanded button-group'>
                  <li type='button' className='button warning' disabled={count_of_ptms < 0 || currentIndex <= 0 ? true : false} onClick={() => this.handle_next_previous(-SKIP)}> <i className="fa fa-chevron-circle-left"></i> </li>
                  {buttons}
                  <li type='button' className='button warning' disabled={count_of_ptms == 0 || currentIndex + SKIP >= count_of_ptms ? true : false} onClick={() => this.handle_next_previous(SKIP)}> <i className="fa fa-chevron-circle-right"></i></li>
                </div>

              </div>
            </div>
          }

          <div className='row'>
            <div className='columns medium-6'>
              <button type='submit' className="button expanded" >Update</button>
            </div>
            <div className='columns medium-2'>
              <button type='button' className="button alert expanded" onClick={(e) => {if(confirm('Are you sure, you want to delete selected PTM ?')) this.handleDelete(e) ;}}>Delete</button>
            </div>
          </div>
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
            <button type="button" className="button expanded" onClick={this.handleNewForm} disabled={!this.state.isUpdate}>Add new ptm</button>
          </div>
          <div className='columns medium-6 small-6 end'>
            <button type="button" className="button expanded" onClick={this.handleEditForm} disabled={this.state.isUpdate}>Update existing ptm</button>
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

          <input name='id' value={this.state.id} className="hide" />

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
                  <input type='text' name='dbentity_id' placeholder='Enter Gene' value={this.state.dbentity_id} onChange={this.handleChange} />
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
                  {/* <input type='text' placeholder='Enter Taxonomy' name='taxonomy_id' value={this.state.taxonomy_id} onChange={this.handleChange} /> */}
                  <select value={this.state.taxonomy_id} onChange={this.handleChange} name='taxonomy_id'>
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
                <div className='columns medium-12'>
                  <input type='text' placeholder='Enter Reference' name='reference_id' value={this.state.reference_id} onChange={this.handleChange} />

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
                  <input type='text' placeholder='Enter site index' name='site_index' value={this.state.site_index} onChange={this.handleChange} />
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
                  <input type='text' placeholder='Enter site residue' name='site_residue' value={this.state.site_residue} onChange={this.handleChange} />
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
                <div className='columns medium-12'>
                  {/* <input type='text' placeholder='Enter psimod' name='psimod_id' value={this.state.psimod_id} onChange={this.handleChange} /> */}
                  <select name='psimod_id' value={this.state.psimod_id} onChange={this.handleChange}>
                    {this.state.psimod_id_to_name}
                  </select>
                </div>
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
                  <input type='text' placeholder='Enter modifier' name='modifier_id' value={this.state.modifier_id} onChange={this.handleChange} />
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
  dispatch: React.PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(PtmForm);