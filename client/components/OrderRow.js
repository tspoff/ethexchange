import React, { Component } from 'react'
import { Table } from 'semantic-ui-react';

class OrderRow extends Component {

    render() {
        const { Row, Cell } = Table;
        const { price, volume } = this.props;

        return (
            <Row>
                <Cell>{price}</Cell>
                <Cell>{volume}</Cell>
            </Row>
        );
    }
}
export default OrderRow;