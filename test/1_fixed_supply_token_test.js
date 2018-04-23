var FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");

contract('FixedSupplyToken', async function (accounts) {

    let fixedSupplyTokenInstance;
    const amountTokens = 100;

    beforeEach(async function () {
        fixedSupplyTokenInstance = await FixedSupplyToken.deployed();
    });

    it("first account should own all tokens", async function () {
        let totalSupply = await fixedSupplyTokenInstance.totalSupply.call({ from: accounts[0] });
        let ownerBalance = await fixedSupplyTokenInstance.balanceOf(accounts[0], { from: accounts[0] });

        assert.equal(ownerBalance.toNumber(), totalSupply.toNumber(), "all tokens are owned by first account");
    });

    it("second account should own no tokens", async function () {
        let secondAccountBalance = await fixedSupplyTokenInstance.balanceOf(accounts[1], { from: accounts[0] });

        assert.equal(secondAccountBalance.toNumber(), 0, "no tokens are owned by second account");
    });

    it("should send tokens correctly", async function () {
        let firstStartingBalance = await fixedSupplyTokenInstance.balanceOf.call(accounts[0], { from: accounts[0] });
        let secondStartingBalance = await fixedSupplyTokenInstance.balanceOf.call(accounts[1], { from: accounts[0] });

        await fixedSupplyTokenInstance.transfer(accounts[1], amountTokens, { from: accounts[0] });

        let firstEndingBalance = await fixedSupplyTokenInstance.balanceOf.call(accounts[0], { from: accounts[0] });
        let secondEndingBalance = await fixedSupplyTokenInstance.balanceOf.call(accounts[1], { from: accounts[0] });

        assert.equal(firstEndingBalance.toNumber(), firstStartingBalance.toNumber() - amountTokens, "balance correctly taken from the sender");
        assert.equal(secondEndingBalance.toNumber(), secondStartingBalance.toNumber() + amountTokens, "balance correctly given to reciever");
    });

    it("should allow approval", async function() {
        await fixedSupplyTokenInstance.approve(accounts[1], amountTokens, { from: accounts[0] });

        let allowance = await fixedSupplyTokenInstance.allowance.call(accounts[0], accounts[1], { from: accounts[0] });
        assert.equal(allowance.toNumber(), amountTokens, "allowance updated correctly");
    });
});