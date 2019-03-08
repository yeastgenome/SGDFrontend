import React from 'react';
import Radium from 'radium';
import { connect } from 'react-redux';
import SwaggerUi, {presets} from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

const SwaggerDoc = React.createClass({
    componentDidMount() {
        SwaggerUi({
            dom_id: "#swaggerContainer",
            url: "https://petstore.swagger.io/v2/swagger.json",
            enableCORS: false,
            presets: [presets.apis]
        });
    },
    render(){
        return (
            <div>Swagger thaaangs</div>
        );
    }
});
function mapStateToProps(_state) {
    return {};
}

export default connect(mapStateToProps)(Radium(SwaggerDoc));
