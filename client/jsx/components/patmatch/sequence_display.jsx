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
      var legendNode = null;
  
      return (<div>
             {legendNode}
             <pre>
             <blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}>
             		 {sequenceNode}
             </blockquote>
             </pre>
      	     </div>);
   
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
	  var newlineArr = line.split("");
	  for (var j = 0; j < newlineArr.length; j++) {
	      if (j < tmpBeg || j > tmpEnd || newlineArr[j] == ' ') {
  	      	  newline += newlineArr[j]; 
	      }
	      else {
	      	  newline += "<font color='blue'>newlineArr[j]</font>"; 
	      }
	  }
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
