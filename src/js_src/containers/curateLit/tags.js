import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import TagList from '../../components/tagList';
import Loader from '../../components/loader';
import fetchData from '../../lib/fetchData';
import { clearTags, updateTags } from './litActions';
import { setError, setMessage, clearError, setPending, finishPending} from '../../actions/metaActions';

class Tags extends Component {
  componentDidMount() {
    this.fetchData();
  }

  handleSave(e) {
    e.preventDefault();
    let id = this.props.id;
    let url = `/reference/${id}/tags`;
    let options = {
      data: JSON.stringify({ tags: this.props.activeTags }),
      type: 'PUT'
    };
    this.props.dispatch(setPending());
    fetchData(url, options).then( data => {
      this.props.dispatch(updateTags(data));
      this.props.dispatch(clearError());
      this.props.dispatch(finishPending());
      this.props.dispatch(setMessage('Tags updated successfully.'));
    }).catch( (data) => {
      let errorMessage = data ? data.error : 'There was an error updating tags.';
      this.props.dispatch(setError(errorMessage));
      this.props.dispatch(finishPending());
    });
  }

  fetchData() {
    let id = this.props.id;
    let url = `/reference/${id}/tags`;
    this.props.dispatch(clearTags());
    this.props.dispatch(setPending());
    fetchData(url).then( data => {
      this.props.dispatch(updateTags(data));
      this.props.dispatch(finishPending());
    });
  }

  render() {
    if (this.props.isPending) return <Loader />;
    let _onUpdate = newEntry => {
      this.props.dispatch(updateTags(newEntry));
    };
    return (
      <div>
        <TagList tags={this.props.activeTags} onUpdate={_onUpdate} />
        <a className='button' onClick={this.handleSave.bind(this)} style={{ marginTop: '1rem' }}>Save</a>
      </div>
    );
  }
}

Tags.propTypes = {
  activeTags: PropTypes.array,
  dispatch: PropTypes.func,
  id: PropTypes.string,
  isPending: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    activeTags: state.lit.get('activeTags').toJS(),
    isPending: state.meta.get('isPending')
  };
}

export default connect(mapStateToProps)(Tags);
