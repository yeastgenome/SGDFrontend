/** @jsx React.DOM */
var React = require("react");
var _ = require("underscore");
var d3 = require("d3");

var ChromosomeSnapshot = require("./chromosome_snapshot.jsx");

module.exports = React.createClass({

    getInitialState: function () {
        return {
            showChromosomes: false,
            inTransition: false
        };
    },

    toggleShowChromosomes: function (e) {
        this.setState({
            showChromosomes: !this.state.showChromosomes,
            inTransition: true
        });
    },

    render: function () {
        // prepare chromsomeNodes
        // If showChromosomes, create an array of ChromsomeSnapshots for each in chromosome data.
        // Otherwise, show combined features by making a single Chromsome snapshot with combined data.
		var chromosomeNodes, _maxFeatures, _height;
        if (this.state.showChromosomes) {
            _maxFeatures = d3.max(this.props.data.chromosomes, (_c) => {
                return _c.features.reduce( (total, f) => {
                    return total + f.value;
                }, 0);
            });

            chromosomeNodes = _.map(this.props.data.chromosomes, (c, i) => {
                var _delay = (i / this.props.data.chromosomes.length) * 1000;
    			return <ChromosomeSnapshot key={c.id} maxFeatures={_maxFeatures} displayName={c.display_name}
                    features={c.features} path={c.link} delay={_delay}
                />;
    		});
            _height = 1500;
        } else {
            _maxFeatures = _.reduce(this.props.data.combined, (total, f) => {
                return total + f.value;
            }, 0);
            chromosomeNodes =
                [<ChromosomeSnapshot key="combinedFeatureGraph" maxFeatures={_maxFeatures}
                    displayName="Genome Features" features={this.props.data.combined} path={null} pathRoot={"/locus/"} />];
            _height = 200;
        }

		return (
    		<div className='genome-snapshot' style={{ maxHeight: _height, overflow: "hidden" }}>
                <div className="switch-container">
                    <span><i className="fa fa-minus"></i>&nbsp;Combined</span>
                    <div className="switch round tiny" >
                        <input id="expandChromosomesSwitch" type="checkbox" />
                        <label htmlFor="expandChromosomesSwitch" onClick={this.toggleShowChromosomes}></label>
                    </div>
                    <span><i className="fa fa-list"></i>&nbsp;Chromosomes</span>
                </div>
                {chromosomeNodes}
    		</div>);
	}
});
