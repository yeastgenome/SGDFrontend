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
import FileStatusRadio from "../components/downloads/file_status_radio";

const DOWNLOADS_URL = "/downloads";

class CustomTreeContainer extends Component {
  constructor(props) {
    super(props);
    this.leafClick = this.leafClick.bind(this);
    this.nodeToggle = this.nodeToggle.bind(this);
    this.getSelectedNode = this.getSelectedNode.bind(this);
    this.onFileStatusChange = this.onFileStatusChange.bind(this);
    this.isOpen = this.isOpen.bind(this);
    this.updateIdsObj = this.updateIdsObj.bind(this);
    this.state = { visible: false, idsObj: {} };
    
  }
  
  isOpen(id) {
    if (id in this.state.idsObj) {
      return this.state.idsObj[id];
    }
    return false;
  }

  updateIdsObj(obj, id, flag) {
    if (id in obj) {
      obj[id] = flag;
      return obj;
    } else {
      obj[id] = flag;
      return obj;
    }
  }

  onFileStatusChange(event) {
    if (event.target.id == "active") {
      this.props.dispatch(
        downloadsActions.fetchDownloadResults(this.props.queryParams.id, true)
      );
      const item = this.props.queryParams;
      if (item.status) {
        item.status = "active";
        this.props.history.pushState(null, DOWNLOADS_URL, item);
      }
    } else {
      this.props.dispatch(
        downloadsActions.fetchDownloadResults(this.props.queryParams.id, false)
      );
      const item = this.props.queryParams;
      if (item.status) {
        item.status = "all";
        this.props.history.pushState(null, DOWNLOADS_URL, item);
      }
    }
  }

