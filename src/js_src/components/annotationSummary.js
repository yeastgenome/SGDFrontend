import React, { Component } from 'react';
import CategoryLabel from './categoryLabel';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { PREVIEW_URL } from '../constants';
import DetaiLList from './detailList';

import TagList from './tagList';
import moment from 'moment';
import 'moment-timezone';
class AnnotationSummary extends Component {
  renderUpdatedBy(d) {
    if (d.date_created && d.created_by) {
      return <span>on <b>{moment(d.time_created).tz('America/Los_Angeles').format('MM-DD-YYYY h:mm:ss A z')}</b> by {d.created_by}</span>;
    }
    return null;
  }

  renderActivity(d) {
    if (d.data) {
      if (d.data.keys) {
        return (
          <div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
            <DetaiLList data={d.data.keys} />
          </div>
        );
      } else if (d.data.tags) {
        return this.renderTags(d.data);
      }

    }
    return null;
  }

  renderBlock(d) {
    if (d.is_curator_activity) {
      return this.renderActivity(d);
    }
    if (d.value) {
      return (
        <blockquote dangerouslySetInnerHTML={{ __html: d.value}} />
      );
    }
    return null;
  }

  renderTags(d) {
    if (!d.tags) return null;
    return <TagList tags={d.tags} isReadOnly />;
  }

  renderAnnotations() {
    let nodes = this.props.annotations.map( (d, i) => {
      let previewUrl = d.category =='download' ? d.href : `${PREVIEW_URL}${d.href}`;
      let curateNode = null;
      if (d.category === 'reference' || d.category === 'locus') {
        let curateUrl = `/curate${d.href}`.replace(/regulation|phenotype/, '');
        curateNode = <Link to={curateUrl}><i className='fa fa-edit' /> Curate</Link>;
      }
      let linkNode = <a href={previewUrl} target='_new'>{d.name}</a>;
      if (d.category === 'reserved_name') {
        linkNode = <span>{d.name}</span>;
      }
      if (d.category =='download'){
        curateNode = <Link to={{pathname:'file_curate_update', search:`?name=${d.name.replace(/<[^>]*>?/gm, '')}`}}><i className='fa fa-edit' /> Curate</Link>;
      }
      return (
        <div key={'note' + i}>
          <p>
            <CategoryLabel category={d.category} hideLabel /> {linkNode} {d.type} {this.renderUpdatedBy(d)} {curateNode}
          </p>
          {this.renderBlock(d)}
          {this.renderTags(d)}
        </div>
      );
    });
    return <div>{nodes}</div>;
  }

  renderMessage() {
    if (this.props.hideMessage) return null;
    let message = this.props.message || 'annotations successfully uploaded';
    return <p>{this.props.annotations.length.toLocaleString()} {message}</p>;
  }

  render() {

    return (
      <div>
        {this.renderMessage()}
        {this.renderAnnotations()}
      </div>
    );
  }
}

AnnotationSummary.propTypes = {
  annotations: PropTypes.array,
  message: PropTypes.string,
  hideMessage: PropTypes.bool
};

export default AnnotationSummary;
