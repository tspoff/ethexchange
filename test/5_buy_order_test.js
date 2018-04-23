var FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");
var Exchange = artifacts.require("./Exchange.sol");

contract('Exchange Order Tests', async function (accounts) {

    let exchangeInstance, tokenInstance;

    before(async function() {
        exchangeInstance = await Exchange.deployed();
        tokenInstance = await FixedSupplyToken.deployed();

        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(3, "ether") });
        await exchangeInstance.addToken("FIXED", tokenInstance.address);
        await tokenInstance.transfer(accounts[1], 2000);
        await tokenInstance.approve(exchangeInstance.address, 2000, { from: accounts[1] });
        await exchangeInstance.depositToken("FIXED", 2000, { from: accounts[1] });
    });

    it("should be possible to add fully fulfill buy orders", async function () {
            let orderBook, txResult;

            orderBook = await exchangeInstance.getSellOrderBook.call("FIXED");
            assert.equal(orderBook.length, 2, "getSellOrderBook should have 2 elements");
            assert.equal(orderBook[0].length, 0, "OrderBook should have 0 buy offers");

            txResult = await exchangeInstance.sellToken("FIXED", web3.toWei(2, "finney"), 5, { from: accounts[1] });
            assert.equal(txResult.logs.length, 1, "There should have been one Log Message emitted.");
            assert.equal(txResult.logs[0].event, "LimitSellOrderCreated", "The Log-Event should be LimitSellOrderCreated");

            orderBook = await exchangeInstance.getSellOrderBook.call("FIXED");
            assert.equal(orderBook[0].length, 1, "OrderBook should have 1 sell offers");
            assert.equal(orderBook[1].length, 1, "OrderBook should have 1 sell volume has one element");
            assert.equal(orderBook[1][0], 5, "OrderBook should have a volume of 5 coins someone wants to sell");

            txResult = await exchangeInstance.buyToken("FIXED", web3.toWei(3, "finney"), 5);
            assert.equal(txResult.logs.length, 1, "There should have been one Log Message emitted.");
            assert.equal(txResult.logs[0].event, "SellOrderFulfilled", "The Log-Event should be SellOrderFulfilled");

            orderBook = await exchangeInstance.getSellOrderBook.call("FIXED");
            assert.equal(orderBook[0].length, 0, "OrderBook should have 0 buy offers");
            assert.equal(orderBook[1].length, 0, "OrderBook should have 0 buy volume has one element");

            orderBook = await exchangeInstance.getBuyOrderBook.call("FIXED");
            assert.equal(orderBook[0].length, 0, "OrderBook should have 0 sell offers");
            assert.equal(orderBook[1].length, 0, "OrderBook should have 0 sell volume elements");
    });
});