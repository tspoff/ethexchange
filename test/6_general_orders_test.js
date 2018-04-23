var FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");
var Exchange = artifacts.require("./Exchange.sol");

contract('Exchange Order Tests', async function (accounts) {

    let tokenInstance, exchangeInstance;
    let buyerAccounts = [];
    let sellerAccounts = [];

    const ETHER_UNIT = "ether";
    const FINNEY_UNIT = "finney";

    const FIXED_TOKEN = "FIXED";

    const startingAmountEther = 1;
    const startingAmountTokens = 2000;


    before(async function () {
        exchangeInstance = await Exchange.new({ from: accounts[0] });
        tokenInstance = await FixedSupplyToken.new({ from: accounts[0] });

        for (let i = 0; i <= 4; i++) {
            buyerAccounts.push(accounts[i]);
        }

        for (let i = 5; i <= 9; i++) {
            sellerAccounts.push(accounts[i]);
        }

        for (let i in buyerAccounts) {
            await exchangeInstance.depositEther({ from: buyerAccounts[i], value: web3.toWei(startingAmountEther, ETHER_UNIT) });
        }
        await exchangeInstance.addToken(FIXED_TOKEN, tokenInstance.address);

        for (let i in sellerAccounts) {
            await tokenInstance.transfer(sellerAccounts[i], startingAmountTokens);
            await tokenInstance.approve(exchangeInstance.address, startingAmountTokens, { from: sellerAccounts[i] });
            await exchangeInstance.depositToken(FIXED_TOKEN, startingAmountTokens, { from: sellerAccounts[i] });
        }

        await tokenInstance.transfer(accounts[1], 0);
        await tokenInstance.approve(exchangeInstance.address, 0, { from: accounts[1] });
        await exchangeInstance.depositToken("FIXED", 0, { from: accounts[1] });

    });

    it("should give all accounts correct starting balances", async function () {
        let txResult;

        // for (let i in accounts) {
        //     let tokenBalance = await exchangeInstance.getBalance.call(FIXED_TOKEN, { from: accounts[i] });
        //     console.log(tokenBalance.toNumber(), "Balance " + accounts[i]);
        // }

        for (let i in buyerAccounts) {
            txResult = await exchangeInstance.getEthBalanceInWei.call({ from: buyerAccounts[i] });
            assert.equal(web3.fromWei(txResult.toNumber(), "ether"), startingAmountEther);
        }

        for (let i in sellerAccounts) {
            txResult = await exchangeInstance.getBalance.call(FIXED_TOKEN, { from: sellerAccounts[i] });
            assert.equal(txResult.toNumber(), startingAmountTokens);
        }

    });

    it("should auto-fill sell orders", async function () {
        let orderBook, txResult, orderPrice;

        /* These asserts should really be handled in buy_order_test */
        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook.length, 2, "BuyOrderBook should have 2 elements");
        assert.equal(orderBook[0].length, 0, "OrderBook should have 0 buy offers");

        for (let i in buyerAccounts) {
            let price = i + 1;
            txResult = await exchangeInstance.buyToken(FIXED_TOKEN, web3.toWei(price, FINNEY_UNIT), 10, { from: buyerAccounts[i] });
            assert.equal(txResult.logs.length, 1, "There should have been one Log Message emitted.");
            assert.equal(txResult.logs[0].event, "LimitBuyOrderCreated", "The Log-Event should be LimitBuyOrderCreated");
        }

        /* TODO: Why are the finney amounts 1-5 20-24? */

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);

        for (let i in orderBook[0]) {
            console.log(web3.fromWei(orderBook[0][i].toNumber(), FINNEY_UNIT), "Order Price [" + i + "]");
            console.log(orderBook[1][i].toNumber(), "Order Volume [" + i + "]");
        }

        assert.equal(orderBook[0].length, buyerAccounts.length, "OrderBook should have as many buy offers as buyer accounts");
        assert.equal(orderBook[1].length, buyerAccounts.length, "OrderBook should have as many buy volumes as offers");

        for (let i in buyerAccounts) {
            assert.equal(orderBook[1][i], 10, "OrderBook should have a volume of 10 coins someone wants to buy");
        }

        /* TODO: assert balances after all these tests */

        //Fill lowest-priced order
        txResult = await exchangeInstance.sellToken(FIXED_TOKEN, web3.toWei(3, FINNEY_UNIT), 10, { from: sellerAccounts[0] });

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, 4, "An order was removed");
        assert.equal(orderBook[1].length, 4, "An order was removed");

        orderPrice = web3.fromWei(orderBook[0][0].toNumber(), FINNEY_UNIT);
        assert.equal(orderPrice, 1, "Lowest price order was removed");

        //Buy highest-priced order
        txResult = await exchangeInstance.sellToken(FIXED_TOKEN, web3.toWei(7, FINNEY_UNIT), 10, { from: sellerAccounts[0] });

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, 3, "An order was removed");
        assert.equal(orderBook[1].length, 3, "An order was removed");

        orderPrice = web3.fromWei(orderBook[0][2].toNumber(), FINNEY_UNIT);
        assert.equal(orderPrice, 4, "Highest price order was removed");

        //Buy middle-priced order
        txResult = await exchangeInstance.sellToken(FIXED_TOKEN, web3.toWei(5, FINNEY_UNIT), 10, { from: sellerAccounts[0] });

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, 2, "An order was removed");
        assert.equal(orderBook[1].length, 2, "An order was removed");
        assert.equal(orderBook[0][0], 2, "Highest price order was removed");
        assert.equal(orderBook[0][1], 4, "Highest price order was removed");

        //Buy all remaining orders
        txResult = await exchangeInstance.sellToken(FIXED_TOKEN, web3.toWei(4, FINNEY_UNIT), 20, { from: sellerAccounts[0] });

        orderBook = await exchangeInstance.getBuyOrderBook.call(FIXED_TOKEN);
        assert.equal(orderBook[0].length, 0, "An order was removed");
        assert.equal(orderBook[1].length, 0, "An order was removed");

    });


});