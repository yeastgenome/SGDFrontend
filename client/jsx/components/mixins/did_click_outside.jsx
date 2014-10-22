/** @jsx React.DOM */

/*
	Assumes that component has method called didClickOutside, which handles being clicked outside
*/

module.exports = {
	// add event listener to document to dismiss when clicking
	componentDidMount: function () {
		document.addEventListener("click", () => {
			if (this.isMounted() && this.didClickOutside) {
				this.didClickOutside();
			}
		});
	},
};
