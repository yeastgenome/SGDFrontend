import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';

const ColleagueSearchResults = React.createClass({
  propTypes: {
    isTriage: React.PropTypes.bool
  },

  render () {
    let rows = this.props.results.map( (r, i) => {
      let urlSeg = this.props.isTriage ? '/triage' : '';
      let url = `/curate/colleagues${urlSeg}/${r.format_name}`;
      return (
        <div className='colleaguesSearchResult column row' key={`cSearchRes${i}`}>
          <h3><Link to={url}>{r.last_name}, {r.first_name}</Link></h3>		    
          {r.organization ? <span style={[style.listItem]}>{r.organization}</span> : null}
          {r.email ? <span style={[style.listItem]}><i className='fa fa-envelope'></i> {r.email}</span> : null}
          {r.work_phone ? <span style={[style.listItem]}><i className='fa fa-phone'></i> {r.work_phone}</span> : null}
          <p className='webpages'>
            {r.webpages && r.webpages.lab_url ? <span style={[style.listItem]} className='lab-url'><a href={r.webpages.lab_url} target='_blank'>Lab</a></span> : null}
            {r.webpages && r.webpages.research_summary_url ? <span style={[style.listItem]}><a href={r.webpages.research_summary_url} target='_blank'>Research summary</a></span> : null}
          </p>
        </div>
      );
    });
    var colleaguesFound = (<label className='number-results'>{this.props.results.length} {this.props.results.length > 1 ? 'colleagues' : 'colleague'} {this.props.results.length > 1 ? 'were' : 'was'} found:</label>);
    var colleaguesNotFound = (<label className='number-results'>No colleagues were found.</label>);

    return (
      <div>
        <div className='colleaguesSearchResults'>
          {this.props.results.length === 0 ? colleaguesNotFound : colleaguesFound}
          {rows}
        </div>
      </div>
    );
  }
});

const style = {
  listItem: {
    marginRight: '1rem',
    paddingRight: '1rem',
  }
};

export default Radium(ColleagueSearchResults);
