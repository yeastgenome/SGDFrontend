const React = require('react');
import Radium from 'radium';

const SearchDownloadAnalyze = React.createClass({
  propTypes: {

  },

  render () {
    const onAnalyzeClick = e => {
      this.refs.analyzeForm.submit();
    };
    return (
      <div className='button-bar' style={[style.container]}>
        <ul className='button-group radius'>
          <li>
            <a className='small button secondary'><i className='fa fa-download' /> Download</a>
          </li>
        </ul>
        <ul className='button-group radius'>
          <li>
            <a className='small button secondary' onClick={onAnalyzeClick}><i className='fa fa-briefcase' /> Analyze</a>
          </li>
        </ul>
        {this._renderAnalyzeForm()}
      </div>
    );
  },

  _renderAnalyzeForm () {
    let arrResults = this.props.results.reduce( (prev, current) => {
      let displayName = current.name.split(' / ')[0];
      prev.push(displayName);
      return prev;
    }, []);
    let stringResults = JSON.stringify(arrResults);
    return (
      <form ref='analyzeForm' action='/analyze' method='post' style={[style.form]}>
        <input type='hidden' name='bioent_ids' value={stringResults} />
        <input type='hidden' name='list_name' value='Search Results' />
        <input type='submit' className='small button secondary' value='Analyze' />
      </form>
    );
  }
});

const style = {
  container: {
    marginTop: '1rem'
  },
  form: {
    display: 'none'
  }
};

export default Radium(SearchDownloadAnalyze);
