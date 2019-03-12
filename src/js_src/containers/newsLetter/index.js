import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';

import fetchData from '../../lib/fetchData';
// const DATA_URL = '/colleagues_subscriptions';
const SOURCE_URL = '/get_newsletter_sourcecode/Sagar';

const previewBox = {
  height:'735px',
  overflow:'scroll',
  overflowx:'hidden',
  border:'1px solid red'
};

class NewsLetter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code:''
    };

    this.handleCodeChange = this.handleCodeChange.bind(this);
  }
  componentDidMount(){
    fetchData(SOURCE_URL).then( _source => {
      this.setState({ code: _source.code });
    });
  }

  handleCodeChange(event){
    this.setState({code:event.target.value});
  }

  preview(){
    let htmlText = () => ({ __html: this.state.code});
    return (
      <div dangerouslySetInnerHTML={htmlText()}></div>
    );
  }

  render() {
    return (
      <CurateLayout>
        {
          <div>
            <h1>NewsLetter</h1>
            <form>
              <div className="row">
                <div className="column medium-12 large-12">
                  <label>Subject Line</label>
                </div>
                <div className="column medium-12 large-12">
                  <input/>
                </div>
              </div>

              <div className="row">
                <div className="column medium-6 large-6">

                  <div className="row">
                    <div className="column medium-12 large-12">
                      <label>HTML Code</label>
                    </div>
                  </div>

                  <div className="row">
                    <div className="column medium-12 large-12">
                      <textarea rows="30" cols="10" onChange={this.handleCodeChange} value={this.state.code}></textarea>
                    </div>
                  </div>
                </div>
                <div className="column medium-6 large-6">

                  <div className="row">
                    <div className="column medium-12 large-12">
                      <label>Previw Area</label>
                    </div>
                  </div>

                  <div className="row">
                    <div className="column medium-12 large-12" style={previewBox}>
                      {/* <textarea rows="5" cols="10" value={this.state.code}></textarea> */}
                      {this.preview()}
                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>
        }
      </CurateLayout>);
  }
}

// export default connect(mapStateToProps)(NewsLetter);
export default NewsLetter;
