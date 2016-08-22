"use strict";
var React = require("react");
var _ = require("underscore");
var Radium = require("radium");

var Paginator = React.createClass({
  propTypes: {
    onPaginate: React.PropTypes.func, // (newPageNum) =>
    currentPage: React.PropTypes.number,
    totalPages: React.PropTypes.number.isRequired
  },

  getDefaultProps: function () {
    return { currentPage: 0 };
  },

  render: function () {
    var text = `Page ${this.props.currentPage + 1} of ${this.props.totalPages.toLocaleString()}`;
    var prevPageNum = this.props.currentPage - 1;
    var nextPageNum = this.props.currentPage + 1;
    var onClickPrev =  e => { this._onPaginate(prevPageNum); };
    var onClickNext = e => { this._onPaginate(nextPageNum); };
    var prevKlass = prevPageNum < 0 ? " disabled" : "";
    var nextKlass = nextPageNum > this.props.totalPages - 1 ? " disabled" : "";

    return (
      <div style={[style.wrapper]}>
        <p style={[style.text]}>{text}</p>
        <p style={[style.text]}><a onClick={onClickPrev} className={"button tiny secondary" + prevKlass} style={[style.button]}><i className="fa fa-chevron-left" /></a> <a onClick={onClickNext} className={"button tiny secondary" + nextKlass} style={[style.button]}><i className="fa fa-chevron-right" /></a></p>
      </div>
    );
  },

  _onPaginate: function (newPageNum) {
    if (newPageNum < 0 || newPageNum > this.props.totalPages - 1) return;
    if (typeof this.props.onPaginate === "function") this.props.onPaginate(newPageNum);
  }
});

const style = {
  wrapper: {
    marginBottom: '1rem'
  },
  button: {
    userSelect: 'none'
  },
  text: {
    marginBottom: '0.5rem'
  }
}

module.exports = Radium(Paginator);
