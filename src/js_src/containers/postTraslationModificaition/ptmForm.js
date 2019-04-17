import React, { Component } from 'react';
import fetchData from '../../lib/fetchData';
import { connect } from 'react-redux';
// import Loader from '../../components/loader';
import { setError, setMessage } from '../../actions/metaActions';

const GET_PTMs_URL = '/get_ptms/';
const GET_STRAINS = '/get_strains';
const GET_PSIMODS = '/get_psimod';
const UPDATE_PTM = '/update_ptm';

class PtmForm extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleGetPTMS = this.handleGetPTMS.bind(this);
    this.setPtm = this.setPtm.bind(this);
    this.handleIncrement = this.handleIncrement.bind(this);
    this.handleDecrement = this.handleDecrement.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    
    this.newPTM = {
      id: 0,
      locus: {
        id:'',
        format_name: ''
      },
      reference: {
        pubmed_id: ''
      },
      site_index: '',
      site_residue: '',
      type: '',
      taxonomy:{
        taxonomy_id:''
      }
    };

    this.state = {
      taxonomy_id_to_name:[],
      psimod_id_to_name:[],
      list_of_ptms: [this.newPTM],

      id:0,
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

  handleIncrement() {
    this.setPtm(1);
  }

  handleDecrement() {
    this.setPtm(-1);
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
      .catch(err => this.props.dispatch(setError(err)));
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

  handleGetPTMS() {
    this.setState({list_of_ptms:[]});
    var url = `${GET_PTMs_URL}${this.state.dbentity_id}`;
    fetchData(url, {
      type: 'GET'
    }).then(data => {
      this.newPTM.locus.format_name = data['ptms'][0].locus.format_name;
      this.setState({ list_of_ptms: [this.newPTM, ...data['ptms']], visible_ptm_index: 0 });
      this.setPtm(0);
    })
      .catch(err => this.props.dispatch(setError(err)));
  }

  setPtm(change) {
    var index = this.state.visible_ptm_index + change;
    if (index >= 0 && index <= this.state.list_of_ptms.length - 1) {
      var ptm = this.state.list_of_ptms[index];
      this.setState({ visible_ptm_index: index });
      this.setState({
        id:ptm.id,
        dbentity_id: ptm.locus.format_name,
        reference_id: ptm.reference.pubmed_id,
        site_index: ptm.site_index,
        site_residue: ptm.site_residue,
        psimod_id: ptm.psimod_id,
        taxonomy_id: ptm.taxonomy.taxonomy_id,
        modifier_id: ''
      });
    }
  }

  handleSubmit(e){
    e.preventDefault();
    var formData = new FormData(this.refs.form);
    fetchData(UPDATE_PTM,{
      type:'POST',
      data:formData,
      processData: false,
      contentType: false
    }).then((data) => this.props.dispatch(setMessage(data)))
    .catch((err) => {
      this.props.dispatch(setError(err.error));
    });
  }

  render() {
    var currentIndex = this.state.visible_ptm_index + 1;
    var count_of_ptms = this.state.list_of_ptms.length;
    return (
      <form onSubmit={this.handleSubmit} ref='form'>
        
        <input name='id' value={this.state.id} className="hide"/>

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
                <input type="button" className="button" value="Get database value" onClick={this.handleGetPTMS} />
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
                <input type='text' placeholder='Enter site residue' name='site_residue' value={this.state.site_residue} onChange={this.handleChange} />
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
            <button type='button' className={`button ${count_of_ptms == 0 || currentIndex == 1 ? 'invisible' :''}`} onClick={this.handleDecrement}> Previous </button>
          </div>
          <div className='columns small-3'>
            <button type='button' className={`button ${count_of_ptms == 0 || currentIndex == count_of_ptms ? 'invisible' : ''}`} onClick={this.handleIncrement}> Next </button>
          </div>
          <div className='columns small-6'>
            <button type='submit' className="button" >{this.state.id == 0 ? 'Insert' : 'Update'}</button>
          </div>
        </div>
      </form>
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