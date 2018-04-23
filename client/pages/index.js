import React from 'react';
import Link from 'next/link';
import { Table, Grid, Form, Input, Message, Button, Dropdown } from 'semantic-ui-react';
import Web3Container from '../lib/Web3Container';
import Layout from '../components/Layout';
import TokenRow from '../components/TokenRow';
import EtherRow from '../components/EtherRow';

class Index extends React.Component {
  state = {
    ethBalance: undefined,
    tokens: [],
    numTokens: undefined,
    currentToken: undefined,

    depositInput: {
      amount: '',
      price: '',
      errorMessage: '',
      loading: false
    },

    withdrawInput: {
      amount: '',
      price: '',
      errorMessage: '',
      loading: false
    },
  }

  async componentDidMount() {
    try {
      this.getEtherBalance();
      this.getTokensList();
      let { tokens } = this.state;
      if (tokens.length >= 1) {
        let currentToken = tokens[0].name;
        this.setState({ currentToken });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getEtherBalance() {
    const { accounts, exchangeInstance } = this.props;
    let ethBalance = await exchangeInstance.getEthBalanceInWei.call({ from: accounts[0] });
    ethBalance = web3.fromWei(ethBalance.toNumber(), "ether");
    console.log(ethBalance);

    this.setState({ ethBalance });
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

  onDeposit = async () => {
    const { exchangeInstance, accounts } = this.props;
    const { depositInput, currentToken } = this.state;

    depositInput.loading = true;
    depositInput.errorMessage = '';
    this.setState({ depositInput });

    try {
      let txResult = await exchangeInstance.depositToken(name, depositInput.amount, { from: accounts[0] });
      console.log(txResult);
      depositInput.amount = 0;
      this.setState({ depositInput });
    } catch (err) {
      depositInput.errorMessage = err.message;
      this.setState({ depositInput });
    }

    depositInput.loading = false;
    this.setState({ depositInput });
  };

  onWithdraw = async () => {
    const { exchangeInstance, accounts } = this.props;
    const { withdrawInput, currentToken } = this.state;

    withdrawInput.loading = true;
    withdrawInput.errorMessage = '';
    this.setState({ withdrawInput });

    try {
      let txResult = await exchangeInstance.withdrawToken(name, withdrawInput.amount, { from: accounts[0] });
      console.log(txResult);
      withdrawInput.amount = 0;
      this.setState({ withdrawInput });
    } catch (err) {
      withdrawInput.errorMessage = err.message;
      this.setState({ withdrawInput });
    }

    withdrawInput.loading = false;
    this.setState({ withdrawInput });
  };

  renderTokenRows() {
    const { exchangeInstance, accounts } = this.props;
    const { tokens } = this.state;

    return tokens.map((token, index) => {
      return <TokenRow
        name={token.name}
        address={token.address}
        index={index}
        balance={tokens.balance}
        exchangeInstance={exchangeInstance}
        accounts={accounts}
        web3={web3}>
      </TokenRow>
    })
  }

  renderEtherRow() {
    const { exchangeInstance, accounts } = this.props;
    const { ethBalance } = this.state;

    return (
      <EtherRow
        balance={ethBalance}
        exchangeInstance={exchangeInstance}
        accounts={accounts}
        web3={web3}>
      </EtherRow>
    );
  }

  render() {
    const { Header, Row, HeaderCell, Body } = Table;
    const { depositInput, withdrawInput, currentToken, tokens } = this.state;

    return (
      <Layout>
        <h1>My Balances</h1>
        <Table>
          <Header>
            <Row>
              <HeaderCell>ID</HeaderCell>
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Balance</HeaderCell>
              {/* <HeaderCell>Deposit</HeaderCell>
              <HeaderCell>Withdraw</HeaderCell> */}
            </Row>
          </Header>
          <Body>
            {this.renderEtherRow()}
            {this.renderTokenRows()}
          </Body>
        </Table>
        <Grid>
          <Grid.Row>
            <Dropdown placeholder='Select Token' fluid search selection value={currentToken} options={tokens} onChange={
              (event, data) => {
                if (currentToken != data.value) {
                  this.setState({ currentToken: data.value });
                  console.log(data.value, "New dropdown value");
                  // this.getOrderBooks();
                }
              }}
            />
          </Grid.Row>
          <Grid.Row>
            <Form onSubmit={this.onDeposit} error={!!depositInput.errorMessage}>
              <Form.Field>
                <label>Deposit Tokens</label>
                <Input
                  label="price"
                  labelPosition="right"
                  value={depositInput.price}
                  onChange={event => {
                    depositInput.price = event.target.value;
                    this.setState({ depositInput });
                  }}
                />
                <Input
                  label="tokens"
                  labelPosition="right"
                  value={depositInput.amount}
                  onChange={event => {
                    depositInput.amount = event.target.value;
                    this.setState({ depositInput })
                  }}
                />
              </Form.Field>
              <Message error header="Error" content={depositInput.errorMessage}></Message>
              <Button primary loading={depositInput.loading}>Submit Order</Button>
            </Form>
            <Grid.Row>
            </Grid.Row>
            <Form onSubmit={this.onWithdraw} error={!!withdrawInput.errorMessage}>
              <Form.Field>
                <label>Withdraw Tokens</label>
                <Input
                  label="price"
                  labelPosition="right"
                  value={withdrawInput.price}
                  onChange={event => {
                    withdrawInput.price = event.target.value;
                    this.setState({ withdrawInput })
                  }}
                />
                <Input
                  label="tokens"
                  labelPosition="right"
                  value={withdrawInput.amount}
                  onChange={event => {
                    withdrawInput.amount = event.target.value;
                    this.setState({ withdrawInput })
                  }}
                />
              </Form.Field>
              <Message error header="Error" content={withdrawInput.errorMessage}></Message>
              <Button primary loading={withdrawInput.loading}>Submit Order</Button>
            </Form>
          </Grid.Row>
        </Grid>
      </Layout>
    );
  }
}

export default () => (
  <Web3Container
    renderLoading={() => <div>Loading Dapp Page...</div>}
    render={({ web3, accounts, exchangeInstance }) => (
      <Index accounts={accounts} exchangeInstance={exchangeInstance} web3={web3} />
    )}
  />
)