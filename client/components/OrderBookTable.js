import React, { Component } from 'react'
import Web3Container from '../lib/Web3Container'
import { Table } from 'semantic-ui-react';
import OrderRow from './OrderRow';

class OrderBookTable extends Component {

    renderRows() {
        const { orders } = this.props;

        return orders.map(order => {
            return <OrderRow
                price={order.price}
                volume={order.volume}>
            </ OrderRow>
        });
    }

    render() {
        const { Header, Row, HeaderCell, Body } = Table;
        
        return (
            <Table>
                <Header>
                    <Row>
                        <HeaderCell>Price</HeaderCell>
                        <HeaderCell>Volume</HeaderCell>
                    </Row>
                </Header>
                <Body>
                    {this.renderRows()}
                </Body>
            </Table>
        );

    }
}

export default OrderBookTable;