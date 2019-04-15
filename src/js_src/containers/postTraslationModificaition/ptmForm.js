import React, { Component } from 'react';
import fetchData from '../../lib/fetchData';

const GET_PTMs_URL = '/get_ptms/';
const GET_STRAINS = '/get_strains';
const GET_PSIMODS = '/get_psimod';
const TIMEOUT = 120000;

class PtmForm extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.getPTMS = this.getPTMS.bind(this);
    this.setPtm = this.setPtm.bind(this);
    this.handleIncrement = this.handleIncrement.bind(this);
    this.handleDecrement = this.handleDecrement.bind(this);
    
    this.newPTM = {
      id: 0,
      locus: {
        display_name: ''
      },
      reference: {
        pubmed_id: ''
      },
      site_index: '',
      site_residue: '',
      type: ''
    };

    this.state = {
      taxonomy_id_to_name:[],
      psimod_id_to_name:[],
      list_of_ptms: [this.newPTM],
      dbentity_id: 'S000001855',
      taxonomy_id: '',
      reference_id: '',
      site_index: '',
      site_residue: '',
      psimod_id: '',
      modifier_id: '',
      visible_ptm_index: 0
    };

    this.getStrainsForTaxonomy();
    this.getPsimods();
  }

  componentDidMount(){
    this.setPtm(0);
  }

  handleChange(event) {
    var value = event.target.value;
    var name = event.target.name;
    this.setState({
      [name]: value
    });
  }

  getStrainsForTaxonomy(){
    fetchData(GET_STRAINS,{
      type:'GET'
    })
    .then(data => {
      var values = data['strains'].map((strain,index) => {
        return <option value={strain.taxonomy_id} key={index}> {strain.display_name} </option> ;
      });
      this.setState({taxonomy_id_to_name: values});
    })
    .catch(err => console.log(err));
  }

  getPsimods(){
    fetchData(GET_PSIMODS, {
      type: 'GET'
    })
    .then(data => {
      var values = data['psimods'].map((psimod,index) => {
        return <option value={psimod.psimod_id} key={index}>{psimod.display_name}</option>;
      });
      this.setState({ psimod_id_to_name: values});
    })
    .catch(err => console.log(err));
  }

  getPTMS() {
    var url = `${GET_PTMs_URL}${this.state.dbentity_id}`;
    fetchData(url, {
      type: 'GET',
      timeout: TIMEOUT
    }).then(data => {
      this.setState({ list_of_ptms: [this.newPTM, ...data['ptms']], visible_ptm_index: 0 });
      this.setPtm(0);
    })
      .catch(err => console.log(err));
  }

  handleIncrement() {
    this.setPtm(1);
  }
  handleDecrement() {
    this.setPtm(-1);
  }

  setPtm(change) {
    var index = this.state.visible_ptm_index + change;
    if (index >= 0 && index <= this.state.list_of_ptms.length - 1) {
      var ptm = this.state.list_of_ptms[index];
      this.setState({ visible_ptm_index: index });
      this.setState({
        annotation_id:ptm.id,
        dbentity_id: ptm.locus.display_name,
        taxonomy_id: '',
        reference_id: ptm.reference.pubmed_id,
        site_index: ptm.site_index,
        site_residue: ptm.site_residue,
        psimod_id: ptm.psimod_id,
        modifier_id: ''
      });
    }
  }

  render() {
    var currentIndex = this.state.visible_ptm_index + 1;
    var count_of_ptms = this.state.list_of_ptms.length;
    return (
      <form>
        <p>{this.state.annotation_id}</p>

        {/* Gene */}
        <div className='row'>
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Gene (sgdid, systematic name) </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
                <input type='text' name='dbentity_id' placeholder='Enter Gene' value={this.state.dbentity_id} onChange={this.handleChange} />
              </div>

              <div className='columns medium-4'>
                <input type="button" className="button" value="Get database value" onClick={this.getPTMS} />
              </div>
            </div>
          </div>
        </div>

        {/* Taxonomy */}
        <div className='row'>
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Taxonomy </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
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
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Reference (sgdid, pubmed id, reference no) </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
                <input type='text' placeholder='Enter Reference' name='reference_id' value={this.state.reference_id} onChange={this.handleChange} />

              </div>
            </div>
          </div>
        </div>

        {/* Site Index */}
        <div className='row'>
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Site Index </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
                <input type='text' placeholder='Enter site index' name='site_index' value={this.state.site_index} onChange={this.handleChange} />
              </div>
            </div>
          </div>
        </div>

        {/* Site Residue */}
        <div className='row'>
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Site Residue </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
                <input type='text' placeholder='Enter site residue' name='site_redidue' value={this.state.site_residue} onChange={this.handleChange} />
              </div>
            </div>
          </div>
        </div>

        {/* Psimod */}
        <div className='row'>
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Psimod </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
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
          <div className='columns large-12'>

            <div className='row'>
              <div className='columns medium-12'>
                <label> Modifier(sgdid, systematic name) </label>
              </div>
            </div>

            <div className='row'>
              <div className='columns medium-8'>
                <input type='text' placeholder='Enter modifier' name='modifier_id' value={this.state.modifier_id} onChange={this.handleChange} />
              </div>
            </div>
          </div>
        </div>

        <div className='row'>
          <div className='columns small-3'>
            <button type='button' className="button" onClick={this.handleDecrement} disabled={count_of_ptms == 0 || currentIndex == 1 ? true : false} >{`<--  ${currentIndex}`}</button>
          </div>
          <div className='columns small-3'>
            <button type='button' className="button" onClick={this.handleIncrement} disabled={count_of_ptms == 0 || currentIndex == count_of_ptms ? true : false} >{` ${currentIndex + 1} -->`}</button>
          </div>
          <div className='columns small-6'>
            <button type='button' className="button" >{this.state.annotation_id == 0 ? 'Insert' : 'Update'}</button>
          </div>
        </div>
      </form>
    );
  }
}


export default PtmForm;