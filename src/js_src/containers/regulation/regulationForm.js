import React, { Component } from 'react';
import { connect } from 'react-redux';
import fetchData from '../../lib/fetchData';
import { setError, setMessage } from '../../actions/metaActions';
import {setRegulation} from '../../actions/regulationActions';
import DataList from '../../components/dataList';
import Loader from '../../components/loader';

const GET_ECO = '/eco/regulations';
const GET_GO = '/go/regulations';
const REGULATIONS = '/regulation';
const GET_STRAINS = '/get_strains';
const GET_REGULATIONS = 'get_regulations';

const REGULATION_TYPE =  ['','transcription','protein activity','protein stability','RNA activity','RNA stability'];
const DIRECTION = [null,'positive','negative'];
const REGULATOR_TYPE =['','chromatin modifier','transcription factor','protein modifier','RNA-binding protein','RNA modifier'];
const SKIP = 5;
const TIMEOUT = 120000;


class RegulationForm extends Component {
  constructor(props) {
    super(props);
    
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleToggleInsertUpdate = this.handleToggleInsertUpdate.bind(this);
    this.handleResetForm = this.handleResetForm.bind(this);
    this.renderActions = this.renderActions.bind(this);
    this.handleGetRegulations = this.handleGetRegulations.bind(this);
    this.handleSelectRegulation = this.handleSelectRegulation.bind(this);
    this.handleNextPrevious = this.handleNextPrevious.bind(this);
    this.handleDelete = this.handleDelete.bind(this);

    this.state = {
      list_of_eco:[],
      list_of_go: [],
      list_of_taxonomy:[],
      isUpdate:false,
      pageIndex:0,
      currentIndex:-1,
      list_of_regulations:[],
      isLoading:false
    };

    this.getEco();
    this.getGo();
    this.getTaxonomy();
  }

  getEco(){
    fetchData(GET_ECO,{type:'GET'})
    .then((data) => {
      this.setState({list_of_eco:data.success});
    })
    .catch((err) => this.props.dispatch(setError(err.message)));
  }

  getGo() {
    fetchData(GET_GO, { type: 'GET' })
      .then((data) => {
        this.setState({ list_of_go: data.success });
      })
      .catch((err) => this.props.dispatch(setError(err.message)));
  }

  getTaxonomy() {
    fetchData(GET_STRAINS, {
      type: 'GET'
    }).then(data => {
      var values = data['strains'].map((strain, index) => {
        return <option value={strain.taxonomy_id} key={index}> {strain.display_name} </option>;
      });
      this.setState({ list_of_taxonomy: [<option value='' key='-1'> -----select taxonomy----- </option>, ...values] });
    }).catch(err => this.props.dispatch(setError(err.error)));
  }

  handleGetRegulations(){
    this.setState({ list_of_regulations: [], isLoading: true, currentIndex: -1, pageIndex: 0});
    fetchData(GET_REGULATIONS,{
      type:'POST',
      data: {
        target_id: this.props.regulation.target_id,
        regulator_id: this.props.regulation.regulator_id,
        reference_id: this.props.regulation.reference_id
      },
      timeout: TIMEOUT
    })
    .then(data => {
      this.setState({list_of_regulations:data['success']});
      this.handleResetForm();
    })
    .catch(err => this.props.dispatch(setError(err.error)))
    .finally(() => this.setState({ isLoading: false }));
  }

  handleSelectRegulation(index){
    var regulation = this.state.list_of_regulations[index];
    var currentRegulation = {
      annotation_id: regulation.id,
      target_id: regulation.target_id.id,
      regulator_id: regulation.regulator_id.id,
      taxonomy_id: regulation.taxonomy_id,
      reference_id: regulation.reference_id,
      eco_id: regulation.eco_id,
      regulator_type: regulation.regulator_type,
      regulation_type: regulation.regulation_type,
      direction: regulation.direction,
      happens_during: regulation.happens_during,
      annotation_type: regulation.annotation_type,
    };
    this.props.dispatch(setRegulation(currentRegulation));
    this.setState({currentIndex:index});
  }

