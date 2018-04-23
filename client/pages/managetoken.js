import React from 'react'
import Link from 'next/link'
import Web3Container from '../lib/Web3Container'
import { Menu, Grid, Form, Input, Message, Button } from 'semantic-ui-react';
import Layout from '../components/Layout';
import UIConstants from '../lib/uiConstants';

class ManageToken extends React.Component {
    state = {
        ethBalance: undefined,
        tokenBalance: undefined,
        currentAccount: undefined,
        exchangeAddress: undefined,
        tokens: [],
        sendTokenInput: {
            amount: '',
            address: '',
            errorMessage: '',
            loading: false
        },

        approveTokenInput: {
            amount: '',
            address: '',
            errorMessage: '',
            loading: false
        },

        addTokenInput: {
            name: '',
            address: '',
            errorMessage: '',
            loading: false
        },
    }

    async componentDidMount() {
        const { accounts, tokenInstance, exchangeInstance } = this.props;

        try {
            this.setState({ currentAccount: accounts[0] });
            this.setState({ exchangeAddress: exchangeInstance.options.address });
            this.updateTokenBalance();
        } catch (error) {
            console.log(error);
        }
    }

    handleItemClick = (e, { name }) => this.setState({ activeItem: name });

    updateTokenBalance = async () => {
        const { accounts, tokenInstance } = this.props;

        let tokenBalance;

        try {
            tokenBalance = await tokenInstance.balanceOf.call(accounts[0], { from: accounts[0] });
        } catch (err) {
            this.setState({ sendTokenInput: { errorMessage: err.message } });
        }
        this.setState({ tokenBalance: tokenBalance.toNumber() })
    };

    addTokenToExchange = async (event) => {
        event.preventDefault();

        const { accounts, tokenInstance, exchangeInstance } = this.props;
        const { tokenBalance, addTokenInput } = this.state;

        addTokenInput.loading = true;
        addTokenInput.errorMessage = '';
        this.setState({ addTokenInput });

        try {
            let txResult = await exchangeInstance.addToken(addTokenInput.name, addTokenInput.address, { from: accounts[0] });
            console.log(txResult);
        } catch (err) {
            addTokenInput.errorMessage = err.message;
            this.setState({ addTokenInput });
        }

        addTokenInput.loading = false;
        this.setState({ addTokenInput });

        this.updateTokenBalance();
    };

    sendToken = async (event) => {
        event.preventDefault();

        const { accounts, tokenInstance } = this.props;
        const { tokenBalance, sendTokenInput } = this.state;

        sendTokenInput.loading = true;
        sendTokenInput.errorMessage = '';
        this.setState({ sendTokenInput });

        try {
            let txResult = await tokenInstance.transfer(sendTokenInput.address, sendTokenInput.amount, { from: accounts[0] });
            console.log(txResult);
        } catch (err) {
            sendTokenInput.errorMessage = err.message;
            this.setState({ sendTokenInput });
        }

        sendTokenInput.loading = false;
        this.setState({ sendTokenInput });

        this.updateTokenBalance();
    };

    approveToken = async (event) => {
        event.preventDefault();

        const { accounts, tokenInstance } = this.props;
        const { tokenBalance, approveTokenInput } = this.state;

        approveTokenInput.loading = true;
        approveTokenInput.errorMessage = '';
        this.setState({ approveTokenInput });

        try {
            await tokenInstance.approve(approveTokenInput.address, approveTokenInput.amount, { from: accounts[0] });
        } catch (err) {
            approveTokenInput.errorMessage = err.message;
            this.setState({ approveTokenInput });
        }

        approveTokenInput.loading = false;
        this.setState({ approveTokenInput });

        this.updateTokenBalance();
    };

    render() {
        const { activeItem, tokenBalance, sendTokenInput, approveTokenInput, addTokenInput } = this.state
        return (
            <Layout>
                <Grid>
                    <Grid.Row>
                        <Form onSubmit={this.sendToken} error={!!sendTokenInput.errorMessage}>
                            <Form.Field>
                                <label>Send Token</label>
                                <Input
                                    label="tokens"
                                    labelPosition="right"
                                    value={sendTokenInput.amount}
                                    onChange={event => {
                                        sendTokenInput.amount = event.target.value;
                                        this.setState({ sendTokenInput })
                                    }}
                                />

                                <Input
                                    label="address"
                                    labelPosition="right"
                                    value={sendTokenInput.address}
                                    onChange={event => {
                                        sendTokenInput.address = event.target.value;
                                        this.setState({ sendTokenInput })
                                    }}
                                />
                            </Form.Field>
                            <h3>Amount: {sendTokenInput.amount}</h3>
                            <h3>Address: {sendTokenInput.address}</h3>
                            <Message content={UIConstants.SEND_TOKEN_INPUT_MESSAGE}></Message>
                            <Message error header="Error" content={sendTokenInput.errorMessage}></Message>
                            <Button primary loading={sendTokenInput.loading}>Send Tokens</Button>
                        </Form>
                    </Grid.Row>
                    <Grid.Row>
                        <Form onSubmit={this.approveToken} error={!!approveTokenInput.errorMessage}>
                            <Form.Field>
                                <label>Approve Token Allowance</label>
                                <Input
                                    label="token amount"
                                    labelPosition="right"
                                    value={approveTokenInput.amount}
                                    onChange={event => {
                                        approveTokenInput.amount = event.target.value;
                                        this.setState({ approveTokenInput })
                                    }}
                                />
                                <Input
                                    label="recipient address"
                                    labelPosition="right"
                                    value={approveTokenInput.address}
                                    onChange={event => {
                                        approveTokenInput.address = event.target.value;
                                        this.setState({ approveTokenInput })
                                    }}
                                />
                            </Form.Field>
                            <Message content={UIConstants.APPROVAL_TOKEN_INPUT_MESSAGE}></Message>
                            <Message error header="Error" content={approveTokenInput.errorMessage}></Message>
                            <Button primary loading={approveTokenInput.loading}>Allow Token Use</Button>
                        </Form>
                    </Grid.Row>
                    <Grid.Row>
                        <Form onSubmit={this.addTokenToExchange} error={!!addTokenInput.errorMessage}>
                            <Form.Field>
                                <label>Add Token To Exchange</label>
                                <Input
                                    label="token name"
                                    labelPosition="right"
                                    value={addTokenInput.name}
                                    onChange={event => {
                                        addTokenInput.name = event.target.value;
                                        this.setState({ addTokenInput })
                                    }}
                                />
                                <Input
                                    label="contract address"
                                    labelPosition="right"
                                    value={addTokenInput.address}
                                    onChange={event => {
                                        addTokenInput.address = event.target.value;
                                        this.setState({ addTokenInput })
                                    }}
                                />
                            </Form.Field>
                            <Message error header="Error" content={addTokenInput.errorMessage}></Message>
                            <Button primary loading={addTokenInput.loading}>Add Token</Button>
                        </Form>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <h3>Token Balance: {tokenBalance}</h3>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Layout>
        );
    }
}

export default () => (
    <Web3Container
        renderLoading={() => <div>Loading Dapp Page...</div>}
        render={({ web3, accounts, exchangeInstance, tokenInstance }) => (
            <ManageToken accounts={accounts} exchangeInstance={exchangeInstance} tokenInstance={tokenInstance} web3={web3} />
        )}
    />
)
