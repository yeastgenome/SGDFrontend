import React, { Component } from 'react';
import { connect } from 'react-redux';

class RegulationForm extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      REGULAION_TYPE : [
        'transcription',
        'protein activity',
        'protein stability',
        'RNA activity',
        'RNA stability'
      ],
      DIRECTION:[
        'positive',
        'negative'
      ],
      REGULATOR_TYPE:[
        'chromatin modifier',
        'transcription factor',
        'protein modifier',
        'RNA-binding protein',
        'RNA modifier'
      ],
      ANNOTATION_TYPE:[
        'manually curated', 
        'high-throughput'
      ]
    };
  }

  render() {
    var regulation_types = this.state.REGULAION_TYPE.map((item) => <option key={item}>{item}</option>);
    var regualator_types = this.state.REGULATOR_TYPE.map((item) => <option key={item}>{item}</option>);
    var annotation_types = this.state.ANNOTATION_TYPE.map((item) => <option key={item}>{item}</option>);
    var directions = this.state.DIRECTION.map((item) => <option key={item}>{item}</option>);
    
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
              <div className='columns medium-12'>
                <input type='text' name='' />
              </div>
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
              <div className='columns medium-12'>
                <input type='text' name='' />
              </div>
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