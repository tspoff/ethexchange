import React from 'react'
import Link from 'next/link'
import Web3Container from '../lib/Web3Container'
import { Table, Grid, Form, Input, Button, Message, Dropdown } from 'semantic-ui-react';
import Layout from '../components/Layout';
import OrderBookTable from '../components/OrderBookTable';

class Exchange extends React.Component {
    state = {
        ethBalance: undefined,
        tokens: [],
        numTokens: undefined,
        currentToken: undefined,
        buyOrderBook: [],
        sellOrderBook: [],

        buyOrderInput: {
            price: '',
            volume: '',
            errorMessage: '',
            loading: false
        },

        sellOrderInput: {
            price: '',
            volume: '',
            errorMessage: '',
            loading: false
        },
    }

    async componentDidMount() {

        try {
            await this.getTokensList();
            let { tokens } = this.state;
            let currentToken = tokens[0].name;
            this.setState({ currentToken });
            console.log(currentToken, "currentToken");
            await this.getOrderBooks();
        } catch (error) {
            console.log(error);
        }
    }

    async getTokensList() {
        const { accounts, exchangeInstance } = this.props;

        try {
            let numTokens = await exchangeInstance.getNumTokens.call({ from: accounts[0] });
            numTokens = numTokens.toNumber();
            console.log(numTokens);
            let tokenData;
            let tokenBalance;
            let tokens = [];

            //Add all tokens to list
            for (let i = 1; i <= numTokens; i++) {
                tokenData = await exchangeInstance.getTokenInfoByIndex(i, { from: accounts[0] });
                tokenBalance = await exchangeInstance.getBalance(tokenData[0], { from: accounts[0] });
                tokenBalance = tokenBalance.toNumber();

                tokenData = {
                    name: tokenData[0],
                    address: tokenData[1],
                    balance: tokenBalance,

                    //For component usage
                    key: i,
                    text: tokenData[0],
                    value: tokenData[0]
                };

                console.log(tokenData, "tokenData " + i);
                tokens.push(tokenData);
            }

            console.log(tokens, "tokens list");
            this.setState({ tokens });

        } catch (error) {
            console.log(error);
        }
    }

    /* Convert the double-array formatted order books from the contract into an object array */
    formatOrderBook(orderBook) {
        let formattedBook = [];

        for (let i in orderBook[0]) {
            formattedBook[i] = {
                price: orderBook[0][i].toNumber(),
                volume: orderBook[1][i].toNumber()
            };
        }

        return formattedBook;
    }

    async getOrderBooks() {
        const { accounts, exchangeInstance } = this.props;
        const { currentToken } = this.state;

        let buyOrderBook = await exchangeInstance.getBuyOrderBook(currentToken, { from: accounts[0] });
        let sellOrderBook = await exchangeInstance.getSellOrderBook(currentToken, { from: accounts[0] });

        buyOrderBook = this.formatOrderBook(buyOrderBook);
        sellOrderBook = this.formatOrderBook(sellOrderBook);

        console.log(buyOrderBook, "buyOrderBook");
        console.log(sellOrderBook, "sellOrderBook");

        this.setState({ buyOrderBook, sellOrderBook });
    }

    submitBuyOrder = async (event) => {
        event.preventDefault();

        const { accounts, exchangeInstance } = this.props;
        const { currentToken, buyOrderInput } = this.state;

        buyOrderInput.loading = true;
        buyOrderInput.errorMessage = '';
        this.setState({ buyOrderInput });

        try {
            let txResult = await exchangeInstance.buyToken(currentToken, buyOrderInput.price, buyOrderInput.volume, { from: accounts[0] });
            console.log(txResult);
        } catch (err) {
            buyOrderInput.errorMessage = err.message;
            this.setState({ buyOrderInput });
        }

        buyOrderInput.loading = false;
        this.setState({ buyOrderInput });
    };

