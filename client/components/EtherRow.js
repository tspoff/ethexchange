import React, { Component } from 'react'
import Web3Container from '../lib/Web3Container'
import { Table, Button, Input } from 'semantic-ui-react';
import Layout from '../components/Layout';

class EtherRow extends Component {
    state = {
        depositAmount: 0,
        withdrawAmount: 0
    }

    onDeposit = async () => {
        const { exchangeInstance, accounts, name, web3 } = this.props;
        const {depositAmount} = this.state;

        let amountInWei = web3.toWei(depositAmount, "ether");

        console.log(web3.fromWei(amountInWei, "ether"));

        await exchangeInstance.depositEther({ from: accounts[0], value: amountInWei });
        this.setState({ depositAmount: 0 });
        
    };

    onWithdraw = async () => {
        const { exchangeInstance, accounts, name } = this.props;
        const { withdrawAmount } = this.state;

        let amountInWei = web3.toWei(withdrawAmount, "ether");

        await exchangeInstance.withdrawEther(amountInWei, { from: accounts[0] });
        this.setState({ withdrawAmount: 0 });

    };

    render() {
        const { Row, Cell } = Table;
        const { balance } = this.props;
        const { depositAmount, withdrawAmount } = this.state;

        return (
            <Row>
                <Cell>-</Cell>
                <Cell>Ether</Cell>
                <Cell>{balance}</Cell>
                {/* <Cell>
                    <Button color="green" basic onClick={this.onDeposit}>Deposit</Button>
                    <Input
                        label="ether"
                        labelPosition="right"
                        value={depositAmount}
                        onChange={event => {
                            this.setState({ depositAmount: event.target.value })
                        }}
                    />
                </Cell>
                <Cell>
                    <Button color="teal" basic onClick={this.onWithdraw}>Withdraw</Button>
                    <Input
                        label="ether"
                        labelPosition="right"
                        value={withdrawAmount}
                        onChange={event => {
                            this.setState({ withdrawAmount: event.target.value })
                        }}
                    />
                </Cell> */}
            </Row>
        );
    }
}
export default EtherRow;