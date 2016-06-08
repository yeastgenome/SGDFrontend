var React = require("react");

module.exports = React.createClass({
    render: function() {
    var rows = this.props.results.map(function(r) {
      return (<div className="colleaguesSearchResult">
        <h3><a href={'/colleagues/' + r.format_name}>{r.last_name}, {r.first_name}</a></h3>		    
        {r.organization ? <span className="organization">{r.organization}</span> : null}
        {r.email ? <span className="email"><i className="fa fa-envelope"></i>{r.email}</span> : null}
        {r.work_phone ? <span className="work-phone"><i className="fa fa-phone"></i>{r.work_phone}</span> : null}
        {r.fax ? <span className="fax"><i className="fa fa-fax"></i>{r.fax}</span> : null}
        <span className="webpages">
          {r.webpages && r.webpages.lab_url ? <span className="lab-url"><a href={r.webpages.lab_url} target="_blank">Lab</a></span> : null}
          {r.webpages && r.webpages.research_summary_url ? <span><a href={r.webpages.research_summary_url} target="_blank">Research summary</a></span> : null}
          </span>
      </div>);
    });

    var colleaguesFound = (<label className="number-results">{this.props.results.length} {this.props.results.length > 1 ? "colleagues" : "colleague"} {this.props.results.length > 1 ? "were" : "was"} found:</label>);

    var colleaguesNotFound = (<label className="number-results">No colleagues were found.</label>);

    return (
      <div className="small-12 columns">
        <div className="colleaguesSearchResults">
          {this.props.results.length == 0 ? colleaguesNotFound : colleaguesFound}
          {rows}
        </div>
      </div>
    );
  }
});
