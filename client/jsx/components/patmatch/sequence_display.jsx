import React from 'react';
import _ from 'underscore';

const LETTERS_PER_CHUNK = 10;
const LETTERS_PER_LINE = 60;

const SequenceDisplay = React.createClass({

  getDefaultProps: function () {
    return {
      sequence: null,
      text: null,
      beg: null,
      end: null
    };
  },

  render: function () {
    var textNode = null;
    if (this.props.text) {
      textNode = <h3>{this.props.text}</h3>;
    }

    var sequenceTextNode = this._formatSequenceTextNode();

    return (<div>
            {textNode}
            {sequenceTextNode}
    </div>);
  },

  _formatSequenceTextNode: function () {
      var seq = this.props.sequence;
      var beg = this.props.beg;
      var end = this.props.end;
      var sequenceNode = this._getSequenceNode(seq, beg, end);
      var complexSequenceNode = this._getComplexSequenceNode(seq);
        
      return (<div>
             <pre>
             <blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}>
             		 {sequenceNode}
			 {complexSequenceNode}
             </blockquote>
             </pre>
      	     </div>);
   
  },

  _getComplexSequenceNode: function (sequence) {
    var maxLabelLength = sequence.length.toString().length + 1;
    var chunked = sequence.split("");
    var offset = 0;

    return _.map(chunked, (c, i) => {
      i++;
      var sp = (i % LETTERS_PER_CHUNK === 0 && !(i % LETTERS_PER_LINE === 0)) ? " " : "";
      var cr = (i % LETTERS_PER_LINE === 0) && (i > 1) ? "\n" : "";
      var str = c + sp + cr;
    
      var labelNode = (i - 1) % LETTERS_PER_LINE === 0 ? <span style={{ color: "#6f6f6f" }}>{`${Array(maxLabelLength - i.toString().length).join(" ")}${i} `}</span> : null;

      return <span key={`sequence-car${i}`} style={{ color: "#6f6f6f" }}>{labelNode}{str}</span>;
    });
  },

  _getSequenceNode: function (sequence, beg, end) {
    var tenChunked = sequence.match(/.{1,10}/g).join(" ");
    var lineArr = tenChunked.match(/.{1,66}/g);
    var maxLabelLength = ((lineArr.length * LETTERS_PER_LINE + 1).toString().length)
    lineArr = _.map(lineArr, (line, i) => {
      var lineNum = i * LETTERS_PER_LINE + 1;
      var numSpaces = maxLabelLength - lineNum.toString().length;
      var spacesStr = Array(numSpaces + 1).join(" ");

      if (beg >= lineNum && beg <= lineNum + 59) {
      	  var tmpBeg = beg - lineNum;
	  var tmpEnd = end - lineNum;
      	  var newline = "";
	  var baseArr = line.split("");
	  var k = 0;
	  _.map(baseArr, (base, j) => {
	      if (k < tmpBeg || k > tmpEnd || base == ' ') {
	      	   newline += base;
	      }
	      else {
	      	   newline += <span style={{ color: 'blue' }}>{base}</span>;
	      } 
	      if (base != ' ') {
	      	   k++;
	      }
	  });
	  line = newline;
      }
      return `${spacesStr}${lineNum} ${line}`;
    });
    return _.map(lineArr, (l, i) => {
      return <span key={'seq' + i}>{l}<br /></span>;
    });
  }

});

module.exports = SequenceDisplay;