  handleResetForm(){
    var currentRegulation =  {
      annotation_id: 0,
      target_id: '',
      regulator_id: '',
      taxonomy_id: '',
      reference_id: '',
      eco_id: '',
      regulator_type: '',
      regulation_type: '',
      direction: '',
      happens_during: '',
      annotation_type: '',
    };
    this.props.dispatch(setRegulation(currentRegulation));
  }

  handleToggleInsertUpdate() {
    this.setState({ isUpdate: !this.state.isUpdate, list_of_regulations: [], currentIndex: -1, pageIndex:0});
    this.handleResetForm();
  }

  handleNextPrevious(value) {
    this.setState({ pageIndex: this.state.pageIndex + value });
  }

  handleChange(){
    var data = new FormData(this.refs.form);
    var currentRegulation = {};
    for (var key of data.entries()) {
      currentRegulation[key[0]] = key[1];
    }
    this.props.dispatch(setRegulation(currentRegulation));
  }

  handleSubmit(e){
    e.preventDefault();
    this.setState({ isLoading:true});
    fetchData(REGULATIONS,{
      type:'POST',
      data:this.props.regulation
    })
    .then(data => {
      this.props.dispatch(setMessage(data.success));
      var list_of_regulations = this.state.list_of_regulations;
      list_of_regulations[this.state.currentIndex] = data.regulation;
      this.setState({list_of_regulations:list_of_regulations});
    })
    .catch(err => this.props.dispatch(setError(err.error)))
    .finally(() => this.setState({ isLoading: false }));
  }

  handleDelete(e){
    e.preventDefault();
    this.setState({isLoading:true});
    if (this.props.regulation.annotation_id > 0) {
      
      fetchData(`${REGULATIONS}/${this.props.regulation.annotation_id}`, {
        type: 'DELETE'
      })
        .then((data) => {
          this.props.dispatch(setMessage(data.success));
          var new_list_of_regulations = this.state.list_of_regulations;
          new_list_of_regulations.splice(this.state.currentIndex, 1);
          this.setState({ list_of_regulations: new_list_of_regulations,currentIndex:-1,pageIndex:0});
          this.handleResetForm();
        })
        .catch((err) => {
          this.props.dispatch(setError(err.error));
        })
        .finally(() => this.setState({isLoading:false}));
    }
    else {
      this.setState({ isLoading: false });
      this.props.dispatch(setError('No regulation is selected to delete.'));
    }
  }

  renderActions(){
    var pageIndex = this.state.pageIndex;
    var count_of_regulations = this.state.list_of_regulations.length;
    var totalPages = Math.ceil(count_of_regulations/SKIP) - 1;

    if (this.state.isLoading) {
      return (
        <Loader />
      );
    }
  
    if(this.state.isUpdate){
      var buttons = this.state.list_of_regulations.filter((i,index) => {
        return index >= (pageIndex * SKIP) && index < (pageIndex * SKIP) + SKIP;
      })
      .map((regulation, index) =>{
        var new_index = index + pageIndex*SKIP;
        return <li key={new_index} onClick={() => this.handleSelectRegulation(new_index)} className={`button medium-only-expanded ${this.state.currentIndex == new_index ? 'success' : ''}`}>{regulation.target_id.display_name + ' ' + regulation.regulator_id.display_name}</li>;
      }
        );
      return (
        <div>
          <div className='row'>
            <div className='columns medium-12'>
              <div className='expanded button-group'>
                <li type='button' className='button warning' disabled={count_of_regulations < 0 || pageIndex <= 0 ? true : false} onClick={() => this.handleNextPrevious(-1)}> <i className="fa fa-chevron-circle-left"></i> </li>
                {buttons}
                <li type='button' className='button warning' disabled={count_of_regulations == 0 || pageIndex >= totalPages ? true : false} onClick={() => this.handleNextPrevious(1)}> <i className="fa fa-chevron-circle-right"></i></li>
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
        </div >

      );
    }
    else{
      return (
        <div className='row'>
          <div className='columns medium-6'>
            <button type='submit' className='button expanded'>Add</button>
          </div>
        </div>
      );
    }
  }

