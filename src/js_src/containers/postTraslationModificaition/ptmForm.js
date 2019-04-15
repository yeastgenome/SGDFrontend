import React, { Component } from 'react';

class PtmForm extends Component{
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      list_of_ptms : [],
      dbentity_id : '',
      taxonomy_id : '',
      reference_id : '',
      site_index : '',
      site_residue : '',
      psimod_id : '',
      modifier_id : ''
    };
  }

  handleChange(event){
    var value  = event.target.value;
    var name = event.target.name;
    this.setState({
      [name] : value
    });
  }


  render(){
    return(
      <form>
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
                    <input type='text' placeholder='Enter Taxonomy' name='taxonomy_id' value={this.state.taxonomy_id} onChange={this.handleChange} />
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
                    <input type='text' placeholder='Enter psimod' name='psimod_id' value={this.state.psimod_id} onChange={this.handleChange} />
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
        <div className='columns'>
            <input type='button' className="button" value='<--' onClick='' />
            <input type='button' className="button" value='-->' onClick='' />
        </div>
        </div>
      </form>
    );
  }
}


export default PtmForm;