import React from 'react';
import {Component} from 'react';

class StaticInfo extends Component{
    render(){
        return (<div><p>Data at SGD can be downloaded in multiple ways:</p>
		<ul>
			<li>From <a title="YeastMine" href="https://yeastmine.yeastgenome.org/yeastmine/begin.do">YeastMine</a>, a powerful search and retrieval tool that allows for sophisticated queries and download in customizable user-defined formats.</li>
			<li>From individual pages. For example, via the 'Download Data' link on the phenotypes or interactions pages.</li>
			<li>In pre-defined formats available from our Downloads server:</li>
		</ul></div>);
    }
}

export default StaticInfo;
