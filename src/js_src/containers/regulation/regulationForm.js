import React, { Component } from 'react';
import { connect } from 'react-redux';
import DataList from '../../components/dataList';
import fetchData from '../../lib/fetchData';
import { setError, setMessage } from '../../actions/metaActions';
import {setRegulation} from '../../actions/regulationActions';

const GET_ECO = '/eco/regulations';
const GET_GO = '/go/regulations';
const REGULATIONS = '/regulation';

const REGULATION_TYPE =  ['transcription','protein activity','protein stability','RNA activity','RNA stability'];
const DIRECTION = ['positive','negative'];
const REGULATOR_TYPE =['chromatin modifier','transcription factor','protein modifier','RNA-binding protein','RNA modifier'];
const ANNOTATION_TYPE= ['manually curated','high-throughput'];


class RegulationForm extends Component {
  constructor(props) {
    super(props);
    
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      list_of_eco:[],
      list_of_go: []
    };

    this.getEco();
    this.getGo();
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

  handleChange(){
    var data = new FormData(this.refs.form);
    var current_regulation = {};
    for (var key of data.entries()) {
      current_regulation[key[0]] = key[1];
    }
    this.props.dispatch(setRegulation(current_regulation));
  }

  handleSubmit(e){
    e.preventDefault();
    fetchData(REGULATIONS,{
      type:'POST',
      data:this.props.regulation
    })
    .then(data => console.log(data))
    .catch(err => console.log(err));
    
    this.props.dispatch(setMessage(''));
  }

  render() {
    var regulation_types = REGULATION_TYPE.map((item) => <option key={item}>{item}</option>);
    var regulator_types = REGULATOR_TYPE.map((item) => <option key={item}>{item}</option>);
    var annotation_types = ANNOTATION_TYPE.map((item) => <option key={item}>{item}</option>);
    var directions = DIRECTION.map((item) => <option key={item}>{item}</option>);
    
    return (
      <form ref='form' onSubmit={this.handleSubmit}>

        <input name='annotation_id' className="hide" value={this.props.regulation.annotation_id}/>

        <div className='row'>
          <div className='columns medium-12'>
            <div className='row'>
              <div className='columns medium-12'>
                <label> Target Gene (sgdid, systematic name) </label>
              </div>
            </div>
            <div className='row'>
              <div className='columns medium-12'>
                <input type='text' name='target_id' onChange={this.handleChange} value={this.props.regulation.target_id}/>
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
                <label> Taxonomy </label>
              </div>
            </div>
            <div className='row'>
              <div className='columns medium-12'>
                <input type='text' name='taxonomy_id' onChange={this.handleChange} value={this.props.regulation.taxonomy_id} />
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
                <select onChange={this.handleChange} name='direction' value={this.props.regulation.direction}>
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
              {(this.state.list_of_go.length > 0 ) && 
                <DataList options={this.state.list_of_go} id='go_id' value1='display_name' value2='format_name' selectedIdName='happens_during' onOptionChange={this.handleChange} selectedId={this.props.regulation.happens_during} />
              }
            </div>
          </div>
        </div>

        {/* Annotation type */}
        <div className='row'>
          <div className='columns medium-12'>
            <div className='row'>
              <div className='columns medium-12'>
                <label> Annotation type </label>
              </div>
            </div>
            <div className='row'>
              <div className='columns medium-12'>
                <select onChange={this.handleChange} name='annotation_type' value={this.props.regulation.annotation_type}>
                  {annotation_types}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className='row'>
          <div className='columns medium-12'>
            <div className='row'>
              <div className='columns medium-6'>
                <button type='submit' className='button expanded'>Add</button>
              </div>
            </div>
          </div>
        </div>

      </form>
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