const keys = require('./config/keys.js');
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(keys.mnemonic, keys.infuraNode);
      },
      network_id: 3
    }
  }
};
