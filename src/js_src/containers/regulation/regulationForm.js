import React, { Component } from 'react';
import { connect } from 'react-redux';
import DataList from '../../components/dataList';
import fetchData from '../../lib/fetchData';

const GET_ECO = '/eco/regulations';
const GET_GO = '/go/regulations';
const REGULAION_TYPE =  ['transcription','protein activity','protein stability','RNA activity','RNA stability'];
const DIRECTION = ['positive','negative'];
const REGULATOR_TYPE =['chromatin modifier','transcription factor','protein modifier','RNA-binding protein','RNA modifier'];
const ANNOTATION_TYPE= ['manually curated','high-throughput'];


class RegulationForm extends Component {
  constructor(props) {
    super(props);
    
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
      console.log(data.success);
    })
    .catch((err) => console.log(err));
  }

  getGo() {
    fetchData(GET_GO, { type: 'GET' })
      .then((data) => {
        this.setState({ list_of_go: data.success });
        console.log(data.success);
      })
      .catch((err) => console.log(err));
  }

  handleChange(){
    console.log('value change');
  }

  render() {
    var regulation_types = REGULAION_TYPE.map((item) => <option key={item}>{item}</option>);
    var regualator_types = REGULATOR_TYPE.map((item) => <option key={item}>{item}</option>);
    var annotation_types = ANNOTATION_TYPE.map((item) => <option key={item}>{item}</option>);
    var directions = DIRECTION.map((item) => <option key={item}>{item}</option>);
    
    return (
      <form>
        <div className='row'>
          <div className='columns medium-12'>
            <div className='row'>
              <div className='columns medium-12'>
                <label> Target Gene (sgdid, systematic name) </label>
              </div>
            </div>
            <div className='row'>
              <div className='columns medium-12'>
                <input type='text' name='' />
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
                <input type='text' name='' />
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
                <input type='text' name='' />
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
                <input type='text' name='' />
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
              <DataList options={this.state.list_of_eco} id='eco_id' value1='display_name' value2='format_name' selectedIdName='eco_id' onOptionChange={this.handleChange} selectedId='' />
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
                <select>
                  {regualator_types}
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
                <select>
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
                <select>
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
                <DataList options={this.state.list_of_go} id='go_id' value1='display_name' value2='format_name' selectedIdName='go_id' onOptionChange={this.handleChange} selectedId='' />
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
                <select>
                  {annotation_types}
                </select>
              </div>
            </div>
          </div>
        </div>

      </form>
    );
  }

}

function mapStateToProps(state) {
  return state;
}

export default connect(mapStateToProps)(RegulationForm);