  formatData(data) {
    let results = { headers: [], rows: [] };
    if (data.length > 0) {
      let modData = data.map((item, index) => {
        if (item) {
          let rmText = item.name;
          let dText = item.name;
          return {
            readme_href: (
              <span key={item.name}>
                <a
                  href={item.readme_url}
                  target="_blank"
                  className="td-hide-icon"
                >
                  <i
                    className="fa fa-file-text-o fa-lg"
                    aria-hidden="true"
                    style={{ width: 80 }}
                  />
                </a>
              </span>
            ),
            download_href: (
              <span key={item.name + 1}>
                <a href={item.href} download={dText} className="td_hide_icon">
                  <i
                    className="fa fa-cloud-download fa-lg"
                    aria-hidden="true"
                    style={{ width: 80, color: "#8C1515" }}
                  />
                </a>
              </span>
            ),
            name: item.name,
            size: item.file_size !== null ? item.file_size : "Not Found",
            status: item.status,
            description: item.description
          };
        }
      });
      modData.map((item, index) => {
        results.rows.push(_.values(item));
      });
      results.headers.push([
        "README ",
        "Download ",
        "Name",
        "Size",
        "Status",
        "Description"
      ]);
      return results;
    }
    return results;
  }
  nodeToggle(node) {
    this.props.dispatch(downloadsActions.toggleNode(!this.props.isVisible));
  }
  fetchDownloads(term) {
    if (this.props.queryParams.status) {
      const flag = this.props.queryParams.status == "active" ? true : false;
      this.props.dispatch(downloadsActions.fetchDownloadResults(term, flag));
    } else {
      this.props.dispatch(
        downloadsActions.fetchDownloadResults(
          term,
          this.props.isFileStatusActive
        )
      );
    }
  }
  leafClick(event) {
    const nodeId = Number(event.target.getAttribute("data-node-id"));
    let qStringObj = this.props.queryParams;
    this.fetchDownloads(event.target.id);
    if (this.props.selectedNode) {
      this.props.history.pushState(null, DOWNLOADS_URL, {
        category: this.props.selectedNode.title,
        id: event.target.id,
        item: event.target.getAttribute("data-path"),
        status: this.props.isFileStatusActive ? "active" : "all"
      });
    } else {
      if (qStringObj) {
        this.props.history.pushState(null, DOWNLOADS_URL, {
          category: qStringObj.category,
          id: event.target.id,
          item: event.target.getAttribute("data-path"),
          status: this.props.isFileStatusActive ? "active" : "all"
        });
      }
    }
    this.setState({idsObj: this.updateIdsObj(this.state.idsObj,nodeId, true)});
  }
  getSelectedNode(node, event) {
    const eClass = event.target.getAttribute("class");
    const queryObj =
      this.props.queryParams.length > 0 ? this.props.queryParams : undefined;
    if (node.node_flag) {
      if (queryObj) {
        this.props.history.pushState(null, DOWNLOADS_URL, {
          category: node.title,
          id: node.id,
          item: node.path
            .split("/")
            .filter(itx => itx)
            .join("_"),
          status: queryObj.status
        });
      } else {
        this.props.history.pushState(null, DOWNLOADS_URL, {
          category: node.title,
          id: node.id,
          item: node.path
            .split("/")
            .filter(itx => itx)
            .join("_"),
          status: this.props.isFileStatusActive ? "active" : "all"
        });
      }
      this.fetchDownloads(node.id);
    }
    else{
       if (queryObj) {
         this.props.history.pushState(null, DOWNLOADS_URL, {
           category: node.title,
           id: node.id,
           item: node.path
             .split("/")
             .filter(itx => itx)
             .join("_"),
           status: queryObj.status
         });
       }
       else{
         this.props.history.pushState(null, DOWNLOADS_URL, {
           category: node.title,
           id: node.id,
           item: node.path
             .split("/")
             .filter(itx => itx)
             .join("_"),
           status: this.props.isFileStatusActive ? "active" : "all"
         });
         
       }
    }
    this.props.dispatch(downloadsActions.getNode(node));
    if(eClass.indexOf("down") > -1 && this.isOpen(node.id)){
      this.setState({visible:false, idsObj: this.updateIdsObj(this.state.idsObj,node.id, false)})
    }
    else if(eClass.indexOf("up") > -1 && !this.isOpen(node.id)){
      this.setState({
        visible: true,
        idsObj: this.updateIdsObj(this.state.idsObj, node.id, true)
      });
    }
    else{
      this.setState({
        visible: node.node_flag,
        idsObj: this.updateIdsObj(
          this.state.idsObj,
          node.id,
          node.node_flag
        )
      });
    } 
  }
  componentDidMount() {
    this.props.dispatch(downloadsActions.fetchDownloadsMenuData());
    if (this.props.query) {
      const qId = Number(this.props.queryParams.id);
      if (typeof query == "string") {
        this.props.dispatch(
          downloadsActions.fetchDownloadResults(this.props.query)
        );
      } else {
        if (this.props.queryParams.status) {
          const flag = this.props.queryParams.status == "active" ? true : false;
          this.props.dispatch(
            downloadsActions.fetchDownloadResults(this.props.query.id, flag)
          );
        } else {
          this.props.dispatch(
            downloadsActions.fetchDownloadResults(this.props.query.id)
          );
        }
      }
      if(!this.state.idsObj[qId]){
        this.setState({
          visible: true,
          idsObj: this.updateIdsObj(
            this.state.idsObj,
            qId,
            true
          )
        });

      }
    }
  }
  renderMtree() {
    let items = this.props.downloadsMenu;
  }
  renderTreeStructure() {
    let items = this.props.downloadsMenu;
    if (items.length > 0) {
      const selNode = this.props.queryParams.item
        ? this.props.queryParams.item
            .split("-")
            .filter(qs => qs)
            .join(" ")
        : undefined;
      const activeNode = selNode
        ? _.findWhere(items, { title: S(selNode).capitalize().s })
        : undefined;
      let treeNodes = items.map((node, index) => {
        let qParamString = this.props.selectedNode
          ? this.props.selectedNode.path
          : " ";
        if (
          node.path.toLowerCase().indexOf(qParamString.toLowerCase()) > -1 ||
          qParamString.toLowerCase().indexOf(node.path.toLowerCase()) > -1
        ) {
          if (node) {
            return (
              <CustomTree
                activeRootNode={this.isOpen(node.id)}
                statusNodes={this.state.idsObj}
                isOpenNode={this.isOpen}
                isActive={true}
                selectedNode={this.props.selectedNode}
                key={index}
                node={node}
                path={node.path
                  .split("/")
                  .filter(itx => itx)
                  .join("_")}
                leafClick={this.leafClick}
                nodeClick={this.getSelectedNode}
                queryString={this.props.queryParams}
              />
            );
          }
        } else {
          if (node) {
            return <CustomTree isActive={false} activeRootNode={this.isOpen(node.id)} statusNodes={this.state.idsObj} isOpenNode={this.isOpen} key={index} node={node} path={node.path
                  .split("/")
                  .filter(itx => itx)
                  .join("_")} leafClick={this.leafClick} nodeClick={this.getSelectedNode} queryString={this.props.queryParams} />;
          }
        }
      });
      return treeNodes;
    } else {
      return [];
    }
  }

