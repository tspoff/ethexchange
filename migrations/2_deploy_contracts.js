var FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol")
var CreditsTokens = artifacts.require("./CREDITS.sol")
var Exchange = artifacts.require("./Exchange.sol")

module.exports = function(deployer) {
    deployer.deploy(FixedSupplyToken);
    deployer.deploy(CreditsTokens);

    deployer.deploy(Exchange);
}