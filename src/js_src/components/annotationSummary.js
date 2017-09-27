import React, { Component } from 'react';
import CategoryLabel from './categoryLabel';
import { Link } from 'react-router';

const PREVIEW_URL = 'https://preview.qa.yeastgenome.org';

class AnnotationSummary extends Component {
  renderUpdatedBy(d) {
    if (d.date_created && d.created_by) {
      return <span>on {d.date_created} by {d.created_by}</span>;
    }
    return null;
  }

  renderBlock(d) {
    if (d.value) {
      return (
        <blockquote dangerouslySetInnerHTML={{ __html: d.value}} />
      );
    }
    return null;
  }

  renderAnnotations() {
    let nodes = this.props.annotations.map( (d, i) => {
      let previewUrl = `${PREVIEW_URL}${d.href}`;
      let curateNode = null;
      if (d.category === 'reference' || d.category === 'locus') {
        let curateUrl = `/curate${d.href}`.replace(/regulation|phenotype/, '');
        curateNode = <Link to={curateUrl}><i className='fa fa-edit' /> Curate</Link>;
      }
      return (
        <div key={'note' + i}>
          <p>
            <CategoryLabel category={d.category} hideLabel /> <a href={previewUrl} target='_new'>{d.name}</a> {d.type} {this.renderUpdatedBy(d)} {curateNode}
          </p>
          {this.renderBlock(d)}
        </div>
      );
    });
    return <div>{nodes}</div>;
  }

  render() {
    let message = this.props.message || 'annotations successfully uploaded.';
    return (
      <div>
        <p>{this.props.annotations.length.toLocaleString()} {message}</p>
        {this.renderAnnotations()}
      </div>
    );
  }
}

AnnotationSummary.propTypes = {
  annotations: React.PropTypes.array,
  message: React.PropTypes.string
};

export default AnnotationSummary;
