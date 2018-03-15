import React from "react";
import { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import CustomTree from "../components/downloads/custom_tree.jsx";
import MenuList from "../components/widgets/tree_menu/menu_list.jsx";
import * as downloadsActions from "../actions/downloads_actions";
import DataTable from "../components/widgets/data_table.jsx";
import Loader from "../components/widgets/loader.jsx";
import S from "string";
import _ from "underscore";
import { $, jQuery } from "jquery";
import ClassNames from "classnames";
import DownloadsDescription from "../components/downloads/downloads_description";
import StaticInfo from "../components/downloads/StaticInfo";

const DOWNLOADS_URL = "/downloads-tree";

class CustomTreeContainer extends Component {
  constructor(props) {
    super(props);
    this.leafClick = this.leafClick.bind(this);
    this.nodeToggle = this.nodeToggle.bind(this);
    this.getSelectedNode = this.getSelectedNode.bind(this);
    this.state = {tableData: null};
  }

  formatData(data) {
    let results = { headers: [], rows: [] };
    if (data.length > 0) {
        let modData = data.map((item, index) => {
            if (item) {
              let rmText = item.name;
              let dText = item.name;
                return { readme_href: <span key={item.name}>
                  <a href={item.readme_url} target="_blank">
                    <i className="fa fa-file-text-o fa-lg" aria-hidden="true" style={{ width: 80 }} />
                  </a>
                  </span>, download_href: <span key={item.name + 1}>
                    <a href={item.href} download={dText}>
                      <i className="fa fa-cloud-download fa-lg" aria-hidden="true" style={{ width: 80, color: "#8C1515" }} />
                    </a>
                  </span>, name: item.name, size:item.file_size, description: item.description };
        }
      });
        modData.map((item, index) => {
          results.rows.push(_.values(item));
        });
      results.headers.push(["README ", "Download ", "Name", "Size","Description"]);
        return results;
    }
    return results;
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
      id: event.target.id
    });
  }
  getSelectedNode(node) {
    this.props.dispatch(downloadsActions.getNode(node));
  }
  componentDidMount() {
    this.props.dispatch(downloadsActions.fetchDownloadsMenuData());
    if (this.props.query) {
      if(typeof(query) == "string"){
        this.props.dispatch(downloadsActions.fetchDownloadResults(this.props.query));
      }
      else{
        this.props.dispatch(downloadsActions.fetchDownloadResults(this.props.query.id));
      }
    }
  }
  renderMtree(){
    let items = this.props.downloadsMenu;
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
              queryString={this.props.queryParams}
            />
          );
        }
      });
      return treeNodes;
    } else {
      return [];
    }
  }

  renderDescriptions(){
    let items = this.props.downloadsMenu;
    if(items.length > 0){
      let temp_arr = items.map(itm => {
        if(itm){
          return <DownloadsDescription key={itm.title} description={itm.description} title={itm.title} path={itm.path} />;
        }
      });
      return temp_arr;
    }

  }
  render() {
    let data = this.renderTreeStructure();
    let data_info = this.renderDescriptions();
    const pageTitle = (
      <div className="row">
        <h1>Downloads</h1>
        <hr />
      </div>
    );
    if (this.props.isPending) {
      let table = this.formatData(this.props.downloadsResults);
      if (table) {
        let cssTree = { "list-style-Type": "none" };
        let node = this.props.isPending ? <Loader /> : <DataTable data={table} usePlugin={true} className="downloads-table-center" />;
        let renderTemplate = <div>
            {pageTitle}
            <div className="row">
              <div className="columns small-2">{data}</div>
              <div className="columns small-10">{node}</div>
            </div>
          </div>;
        return renderTemplate;
      } else {
        let renderTemplate = <div>
            {pageTitle}
            <div className="row">
              <div className="columns small-2">{data}</div>
              <div className="columns small-10">
                <StaticInfo />
                {data_info}
              </div>
            </div>
          </div>;
        return renderTemplate;
      }
    } else {
      if(this.props.downloadsResults.length > 0){
        let table = this.formatData(this.props.downloadsResults);
          let cssTree = { "list-style-Type": "none" };
          let renderTemplate = <div>
              {pageTitle}
              <div className="row">
                <div className="columns small-2">{data}</div>
                <div className="columns small-10">
                  <DataTable data={table} usePlugin={true} className="downloads-table-center" />
                </div>
              </div>
            </div>;
          return renderTemplate;
         
      }
      else{
        if(Object.keys(this.props.queryParams).length > 0){
          let renderTemplate = <div>
              {pageTitle}
              <div className="row">
                <div className="columns small-2">{data}</div>
                <div className="columns small-10">
                  <div className="callout warning">
                    <p>
                      <code>Files not found</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>;
          return renderTemplate;
        }
        else{
          let renderTemplate = <div>
              {pageTitle}
              <div className="row">
                <div className="columns small-2">{data}</div>
                <div className="columns small-10">
                  <StaticInfo />
                  {data_info}
                </div>
              </div>
            </div>;
          return renderTemplate;
        }
      }
      
    }
  }
}
function mapStateToProps(state) {
  return {
    downloadsMenu: state.downloads.downloadsMenu,
    downloadsResults: state.downloads.downloadsResults,
    isPending: state.downloads.isPending,
    query: state.downloads.query,
    selectedLeaf: state.downloads.selectedLeaf,
    url: `${state.routing.location.pathname}${state.routing.location.search}`,
    queryParams: (Object.keys(state.routing.location.query).length === 0 && state.routing.location.query.constructor === Object) ? {} : state.routing.location.query,
    nodeVisible: state.downloads.nodeVisible,
    selectedNode: state.downloads.selectedNode
  };
}
export default connect(mapStateToProps)(CustomTreeContainer);