    submitSellOrder = async (event) => {
        event.preventDefault();

        const { accounts, exchangeInstance } = this.props;
        const { currentToken, sellOrderInput } = this.state;

        sellOrderInput.loading = true;
        sellOrderInput.errorMessage = '';
        this.setState({ sellOrderInput });

        try {
            let txResult = await exchangeInstance.sellToken(currentToken, sellOrderInput.price, sellOrderInput.volume, { from: accounts[0] });
            console.log(txResult);
        } catch (err) {
            sellOrderInput.errorMessage = err.message;
            this.setState({ sellOrderInput });
        }

        sellOrderInput.loading = false;
        this.setState({ sellOrderInput });
    };

    renderOrderBook(orderBook) {
        return <OrderBookTable orders={orderBook}></OrderBookTable>
    }

    render() {
        const { Header, Row, HeaderCell, Body } = Table;
        const { tokens, currentToken, buyOrderBook, sellOrderBook, buyOrderInput, sellOrderInput } = this.state;

        return (
            <Layout>
                <h1>Exchange</h1>
                <Dropdown placeholder='Select Token' fluid search selection value={currentToken} options={tokens} onChange={
                    (event, data) => {
                        if (currentToken != data.value) {
                            this.setState({ currentToken: data.value });
                            console.log(data.value, "New dropdown value");
                            this.getOrderBooks();
                        }
                    }}
                />
                <Grid columns={2} divided>
                    <Grid.Row>
                        <Grid.Column>
                            <h3>Bids</h3>
                            {this.renderOrderBook(buyOrderBook)}
                        </Grid.Column>
                        <Grid.Column>
                            <h3>Asks</h3>
                            {this.renderOrderBook(sellOrderBook)}
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <Form onSubmit={this.submitBuyOrder} error={!!buyOrderInput.errorMessage}>
                                <Form.Field>
                                    <label>Add Token To Exchange</label>
                                    <Input
                                        label="price"
                                        labelPosition="right"
                                        value={buyOrderInput.price}
                                        onChange={event => {
                                            buyOrderInput.price = event.target.value;
                                            this.setState({ buyOrderInput });
                                        }}
                                    />
                                    <Input
                                        label="volume"
                                        labelPosition="right"
                                        value={buyOrderInput.volume}
                                        onChange={event => {
                                            buyOrderInput.volume = event.target.value;
                                            this.setState({ buyOrderInput })
                                        }}
                                    />
                                </Form.Field>
                                <Message error header="Error" content={buyOrderInput.errorMessage}></Message>
                                <Button primary loading={buyOrderInput.loading}>Submit Order</Button>
                            </Form>
                        </Grid.Column>
                        <Grid.Column>
                            <Form onSubmit={this.submitSellOrder} error={!!sellOrderInput.errorMessage}>
                                <Form.Field>
                                    <label>Add Token To Exchange</label>
                                    <Input
                                        label="price"
                                        labelPosition="right"
                                        value={sellOrderInput.price}
                                        onChange={event => {
                                            sellOrderInput.price = event.target.value;
                                            this.setState({ sellOrderInput })
                                        }}
                                    />
                                    <Input
                                        label="volume"
                                        labelPosition="right"
                                        value={sellOrderInput.volume}
                                        onChange={event => {
                                            sellOrderInput.volume = event.target.value;
                                            this.setState({ sellOrderInput })
                                        }}
                                    />
                                </Form.Field>
                                <Message error header="Error" content={sellOrderInput.errorMessage}></Message>
                                <Button primary loading={sellOrderInput.loading}>Submit Order</Button>
                            </Form>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Layout>
        )
    }
}

export default () => (
    <Web3Container
        renderLoading={() => <div>Loading Dapp Page...</div>}
        render={({ web3, accounts, exchangeInstance }) => (
            <Exchange accounts={accounts} exchangeInstance={exchangeInstance} web3={web3} />
        )}
    />
)
