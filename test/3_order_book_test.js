let FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");
let Exchange = artifacts.require("./Exchange.sol");

const amountTokens = 2000;
const FIXED_TOKEN = "FIXED";

const TokenAddedToSystemEvent = "TokenAddedToSystem";
const DepositForTokenReceivedEvent = "DepositForTokenReceived";
const WithdrawalTokenEvent = "WithdrawalToken";

contract('Simple Order Tests', async function (accounts) {

    let exchangeInstance, tokenInstance;

    beforeEach(async function () {
        exchangeInstance = await Exchange.new({ from: accounts[0] });
        tokenInstance = await FixedSupplyToken.new({ from: accounts[0] });

        await exchangeInstance.depositEther({ from: accounts[0], value: web3.toWei(1, "ether") });
        await exchangeInstance.addToken(FIXED_TOKEN, tokenInstance.address);

        await tokenInstance.approve(exchangeInstance.address, amountTokens);
        await exchangeInstance.depositToken(FIXED_TOKEN, amountTokens);
    });


    it("should be possible to add a limit buy order", async function () {
        let orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook.length, 2, "BuyOrderBook should have 2 elements");
        assert.equal(orderBook[0].length, 0, "OrderBook should have 0 buy offers");

        let txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(1, "finney"), 5);
        assert.equal(txResult.logs.length, 1, "There should have been one Log Message emitted.");
        assert.equal(txResult.logs[0].event, "LimitBuyOrderCreated", "The Log-Event should be LimitBuyOrderCreated");

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, 1, "OrderBook should have 0 buy offers");
        assert.equal(orderBook[1].length, 1, "OrderBook should have 0 buy volume has one element");
    });

    it("should be possible to add three limit buy orders", async function () {
        let orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        let orderBookLengthBeforeBuy = orderBook[0].length;
        assert(orderBookLengthBeforeBuy == 0, "There should be no orders before adding them");

        let txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(1, "finney"), 5);
        assert.equal(txResult.logs[0].event, "LimitBuyOrderCreated", "The Log-Event should be LimitBuyOrderCreated");

        txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(2, "finney"), 5); //we add one offer on top of another one, doesn't increase the orderBook
        assert.equal(txResult.logs[0].event, "LimitBuyOrderCreated", "The Log-Event should be LimitBuyOrderCreated");

        txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(1.4, "finney"), 5); //we add a new offer in the middle
        assert.equal(txResult.logs[0].event, "LimitBuyOrderCreated", "The Log-Event should be LimitBuyOrderCreated");

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, orderBookLengthBeforeBuy + 3, "OrderBook should have one more buy offers");
        assert.equal(orderBook[1].length, orderBookLengthBeforeBuy + 3, "OrderBook should have 2 buy volume elements");
    });

    it("should be possible to add two limit sell orders", async function () {
        await exchangeInstance.getSellOrderBook.call(FIXED_TOKEN);        
        let txResult = await exchangeInstance.sellToken(FIXED_TOKEN, web3.toWei(3, "finney"), 5);
        assert.equal(txResult.logs.length, 1, "There should have been one Log Message emitted.");
        assert.equal(txResult.logs[0].event, "LimitSellOrderCreated", "The Log-Event should be LimitSellOrderCreated");

        await exchangeInstance.sellToken(FIXED_TOKEN, web3.toWei(6, "finney"), 5);
        let orderBook = await exchangeInstance.getSellOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, 2, "OrderBook should have 2 sell offers");
        assert.equal(orderBook[1].length, 2, "OrderBook should have 2 sell volume elements");
    });

    it("should be possible to create and cancel a buy order", async function () {

        await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(1, "finney"), 5);
        await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(1.4, "finney"), 5);

        let txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(2, "finney"), 5);
        let offerIndex = txResult.logs[0].args._orderKey;

        let orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        let orderBookLengthBeforeBuy = orderBook[0].length;
        //console.log(orderBookLengthBeforeBuy, "orderBookLengthBeforeBuy");

        txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(2.2, "finney"), 5);
        assert.equal(txResult.logs.length, 1, "There should have been one Log Message emitted.");
        assert.equal(txResult.logs[0].event, "LimitBuyOrderCreated", "The Log-Event should be LimitBuyOrderCreated");
        
        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        let orderBookLengthAfterBuy = orderBook[0].length;
        assert.equal(orderBookLengthAfterBuy, orderBookLengthBeforeBuy + 1, "OrderBook should have 1 buy offers more than before");

        txResult = await exchangeInstance.cancelOrder(FIXED_TOKEN, false, web3.toWei(2, "finney"), offerIndex);
        assert.equal(txResult.logs[0].event, "BuyOrderCanceled", "The Log-Event should be BuyOrderCanceled");

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        let orderBookLengthAfterCancel = orderBook[0].length;

        // console.log(orderBook[0], "orderBook prices");
        // console.log(orderBook[1], "orderBook volumes");
        // console.log(orderBookLengthAfterCancel, "orderBookLengthAfterCancel");

        assert.equal(orderBookLengthAfterCancel, orderBookLengthAfterBuy, "OrderBook should have 1 buy offers, its not cancelling it out completely, but setting the volume to zero");
        // console.log(orderBook[1][2]);

        //TODO: add general way to get the appropriate array index
        assert.equal(orderBook[1][2].toNumber(), 0, "The available Volume should be zero");
    });

});