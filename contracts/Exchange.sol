pragma solidity ^0.4.21;

import "./Owned.sol";
import "./ERC20Interface.sol";
import "./FixedSupplyToken.sol";
import "./OrderBookManager.sol";

contract Exchange is Owned, OrderBookManager {
    
    using SafeMath for uint;

    struct Token {
        
        address tokenContract;

        string symbolName;
        
        OrderBook buyBook;
        OrderBook sellBook;

    }
    
    //we support a max of 255 tokens...
    mapping (uint8 => Token) tokens;
    uint8 tokensSize;


    //////////////
    // BALANCES //
    //////////////
    mapping (address => mapping (uint8 => uint)) tokenBalanceForAddress;

    mapping (address => uint) balanceEthForAddress;




    ////////////
    // EVENTS //
    ////////////

    //Deposit/withdrawal
    event DepositForTokenReceived(address indexed _from, uint indexed _symbolIndex, uint _amount, uint _timestamp);
    event WithdrawalToken(address indexed _to, uint indexed _symbolIndex, uint _amount, uint _timestamp);
    event DepositForEthReceived(address indexed _from, uint _amount, uint _timestamp);
    event WithdrawalEth(address indexed _to, uint _amount, uint _timestamp);
    
    //Exchange Orders
    event LimitSellOrderCreated(uint indexed _symbolIndex, address indexed _who, uint _amountTokens, uint _priceInWei, uint _orderKey);
    event SellOrderFulfilled(uint indexed _symbolIndex, uint _amount, uint _priceInWei, uint _orderKey);
    event SellOrderCanceled(uint indexed _symbolIndex, uint _priceInWei, uint _orderKey);
    event LimitBuyOrderCreated(uint indexed _symbolIndex, address indexed _who, uint _amountTokens, uint _priceInWei, uint _orderKey);
    event BuyOrderFulfilled(uint indexed _symbolIndex, uint _amount, uint _priceInWei, uint _orderKey);
    event BuyOrderCanceled(uint indexed _symbolIndex, uint _priceInWei, uint _orderKey);

    //Management
    event TokenAddedToSystem(uint _symbolIndex, string _token, uint _timestamp);


    //////////////////////////////////
    // DEPOSIT AND WITHDRAWAL ETHER //
    //////////////////////////////////
    
    //Underflow and Overflow checks are handled by SafeMath
    function depositEther() payable public{
        balanceEthForAddress[msg.sender] = balanceEthForAddress[msg.sender].add(msg.value);

        emit DepositForEthReceived(msg.sender, msg.value, now);
    }

    function withdrawEther(uint _amountInWei) public {
        require(balanceEthForAddress[msg.sender] - _amountInWei >= 0);

        balanceEthForAddress[msg.sender] = balanceEthForAddress[msg.sender].sub(_amountInWei);
        msg.sender.transfer(_amountInWei);

        emit WithdrawalEth(msg.sender, _amountInWei, now);
    }

    function getEthBalanceInWei() constant public returns (uint){
        return balanceEthForAddress[msg.sender];
    }


    //////////////////////
    // TOKEN MANAGEMENT //
    //////////////////////

    function addToken(string _symbolName, address _erc20TokenAddress) public onlyOwner {
        require(!hasToken(_symbolName));
        
        uint8 preIncrement = tokensSize;
        tokensSize++;
        
        assert(tokensSize > preIncrement);
        
        tokens[tokensSize].symbolName = _symbolName;
        tokens[tokensSize].tokenContract = _erc20TokenAddress;
        
        emit TokenAddedToSystem(tokensSize, _symbolName, now);
    }

    function hasToken(string _symbolName) constant public returns (bool) {
        uint8 index = _getSymbolIndex(_symbolName);
        if (index == 0) {
            return false;
        }
        return true;
    }

    function _getSymbolIndex(string _symbolName) internal returns (uint8) {
        for (uint8 i = 1; i <= tokensSize; i++) {
            if (stringsEqual(tokens[i].symbolName, _symbolName)) {
                return i;
            }
        }
        return 0;
    }
    
    function _getSymbolIndexOrThrow(string _symbolName) internal returns (uint8) {
        uint8 index = _getSymbolIndex(_symbolName);
        
        require(index != 0);
        return index;
    }
    
    function getNumTokens() public view returns (uint8) {
        return tokensSize;
    } 

    function getTokenInfoByIndex(uint8 _symbolIndex) public view returns (string, address) {
        require(_symbolIndex <= tokensSize);
        return (
            tokens[_symbolIndex].symbolName,
            tokens[_symbolIndex].tokenContract
            );
    }

    //////////////////////////////////
    // DEPOSIT AND WITHDRAWAL TOKEN //
    //////////////////////////////////
    function depositToken(string _symbolName, uint _amount) public {
        
        uint8 symbolIndex = _getSymbolIndex(_symbolName);
        require(symbolIndex != 0);
        
        address tokenAddress = tokens[symbolIndex].tokenContract;
        //Input validation: null check on token address        
        require(tokenAddress != address(0));
        
        ERC20Interface token = ERC20Interface(tokenAddress);

        //Ensure that the user has approved us to transfer tokens
        require(token.allowance(msg.sender, address(this)) >= _amount);
        
        //How to we determine success?
        token.transferFrom(msg.sender, address(this), _amount);
        
        tokenBalanceForAddress[msg.sender][symbolIndex] = tokenBalanceForAddress[msg.sender][symbolIndex].add(_amount);
        
        emit DepositForTokenReceived(msg.sender, symbolIndex, _amount, now);
    }

    function withdrawToken(string _symbolName, uint _amount) public {
        uint8 symbolIndex = _getSymbolIndex(_symbolName);
        require(symbolIndex != 0);
        
        address tokenAddress = tokens[symbolIndex].tokenContract;
        require(tokenAddress != address(0));
        
        ERC20Interface token = ERC20Interface(tokenAddress);
    
        tokenBalanceForAddress[msg.sender][symbolIndex] = tokenBalanceForAddress[msg.sender][symbolIndex].sub(_amount);
        require(token.transfer(msg.sender, _amount) == true);
        
        emit WithdrawalToken(msg.sender, symbolIndex, _amount, now);
    }

    function getBalance(string _symbolName) constant public returns (uint) {
        uint8 symbolIndex = _getSymbolIndex(_symbolName);
        require(symbolIndex != 0);
        
        return tokenBalanceForAddress[msg.sender][symbolIndex];
        
    }

    /////////////////////////////
    // ORDER BOOK              //
    /////////////////////////////
    function getBuyOrderBook(string _symbolName) constant public returns (uint[], uint[]) {
        uint8 symbolIndex = _getSymbolIndexOrThrow(_symbolName);
        return getOrderBook(tokens[symbolIndex].buyBook);
    }

    function getSellOrderBook(string _symbolName) constant public returns (uint[], uint[]) {
        uint8 symbolIndex = _getSymbolIndexOrThrow(_symbolName);
        return getOrderBook(tokens[symbolIndex].sellBook);
    }

    ////////////////////////////
    // NEW ORDER - BID ORDER //
    ///////////////////////////
    function buyToken(string _symbolName, uint _priceInWei, uint _amount) public {
        uint8 symbolIndex = _getSymbolIndexOrThrow(_symbolName);
        uint userEtherRequired = _priceInWei.mul(_amount);
        
        require(balanceEthForAddress[msg.sender] >= userEtherRequired);
        
        balanceEthForAddress[msg.sender] = balanceEthForAddress[msg.sender].sub(userEtherRequired);
        
        //If there are no sell offers at or below the bid price, create an offer
        if (tokens[symbolIndex].sellBook.size == 0 || _priceInWei < tokens[symbolIndex].sellBook.lowestPrice) {
            addOffer(tokens[symbolIndex].buyBook, _priceInWei, _amount, msg.sender);
            
            uint offersLength = tokens[symbolIndex].buyBook.prices[_priceInWei].offers_length;
            emit LimitBuyOrderCreated(symbolIndex, msg.sender, _amount, _priceInWei, offersLength);
        }
        
        //TODO
        else {
            uint volumeRequired = _fillSellOrders(symbolIndex, _priceInWei, _amount, msg.sender);
            
            //Remaining volume required becomes a limit order
            if (volumeRequired > 0) {
                buyToken(_symbolName, _priceInWei, volumeRequired);
            }
        }
    }

    ////////////////////////////
    // NEW ORDER - ASK ORDER //
    ///////////////////////////
    function sellToken(string _symbolName, uint _priceInWei, uint _amount) public {
        uint8 symbolIndex = _getSymbolIndexOrThrow(_symbolName);
        
        require(tokenBalanceForAddress[msg.sender][symbolIndex] >= _amount);
        
        tokenBalanceForAddress[msg.sender][symbolIndex] = tokenBalanceForAddress[msg.sender][symbolIndex].sub(_amount);
        
        uint offersLength;
        
        //Order can't be immediately filled
        if (tokens[symbolIndex].buyBook.size == 0 || _priceInWei > tokens[symbolIndex].buyBook.highestPrice) {
            
            addOffer(tokens[symbolIndex].sellBook, _priceInWei, _amount, msg.sender);
            
            offersLength = tokens[symbolIndex].sellBook.prices[_priceInWei].offers_length;
            emit LimitSellOrderCreated(symbolIndex, msg.sender, _amount, _priceInWei, offersLength);
        }
        
        //Order can be immediately filled
        else {
            
            uint volumeRequired = _fillBuyOrders(symbolIndex, _priceInWei, _amount, msg.sender);
            
            //Remaining volume required becomes a limit order
            if (volumeRequired > 0) {
                sellToken(_symbolName, _priceInWei, volumeRequired);
            }
        }
    }

    function _fillBuyOrders(uint8 tokenIndex, uint _priceInWei, uint _amount, address _who) internal returns (uint) {
        
            uint volumeRequired = _amount;
            OrderBook storage buyBook = tokens[tokenIndex].buyBook;
            uint currentPrice = buyBook.highestPrice;
            
            //For each OrderBook in BuyBook
            for (uint i = 0; i < buyBook.size; i++) {

                //For each Offer in OrderBook
                for (uint j = buyBook.prices[currentPrice].offers_key; j <= buyBook.prices[currentPrice].offers_length; j++){
                    
                    uint offerVolume = buyBook.prices[currentPrice].offers[j].amount;
                    address offerAddress = buyBook.prices[currentPrice].offers[j].who;
                    
                    if (volumeRequired >= 0) {
                        
                        if (offerVolume <= volumeRequired) {
                                                    
                            /* Clear out the offer amount, give eth to seller, give tokens to buyer */
                            buyBook.prices[currentPrice].offers[j].amount = 0;
                            balanceEthForAddress[msg.sender] = balanceEthForAddress[msg.sender].add(offerVolume.mul(currentPrice));
                            tokenBalanceForAddress[offerAddress][tokenIndex] = tokenBalanceForAddress[offerAddress][tokenIndex].add(offerVolume);
                            
                            volumeRequired = volumeRequired.sub(offerVolume);
                
                            /*If we've zeroed out an OrderBook, update the list */
                            if (j == buyBook.prices[currentPrice].offers_length) {
                                removePriceBook(buyBook, currentPrice);
                            }
                
                            emit SellOrderFulfilled(tokenIndex, offerVolume, currentPrice, j);
                            
                        }
                        
                        else {
                            require(offerVolume > volumeRequired);                    
                            buyBook.prices[currentPrice].offers[j].amount = buyBook.prices[currentPrice].offers[j].amount.sub(volumeRequired);
                            balanceEthForAddress[msg.sender] = balanceEthForAddress[msg.sender].add(offerVolume.mul(currentPrice));
                            tokenBalanceForAddress[offerAddress][tokenIndex] = tokenBalanceForAddress[offerAddress][tokenIndex].add(volumeRequired);
                            
                            volumeRequired = 0;
                            emit SellOrderFulfilled(tokenIndex, volumeRequired, currentPrice, j);
                            return volumeRequired;
                        }
                        
                    }
                    
                }
                
                currentPrice = buyBook.prices[currentPrice].lowerPrice;
            }
            return volumeRequired;
    }
    
    function _fillSellOrders(uint8 tokenIndex, uint _priceInWei, uint _amount, address _who) internal returns (uint) {
        
        uint volumeRequired = _amount;
            OrderBook storage sellBook = tokens[tokenIndex].sellBook;
            uint currentPrice = sellBook.lowestPrice;
            
            //For each OrderBook in BuyBook
            for (uint i = 0; i < sellBook.size; i++) {

                //For each Offer in OrderBook
                for (uint j = sellBook.prices[currentPrice].offers_key; j <= sellBook.prices[currentPrice].offers_length; j++){
                    
                    uint offerVolume = sellBook.prices[currentPrice].offers[j].amount;
                    address offerAddress = sellBook.prices[currentPrice].offers[j].who;
                    
                    if (volumeRequired >= 0) {
                        
                        if (offerVolume <= volumeRequired) {
                                                    
                            /* Clear out the offer amount, give eth to seller, give tokens to buyer */
                            sellBook.prices[currentPrice].offers[j].amount = 0;
                            
                            balanceEthForAddress[offerAddress] = balanceEthForAddress[offerAddress].add(offerVolume.mul(currentPrice));
                            tokenBalanceForAddress[msg.sender][tokenIndex] = tokenBalanceForAddress[msg.sender][tokenIndex].add(offerVolume);
                            
                            volumeRequired = volumeRequired.sub(offerVolume);
                
                            /*If we've zeroed out an OrderBook, update the list */
                            if (j == sellBook.prices[currentPrice].offers_length) {
                                removePriceBook(sellBook, currentPrice);
                            }
                
                            emit SellOrderFulfilled(tokenIndex, offerVolume, currentPrice, j);
                            
                        }
                        
                        else {
                            require(offerVolume > volumeRequired);                    
                            sellBook.prices[currentPrice].offers[j].amount = sellBook.prices[currentPrice].offers[j].amount.sub(volumeRequired);
                            balanceEthForAddress[msg.sender] = balanceEthForAddress[msg.sender].add(offerVolume.mul(currentPrice));
                            tokenBalanceForAddress[offerAddress][tokenIndex] = tokenBalanceForAddress[offerAddress][tokenIndex].add(volumeRequired);
                            
                            volumeRequired = 0;
                            
                            emit SellOrderFulfilled(tokenIndex, volumeRequired, currentPrice, j);
                            
                            return volumeRequired;
                        }
                        
                    }
                    
                }
                
                currentPrice = sellBook.prices[currentPrice].higherPrice;
            }
            return volumeRequired;
    }
    
    //////////////////////////////
    // CANCEL LIMIT ORDER LOGIC //
    //////////////////////////////
    function cancelOrder(string _symbolName, bool _isSellOrder, uint _priceInWei, uint _offerKey) public {
        uint8 tokenIndex = _getSymbolIndexOrThrow(_symbolName);
        
        if(_isSellOrder) {
            require(tokens[tokenIndex].sellBook.prices[_priceInWei].offers[_offerKey].who == msg.sender);
            
            uint tokensAmount = tokens[tokenIndex].sellBook.prices[_priceInWei].offers[_offerKey].amount;
            
            tokenBalanceForAddress[msg.sender][tokenIndex] = tokenBalanceForAddress[msg.sender][tokenIndex].add(tokensAmount);
            tokens[tokenIndex].sellBook.prices[_priceInWei].offers[_offerKey].amount = 0;
            
            emit SellOrderCanceled(tokenIndex, _priceInWei, _offerKey);
        }
        
        else {
            require(tokens[tokenIndex].buyBook.prices[_priceInWei].offers[_offerKey].who == msg.sender); 
            
            uint etherToReturn = tokens[tokenIndex].buyBook.prices[_priceInWei].offers[_offerKey].amount.mul(_priceInWei);
            
            tokens[tokenIndex].buyBook.prices[_priceInWei].offers[_offerKey].amount = 0;
            balanceEthForAddress[msg.sender].add(etherToReturn);
            
            emit BuyOrderCanceled(tokenIndex, _priceInWei, _offerKey);
        }
        
    }



}