import React from 'react';
import getWeb3 from './getWeb3';
import getAccounts from './getAccounts';
import getContract from './getContract';
import exchangeDefinition from './contracts/Exchange.json';
import fixedTokenDefinition from './contracts/FixedSupplyToken.json';

export default class Web3Container extends React.Component {
  state = { web3: null, accounts: null, exchangeInstance: null, tokenInstance: null }

  async componentDidMount () {
    try {
      const web3 = await getWeb3();
      const accounts = await getAccounts(web3);
      let exchangeInstance = await getContract(web3, exchangeDefinition);
      let tokenInstance = await getContract(web3, fixedTokenDefinition);
      this.setState({ web3, accounts, exchangeInstance, tokenInstance });
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console for details.`);
      console.log(error);
    }
  }

  render () {
    const { web3, accounts, exchangeInstance, tokenInstance } = this.state
    return web3 && accounts
      ? this.props.render({ web3, accounts, exchangeInstance, tokenInstance })
      : this.props.renderLoading()
  }
}