  renderDescriptions() {
    let items = this.props.downloadsMenu;
    if (items.length > 0) {
      let temp_arr = items.map(itm => {
        if (itm) {
          return (
            <DownloadsDescription
              key={itm.title}
              description={itm.description}
              title={itm.title}
              path={itm.path}
            />
          );
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
        let temp = (
          <div className="row test">
            <div className="columns small-12">
              <div className="columns small-6">
                <FileStatusRadio
                  onFileStatusChange={this.onFileStatusChange}
                  flag={this.props.isFileStatusActive}
                />
              </div>
              <div classsName="columns small-6" />
            </div>
            <div className="columns small-12">
              <DataTable
                data={table}
                usePlugin={true}
                className="downloads-table-center"
              />
            </div>
          </div>
        );
        let node = this.props.isPending ? <Loader /> : temp;
        let renderTemplate = (
          <div>
            {pageTitle}
            <div className="row">
              <div className="columns small-2">{data}</div>
              <div className="columns small-10">{node}</div>
            </div>
          </div>
        );
        return renderTemplate;
      } else {
        let renderTemplate = (
          <div>
            {pageTitle}
            <div className="row">
              <div className="columns small-2">{data}</div>
              <div className="columns small-10">
                <StaticInfo />
                {data_info}
              </div>
            </div>
          </div>
        );
        return renderTemplate;
      }
    } else {
      if (this.props.downloadsResults.length > 0) {
        let table = this.formatData(this.props.downloadsResults);
        let cssTree = { "list-style-Type": "none" };
        let temp = (
          <div className="row test">
            <div className="columns small-12">
              <div className="columns small-6">
                <FileStatusRadio
                  onFileStatusChange={this.onFileStatusChange}
                  flag={this.props.isFileStatusActive}
                />
              </div>
              <div classsName="columns small-6" />
            </div>
            <div className="columns small-12">
              <DataTable
                data={table}
                usePlugin={true}
                className="downloads-table-center"
              />
            </div>
          </div>
        );
        let renderTemplate = (
          <div>
            {pageTitle}
            <div className="row">
              <div className="columns small-2">{data}</div>
              <div className="columns small-10">{temp}</div>
            </div>
          </div>
        );
        return renderTemplate;
      } else {
        if (Object.keys(this.props.queryParams).length > 0) {
          let renderTemplate = (
            <div>
              {pageTitle}
              <div className="row">
                <div className="columns small-2">{data}</div>
                <div className="columns small-10">
                  <StaticInfo />
                  {data_info}
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
                <div className="columns small-2">{data}</div>
                <div className="columns small-10">
                  <StaticInfo />
                  {data_info}
                </div>
              </div>
            </div>
          );
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
    selectedNode: state.downloads.selectedNode,
    isFileStatusActive: state.downloads.isFileStatusActive
  };
}

export default connect(mapStateToProps)(CustomTreeContainer);
