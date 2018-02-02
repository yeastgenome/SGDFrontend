/**
 * author: fgondwe
 * date: 05/05/2017
 * purpose: manage state for custom tree component
 */
import React from "react";
import { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import CustomTree from "../components/downloads/custom_tree.jsx";
import * as downloadsActions from "../actions/downloads_actions";
import DataTable from "../components/widgets/data_table.jsx";
import S from "string";
import _ from "underscore";
import { $, jQuery } from "jquery";
import ClassNames from "classnames";

const DOWNLOADS_URL = "/downloads";

class CustomTreeContainer extends Component {
  constructor(props) {
    super(props);
    this.leafClick = this.leafClick.bind(this);
    this.nodeToggle = this.nodeToggle.bind(this);
    this.getSelectedNode = this.getSelectedNode.bind(this);
  }
  renderDataTable(data) {
    let results = { headers: [], rows: [] };
    if (data) {
      let modData = data.datasets.map((item, index) => {
        let rmText = `${item.name}.README`;
        let dText = `${item.name}.tgz`;
        return {
          readme_href: (
            <span>
              <a href={item.readme_href} download={rmText}>
                <i
                  className="fa fa-file-text-o fa-lg"
                  aria-hidden="true"
                  style={{ width: 80 }}
                />
              </a>
            </span>
          ),
          download_href: (
            <span>
              <a href={item.download_href} download={dText}>
                <i
                  className="fa fa-cloud-download fa-lg"
                  aria-hidden="true"
                  style={{ width: 80, color: "#8C1515" }}
                />
              </a>
            </span>
          ),
          name: item.name,
          description: item.description
        };
      });
      modData.map((item, index) => {
        let temp = _.values(item);
        results.rows.push(temp);
      });
      results.headers.push(
        Object.keys(data.datasets[0]).map((item, index) => {
          if (item.indexOf("readme") !== -1) {
            return "ReadMe ";
          } else if (item.indexOf("download") !== -1) {
            return "Download ";
          } else {
            return S(item).capitalize().s;
          }
        })
      );
      return results;
    }
  }
  nodeToggle(node) {
    this.props.dispatch(downloadsActions.toggleNode(!this.props.isVisible));
  }
  fetchDownloads(term) {
    this.props.dispatch(downloadsActions.fetchDownloadResults(term));
  }
  leafClick(event) {
    this.fetchDownloads(event.target.id);
    this.props.history.pushState(null, DOWNLOADS_URL, {
      category: this.props.selectedNode.title,
      item: event.target.id
    });
  }
  getSelectedNode(node) {
    this.props.dispatch(downloadsActions.getNode(node));
  }
  componentDidMount() {
    this.props.dispatch(downloadsActions.fetchDownloadsMenuData());
    if (this.props.query) {
      this.props.dispatch(
        downloadsActions.fetchDownloadResults(this.props.query)
      );
    }
  }
  renderTreeStructure() {
    let items = this.props.downloadsMenu;
    if (items.length > 0) {
      let treeNodes = items.map((node, index) => {
        if (node) {
          return (
            <CustomTree
              key={index}
              node={node}
              leafClick={this.leafClick}
              nodeClick={this.getSelectedNode}
              queryString={this.props.query}
            />
          );
        }
      });
      return treeNodes;
    } else {
      return [];
    }
  }
  render() {
    let data = this.renderTreeStructure();
    const pageTitle = (
      <div className="row">
        <h1>Downloads</h1>
        <hr />
      </div>
    );
    if (Object.keys(this.props.downloadsResults).length > 0) {
      let table = this.renderDataTable(this.props.downloadsResults);
      let cssTree = {
        "list-style-Type": "none"
      };
      let renderTemplate = (
        <div>
          {pageTitle}
          <div className="row">
            <div className="columns small-2">{data}</div>
            <div className="columns small-10">
              <DataTable data={table} usePlugin={true} />
            </div>
          </div>
        </div>
      );
      return renderTemplate;
    } else {
      let renderTemplate = (
        <div>
          {pageTitle}
          <div className="row">
            <div className="columns small-4">{data}</div>
          </div>
        </div>
      );
      return renderTemplate;
    }
  }
}
function mapStateToProps(state) {
  return {
    downloadsMenu: state.downloads.downloadsMenu,
    downloadsResults: state.downloads.downloadsResults,
    query: state.downloads.query,
    selectedLeaf: state.downloads.selectedLeaf,
    url: `${state.routing.location.pathname}${state.routing.location.search}`,
    queryParams: state.routing.location.query,
    nodeVisible: state.downloads.nodeVisible,
    selectedNode: state.downloads.selectedNode
  };
}
export default connect(mapStateToProps)(CustomTreeContainer);
