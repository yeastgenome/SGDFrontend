import React, {Component} from "react";

class FileStatusRadio extends Component{
    constructor(props){
        super(props);
    }

    render(){
        return <div className="row">
            <div className="column small-6 radio-element-container file-status-radio">
              <input type="radio"  value="active" name="Active" id="active" checked={this.props.flag} onChange={this.props.onFileStatusChange} />
              <label htmlFor="active">Active</label>
              <input type="radio"  value="all" name="All" id="all" checked={!this.props.flag} onChange={this.props.onFileStatusChange} />
              <label htmlFor="all">All</label>
            </div>
          </div>;
    }
}

export default FileStatusRadio;
