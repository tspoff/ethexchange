import React, { Component } from 'react'
import Web3Container from '../lib/Web3Container'
import { Table, Button, Input, Form, Message } from 'semantic-ui-react';

class TokenRow extends Component {
    state = {
        depositAmount: 0,
        withdrawAmount: 0,

        depositInput: {
            amount: 0,
            errorMessage: "",
            loading: false
        },

        withdrawInput: {
            amount: 0,
            errorMessage: "",
            loading: false
        }
    }

    render() {
        const { Row, Cell } = Table;
        const { index, name, address, balance } = this.props;
        const { depositAmount, withdrawAmount, depositInput, withdrawInput } = this.state;

        return (
            <Row>
                <Cell>{index}</Cell>
                <Cell>{name}</Cell>
                <Cell>{balance}</Cell>
                {/* <Cell>
                    <Button color="green" loading={depositInput.loading} onClick={this.onDeposit}>Deposit</Button>
                    <Input
                        label="tokens"
                        labelPosition="right"
                        value={depositAmount}
                        onChange={event => {
                            this.setState({ depositAmount: event.target.value })
                        }}
                    />
                </Cell>
                <Cell>
                    <Form onSubmit={this.onWithdraw} error={!!withdrawInput.errorMessage}>
                        <Form.Field>
                            <label>Withdraw Ether</label>
                            <Input
                                label="ether"
                                labelPosition="right"
                                value={withdrawInput.amount}
                                onChange={event => {
                                    withdrawInput.amount = event.target.value;
                                    this.setState({ withdrawInput })
                                }}
                            />
                            <Button primary loading={withdrawInput.loading}>Submit Order</Button>
                        </Form.Field>
                        <Message error header="Error" content={withdrawInput.errorMessage}></Message>
                        
                    </Form>
                </Cell> */}
            </Row>
        );
    }
}
export default TokenRow;