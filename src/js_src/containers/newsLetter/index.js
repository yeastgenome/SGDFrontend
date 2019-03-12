import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';

import fetchData from '../../lib/fetchData';
// const DATA_URL = '/colleagues_subscriptions';
const SOURCE_URL = '/get_newsletter_sourcecode';
const SEND_EMAIL = '/send_newsletter';

const previewBox = {
  height: '630px',
  overflow: 'scroll',
  border: '1px solid rgba(0, 0, 0, 0.2)',
  // boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)'
};

class NewsLetter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://wiki.yeastgenome.org/index.php/SGD_Newsletter,_Fall_2018',
      code: ''
    };

    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.urlChange = this.urlChange.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
  }
  componentDidMount() {
    // fetchData(SOURCE_URL).then(_source => {
    //   this.setState({ code: _source.code });
    // });
  }

  sendEmail(){
    fetchData(SEND_EMAIL,{
      type:'POST',
      data:{html:this.state.code}
    }).then((data)=> {
      console.log(data);
    }).catch((data)=> {
      console.log(data);
    });
    
  }
  submitForm() {
    fetchData(SOURCE_URL, {
      type: 'POST',
      data: { url: this.state.url }
    }).then((data) => {
      this.setState({ code: data.code });
    }).catch((data) => {
      console.error(data);
    });
  }

  urlChange(event) {
    this.setState({ url: event.target.value });
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });
  }

  preview() {
    let htmlText = () => ({ __html: this.state.code });
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
                <label className="columns medium-12 large-1">URL</label>
                <input type="url" className="columns medium-12 large-8" placeholder="Enter URL for newsletter" value={this.state.url} onChange={this.urlChange} />
                <button type="button large-1 columns" onClick={this.submitForm} className="button">Get source code</button>
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
                      <textarea rows="26" cols="10" onChange={this.handleCodeChange} value={this.state.code}></textarea>
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
                    <div className="column medium-12 large-11" style={previewBox}>
                      {/* <textarea rows="5" cols="10" value={this.state.code}></textarea> */}
                      {this.preview()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
              </div>
            
              <div className="row">
                <div className="columns large-12">
                  <button type="button" onClick={this.sendEmail} className="button">Send Email</button>
                </div>
              </div>
            </form>
          </div>
        }
      </CurateLayout>);
  }
}

export default NewsLetter;
