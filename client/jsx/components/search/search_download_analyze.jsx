const React = require('react');
import Radium from 'radium';

const SearchDownloadAnalyze = React.createClass({
  propTypes: {
    results: React.PropTypes.array,
    url: React.PropTypes.string,
    query: React.PropTypes.string
  },

  render () {
    const onDownloadClick = e => {
      this.refs.downloadForm.submit();
    };
    const onAnalyzeClick = e => {
      this.refs.analyzeForm.submit();
    };
    return (
      <div className='button-bar' style={[style.container]}>
        <ul className='button-group radius'>
          <li>
            <a className='tiny button secondary' onClick={onDownloadClick}><i className='fa fa-download' /> Download</a>
          </li>
        </ul>
        <ul className='button-group radius'>
          <li>
            <a className='tiny button secondary' onClick={onAnalyzeClick}><i className='fa fa-briefcase' /> Analyze</a>
          </li>
        </ul>
        {this._renderAnalyzeForm()}
        {this._renderDownloadForm()}
      </div>
    );
  },

  _renderAnalyzeForm () {
    let stringResults = this._getStringResults();
    return (
      <form ref='analyzeForm' action='/analyze' method='post' style={[style.form]}>
        <input type='hidden' name='bioent_ids' value={stringResults} />
        <input type='hidden' name='list_name' value='Search Results' />
      </form>
    );
  },

  _renderDownloadForm () {
    let stringResults = this._getStringResults();
    return (
      <form ref='downloadForm' action='/download-list' method='post' style={[style.form]}>
        <input type='hidden' name='bioent_ids' value={stringResults} />
        <input type='hidden' name='url' value={this.props.url} />
        <input type='hidden' name='query' value={this.props.query} />
      </form>
    );
  },

  _getStringResults () {
    let arrResults = this.props.results.reduce( (prev, current) => {
      prev.push(current.bioentity_id);
      return prev;
    }, []);
    return JSON.stringify(arrResults);
  }
});

const style = {
  container: {
    marginTop: '1.75rem',
    marginBottom: '2rem'
  },
  form: {
    display: 'none'
  }
};

export default Radium(SearchDownloadAnalyze);
