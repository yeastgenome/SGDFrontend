import React, { Component } from 'react';

class PtmForm extends Component{
  constructor(props){
    super(props);
  }

  render(){
    return(
      <form>
        {/* Gene */}
        <div className="row">
            <div className="columns large-12">
              
              <div className="row">
                <div className="columns medium-12">
                  <label> Gene (sgdid, systematic name) </label>
                </div>
              </div>
              
              <div className="row">
                <div className="columns medium-8">
                  <input type="url" placeholder="Enter Gene" />
                  {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                </div>
              </div>
            </div>
        </div>

        {/* Taxonomy */}
        <div className="row">
            <div className="columns large-12">
                
                <div className="row">
                  <div className="columns medium-12">
                    <label> Taxonomy </label>
                  </div>
                </div>
                
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter Gene" />
                    {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                  </div>
                </div>
              </div>
        </div>

        {/* Reference */}
        <div className="row">
            <div className="columns large-12">
                
                <div className="row">
                  <div className="columns medium-12">
                    <label> Reference (sgdid, pubmed id, reference no) </label>
                  </div>
                </div>
                
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter Gene" />
                    {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                  </div>
                </div>
              </div>
        </div>

        {/* Site Index */}
        <div className="row">
            <div className="columns large-12">
                
                <div className="row">
                  <div className="columns medium-12">
                    <label> Site Index </label>
                  </div>
                </div>
                
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter Gene" />
                    {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                  </div>
                </div>
              </div>
        </div>

        {/* Site Residue */}
        <div className="row">
            <div className="columns large-12">
                
                <div className="row">
                  <div className="columns medium-12">
                    <label> Site Residue </label>
                  </div>
                </div>
                
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter Gene" />
                    {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                  </div>
                </div>
              </div>
        </div>

        {/* Psimod */}
        <div className="row">
            <div className="columns large-12">
                
                <div className="row">
                  <div className="columns medium-12">
                    <label> Psimod </label>
                  </div>
                </div>
                
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter Gene" />
                    {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                  </div>
                </div>
              </div>
        </div>

        {/* Modifier */}
        <div className="row">
            <div className="columns large-12">
                
                <div className="row">
                  <div className="columns medium-12">
                    <label> Modifier(sgdid, systematic name) </label>
                  </div>
                </div>
                
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter Gene" />
                    {/* <label data-alert className={this.state.urlError}>URL is required</label> */}
                  </div>
                </div>
              </div>
        </div>
        
      </form>
    );
  }
}


export default PtmForm;