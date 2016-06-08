// import React from 'react';
// import { connect } from 'react-redux';
// import { Link } from 'react-router';

// const ColleaguesIndex = React.createClass({
//   render() {
//     return (
//       <div>
//         <h1>Colleagues</h1>
//         <hr />
//         <Link to='/curate/colleagues/new' className='button small'>
//           <i className='fa fa-plus' /> Add New Colleague
//         </Link>
//       </div>
//     );
//   }
// });

// function mapStateToProps(_state) {
//   return {
//   };
// }

// export default connect(mapStateToProps)(ColleaguesIndex);
var React = require("react");
var ColleaguesSearchResult = require("./search_result");
var _ = require("underscore");

const COLLEAGUE_SEARCH_URL = '/colleagues';

module.exports = React.createClass({
    getInitialState: function() {
  return {
      isComplete: false,
      query: null,
      searchResults: null,
      title: "Search SGD Colleague Information",
      isPending: false
  };
    },

    _queryInURL: function() {
  var param = "last_name";
  var regex = new RegExp("[?&]" + param + "(=([^&#]*)|&|#|$)");
  
        var results = regex.exec(window.location.href);
  
  if (!results) {
      return null;
  }
  
  if (!results[2]) {
      return '';
  }
  
  return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

    render: function () {
  var query_in_url = this._queryInURL();
  if (query_in_url && !this.state.isPending && !this.state.isComplete) {
      this.state.query = query_in_url;
      return null;
  }

  if (this.state.isPending) {
      var formNode = this._getFormResultsNode();
  } else if (this.state.isComplete) {
      var formNode = this._getFormResultsNode();
  } else {
      var formNode = this._getFormNode();
  }
  
  return (<div className="spacer"><h1 id="center_title">{this.state.title}
    <span className="context-help-icon"><a href="http://www.yeastgenome.org/help/colleaguesearch.html"><i className="fa fa-question-circle"></i></a></span></h1>{formNode}</div>);
    },

    _getFormResultsNode: function() {
  if (this.state.isComplete) {
      var searchResults = (<ColleaguesSearchResult query={this.state.query} results={this.state.searchResults} />);
  } else {
      var searchResults = (<div className="sgd-loader-container"><div className="sgd-loader"></div></div>);
  }

  return (<div>
                  <form className="searchResultsForm" autoComplete="off" onSubmit={this._onSubmit}>
    
        <div className="row">
          <div className="small-8 column">
            <label className="control-label">Last Name (e.g. Botstein, Jones, Smith):</label>
          </div>
       </div>

       <div className="row medium-uncollapse large-collapse">
         <div className="small-12 column">
           <input style={{display:"none"}}></input>
           <input name="title" type="text" className="form-control input-name" id="last_name" ref="name" autoComplete="off" defaultValue={this.state.query}></input>
    <input type="submit" value="Search" className="button small secondary"  />
    <a className="addColleague button small secondary">Add New Colleague</a>
        </div>
      </div>
    </form>
    <div id="searchResultsContent" className="row">
      {searchResults}
    </div>
              </div>);
    },
    
    _getFormNode: function() {
      return (
        <div>
          <form className="searchForm" autoComplete="off" onSubmit={this._onSubmit}>
            <div className="row">
        
              <div className="small-8 small-centered column">
                <label className="control-label" htmlFor="last_name">Last Name (e.g. Botstein, Jones, Smith):</label>
              </div>
           </div>
           <div className="row align-justify">
             <div className="small-8 small-centered column">
               <input style={{display:"none"}}></input>
               <input name="title" type="text" className="form-control" id="last_name" ref="name" autoComplete="off"></input>
             </div>
           </div>
           <div className="row align-center formButtons">
             <div className="small-8 small-centered column">
               <input type="submit" value="Search" className="searchButton button small secondary" />
             </div>   
           </div>
          </form>
        </div>
      );
    },

    _onSubmit: function (e) {
      if (e) e.preventDefault();
      var query = this.refs.name.value.trim();
      fetch(`${COLLEAGUE_SEARCH_URL}?last_name=${query}`, {
        credentials: 'same-origin',
      }).then( response => {
        return response.json();
      }).then( json => {
        console.log('json ', json)
      });

      // $.ajax({
      //     url: "/colleagues?last_name=" + query,
      //     data_type: 'json',
      //     type: 'GET',
      //     success: function(data) {
      //   if (data && data.length >= 0) {
      //       this.setState({isComplete: true, isPending: false, searchResults: data, title: "SGD Colleague Search Results"});
      //   }
      //     }.bind(this),
      //     error: function(xhr, status, err) {
      //   this.setState({isPending: true}); 
      //     }.bind(this)
      // });

      // this.setState({isComplete: false, isPending: true, query: query});
    }
});

