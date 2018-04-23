const FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");
const Exchange = artifacts.require("./Exchange.sol");

contract('Exchange - ether deposit / withdrawal', async function (accounts) {
    let exchangeInstance;

    const DepositForEthReceivedEvent = "DepositForEthReceived";
    const WithdrawalEthEvent = "WithdrawalEth";

    beforeEach(async function () {
        exchangeInstance = await Exchange.new({ from: accounts[0] });
    });

    it('deposits ether from user', async function () {
        let preDepositBalance = await web3.eth.getBalance(accounts[0]);
        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });

        let postDepositBalance = await web3.eth.getBalance(accounts[0]);

        assert.isAtLeast(preDepositBalance.toNumber() - postDepositBalance.toNumber(), Number(web3.toWei(1, "ether")), "account has lost at least the amount deposited");
    });

    it('records ether deposit in exchange', async function () {
        let preDepositBalance = await exchangeInstance.getEthBalanceInWei.call({ from: accounts[0] });
        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });

        let postDepositBalance = await exchangeInstance.getEthBalanceInWei.call({ from: accounts[0] });

        assert.equal(preDepositBalance.toNumber() + Number(web3.toWei(1, "ether")), postDepositBalance.toNumber(), "records correct ether deposit amount");
    });

    it('withdraws ether to user account', async function () {
        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });

        let preDepositBalance = await web3.eth.getBalance(accounts[0]);
        await exchangeInstance.withdrawEther(web3.toWei(1, "ether"), { from: accounts[0] });
        let postDepositBalance = await web3.eth.getBalance(accounts[0]);

        assert.isAtMost(postDepositBalance.toNumber(), preDepositBalance.toNumber() + Number(web3.toWei(1, "ether")), "account has gained at most the withdrawn amount");
    });

    it('records ether withdrawal in exchange', async function () {
        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });

        let preDepositBalance = await exchangeInstance.getEthBalanceInWei.call({ from: accounts[0] });
        await exchangeInstance.withdrawEther(web3.toWei(1, "ether"), { from: accounts[0] });
        let postDepositBalance = await exchangeInstance.getEthBalanceInWei.call({ from: accounts[0] });

        assert.equal(preDepositBalance.toNumber() - Number(web3.toWei(1, "ether")), postDepositBalance.toNumber(), "records correct ether withdrawal amount");
    });

    it('emits event on ether deposit', async function () {
        let txResult = await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });

        assert.equal(txResult.logs[0].event, DepositForEthReceivedEvent, "emitted correct event type");
    });

    it('emits event on ether withdrawal', async function () {
        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });

        let txResult = await exchangeInstance.withdrawEther(web3.toWei(1, "ether"), { from: accounts[0] });

        assert.equal(txResult.logs[0].event, WithdrawalEthEvent, "emitted correct event type");
    });


});

contract('Exchange - token deposit / withdrawal', async function (accounts) {

    let fixedSupplyTokenInstance, exchangeInstance;

    const amountTokens = 1000;
    const FIXED_TOKEN = "FIXED";

    const TokenAddedToSystemEvent = "TokenAddedToSystem";
    const DepositForTokenReceivedEvent = "DepositForTokenReceived";
    const WithdrawalTokenEvent = "WithdrawalToken";

    /*  Prepare instances and approve tokens from ERC20 to be used by exchange address
       (Truffle handles reseting contract state between each test)
   */
    beforeEach(async function () {
        fixedSupplyTokenInstance = await FixedSupplyToken.new({ from: accounts[0] });
        exchangeInstance = await Exchange.new({ from: accounts[0] });

        await fixedSupplyTokenInstance.approve(exchangeInstance.address, amountTokens, { from: accounts[0] });

    });

    it('adds a new token', async function () {
        await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });
        let hasToken = await exchangeInstance.hasToken.call(FIXED_TOKEN, { from: accounts[0] });

        assert.equal(hasToken, true, "token was added");
    });

    it('deposits tokens from external contract', async function () {
        await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });
        await exchangeInstance.depositToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });
        let getBalance = await exchangeInstance.getBalance.call(FIXED_TOKEN, { from: accounts[0] });
        assert.equal(getBalance.toNumber(), amountTokens, "tokens were deposited correctly")
    });

    it('sends withdrawn tokens to user', async function () {
        await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });
        await exchangeInstance.depositToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });

        let preWithdrawExternalBalance = await fixedSupplyTokenInstance.balanceOf.call(accounts[0], { from: accounts[0] });
        await exchangeInstance.withdrawToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });
        let postWithdrawExternalBalance = await fixedSupplyTokenInstance.balanceOf.call(accounts[0], { from: accounts[0] });

        assert.equal(preWithdrawExternalBalance.toNumber() + amountTokens, postWithdrawExternalBalance.toNumber(), "external balance changed as expected");
    });

    it('records withdrawn tokens internally', async function () {
        await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });
        await exchangeInstance.depositToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });

        let preWithdrawInternalBalance = await exchangeInstance.getBalance.call(FIXED_TOKEN, { from: accounts[0] });
        await exchangeInstance.withdrawToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });
        let postWithdrawInternalBalance = await exchangeInstance.getBalance.call(FIXED_TOKEN, { from: accounts[0] });

        assert.equal(preWithdrawInternalBalance.toNumber(), postWithdrawInternalBalance.toNumber() + amountTokens, "internal balance changed as expected");
    });

    it('emits event on token deposit', async function () {
        await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });
        let txResult = await exchangeInstance.depositToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });

        assert.equal(txResult.logs[0].event, DepositForTokenReceivedEvent, "emitted correct event type");
    });

    it('emits event on token withdrawal', async function () {
        await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });
        await exchangeInstance.depositToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });
        let txResult = await exchangeInstance.withdrawToken(FIXED_TOKEN, amountTokens, { from: accounts[0] });

        assert.equal(txResult.logs[0].event, WithdrawalTokenEvent, "emitted correct event type");
    });

    it('emits event on token add', async function () {
        let txResult = await exchangeInstance.addToken(FIXED_TOKEN, fixedSupplyTokenInstance.address, { from: accounts[0] });

        assert.equal(txResult.logs[0].event, TokenAddedToSystemEvent, "emitted correct event type");
    });
});