  render() {
    
    var regulation_types = REGULATION_TYPE.map((item) => <option key={item}>{item}</option>);
    var regulator_types = REGULATOR_TYPE.map((item) => <option key={item}>{item}</option>);
    var directions = DIRECTION.map((item) => <option key={item}>{item}</option>);

    return (
      <div>

        <div className='row'>
          <div className='columns medium-6 small-6'>
            <button type="button" className="button expanded" onClick={this.handleToggleInsertUpdate} disabled={!this.state.isUpdate}>Add new regulation</button>
          </div>
          <div className='columns medium-6 small-6 end'>
            <button type="button" className="button expanded" onClick={this.handleToggleInsertUpdate} disabled={this.state.isUpdate}>Update existing regulation</button>
          </div>
        </div>

        <form ref='form' onSubmit={this.handleSubmit}>

          <input name='annotation_id' className="hide" value={this.props.regulation.annotation_id} />

          {this.state.isUpdate &&
            <ul>
              <li>Filter regulations by target gene,regulator gene or reference</li>
              <li>Click Get database value</li>
              <li>Click on the value to edit</li>
              <li>Edit the field and click update to save</li>
            </ul>
          }

          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Target Gene (sgdid, systematic name) </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' name='target_id' onChange={this.handleChange} value={this.props.regulation.target_id} />
                </div>
              </div>
            </div>
          </div>

          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Regulator Gene(sgdid, systematic name) </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' name='regulator_id' onChange={this.handleChange} value={this.props.regulation.regulator_id} />
                </div>
              </div>
            </div>
          </div>

          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Reference (sgdid, pubmed id, reference no) </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <input type='text' name='reference_id' onChange={this.handleChange} value={this.props.regulation.reference_id} />
                </div>
              </div>
            </div>
          </div>

          {this.state.isUpdate && 
            <div className='row'>
              <div className='columns medium-12'>
                <div className='row'>
                  <div className='columns medium-6'>
                    <button type='button' className='button expanded' onClick={this.handleGetRegulations}>Get database value</button>
                  </div>
                </div>
              </div>
            </div>
          }
          

          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Taxonomy </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <select value={this.props.regulation.taxonomy_id} onChange={this.handleChange} name='taxonomy_id'>
                    {this.state.list_of_taxonomy}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Eco </label>
                </div>
              </div>
              <div className='row'>
                <DataList options={this.state.list_of_eco} id='eco_id' value1='display_name' value2='format_name' selectedIdName='eco_id' onOptionChange={this.handleChange} selectedId={this.props.regulation.eco_id} />
              </div>
            </div>
          </div>

          {/* Regulator type */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Regulator type </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <select onChange={this.handleChange} name='regulator_type' value={this.props.regulation.regulator_type} >
                    {regulator_types}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Regulation type */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Regulation type </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <select onChange={this.handleChange} name='regulation_type' value={this.props.regulation.regulation_type} >
                    {regulation_types}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Direction */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Direction </label>
                </div>
              </div>
              <div className='row'>
                <div className='columns medium-12'>
                  <select onChange={this.handleChange} name='direction' value={this.props.regulation.direction || ''}>
                    {directions}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Happens during */}
          <div className='row'>
            <div className='columns medium-12'>
              <div className='row'>
                <div className='columns medium-12'>
                  <label> Happens during </label>
                </div>
              </div>
              <div className='row'>
                {(this.state.list_of_go.length > 0) &&
                  <DataList options={this.state.list_of_go} id='go_id' value1='display_name' value2='format_name' selectedIdName='happens_during' onOptionChange={this.handleChange} selectedId={this.props.regulation.happens_during} />
                }
              </div>
            </div>
          </div>

          {this.renderActions()}

        </form>

      </div>
    
    );
  }
}

RegulationForm.propTypes = {
  dispatch: React.PropTypes.func,
  regulation:React.PropTypes.object
};

function mapStateToProps(state) {
  return {
    regulation: state.regulation['currentRegulation']
  };
}

export default connect(mapStateToProps)(RegulationForm);