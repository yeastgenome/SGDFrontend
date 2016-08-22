import React, { Component } from 'react';

const Footer = React.createClass({
  getDefaultProps() {
    return {
      assetRoot: '/static'   
    };
  },

  render() {
    let assetRoot = this.props.assetRoot;
    return (
      <footer id="layout-document-footer" className="page-footer">
        <div className="row">
          <div className="small-6 columns">
            <ul id="footer-links">
              <li className="sgd-link"><a href="http://www.yeastgenome.org">SGD</a></li>
              <li><a href="http://www.yeastgenome.org/about"><span>About</span></a></li>
              <li><a href="http://www.yeastgenome.org/blog"><span>Blog</span></a></li>
              <li><a href="http://www.yeastgenome.org/help"><span>Help</span></a></li>
              <li><a href="http://www.stanford.edu/site/terms.html"><span>Terms of Use</span></a></li>
              <li id="social-footer">
                <ul className="social-links">
                  <li><a href="/cgi-bin/suggestion" target="_blank" id="email-footer" className="webicon mail small">Email Us</a></li>
                  <li><a href="http://twitter.com/#!/yeastgenome" target="_blank" id="twitter-footer" className="webicon twitter small">Twitter</a></li>
                  <li><a href="https://www.facebook.com/pages/Saccharomyces-Genome-Database-SGD/139140876128200" target="_blank" className="webicon facebook small" id="facebook-footer">Facebook</a></li>
                  <li><a href="https://www.linkedin.com/company/saccharomyces-genome-database" target="_blank" className="webicon linkedin small" id="linkedin-footer">LinkedIn</a></li>
                  <li><a href="https://www.youtube.com/channel/UCnTiLvqP2aYeHEaJl7m9DUg" target="_blank" id="youtube-footer" className="webicon youtube small">YouTube</a></li>
                  <li><a href="/feed" target="_blank" id="rss-footer" className="webicon rss small">RSS</a></li>
                </ul>
              </li>
            </ul>
            <div id="copyright">&copy; Stanford University, Stanford, CA 94305.</div>
          </div>
          <div className="small-6 columns">
            <ul className="logo-list">
              <li><a href="http://genetics.stanford.edu">
                <img height="45" width="102" src={`${assetRoot}/img/genetics-logo@2x.png`} id="genetics-logo" />
              </a></li>
              <li><a href="http://med.stanford.edu">
                <img height="45" width="39" src={`${assetRoot}/img/som-logo@2x.png`} id="som-logo" />
              </a></li>
              <li><a href="http://www.stanford.edu"><img height="49" width="105" src={`${assetRoot}/img/footer-stanford-logo@2x.png`} id="stanford-logo" /></a></li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }
});

module.exports = Footer;
