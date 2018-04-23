pragma solidity ^0.4.21;

import "./Owned.sol";
import "./ERC20Interface.sol";
import "./FixedSupplyToken.sol";

contract OrderBookManager {
    
    using SafeMath for uint;

    ///////////////////////
    // GENERAL STRUCTURE //
    ///////////////////////
    struct Offer {
        
        uint amount;
        address who;
    }

    struct PriceBook {
        
        uint lowerPrice;
        uint higherPrice;
        
        mapping (uint => Offer) offers;
        uint offers_key;
        uint offers_length;
    }
    
    struct OrderBook {
        mapping (uint => PriceBook) prices;
        
        uint lowestPrice;
        uint highestPrice;
        uint size;
    }

    ////////////////////////////////
    // STRING COMPARISON FUNCTION //
    ////////////////////////////////
    function stringsEqual(string storage _a, string memory _b) internal view returns (bool) {
        bytes storage a = bytes(_a);
        bytes memory b = bytes(_b);
        if (a.length != b.length)
            return false;
        // @todo unroll this loop
        for (uint i = 0; i < a.length; i ++)
            if (a[i] != b[i]) {
                return false;
            }
        return true;
    }

    /////////////////////////////
    // ORDER BOOK              //
    /////////////////////////////
    function getOrderBook(OrderBook storage orderBook) internal view returns (uint[], uint[]) {
        uint[] memory prices = new uint[](orderBook.size);
        uint[] memory volumes = new uint[](orderBook.size);
        
        uint currentPrice = orderBook.lowestPrice;
        
        for (uint i = 0; i < orderBook.size; i++) {
            prices[i] = currentPrice;
            
            uint currentVolume = 0;
            
            uint offersKey = orderBook.prices[currentPrice].offers_key;
            uint offersLength = orderBook.prices[currentPrice].offers_length;
            
            for (uint j = offersKey; j <= offersLength; j++) {
                currentVolume = currentVolume.add(orderBook.prices[currentPrice].offers[j].amount);
            }
            
            volumes[i] = currentVolume;
            
            currentPrice = orderBook.prices[currentPrice].higherPrice; 
        }
        
        return (prices, volumes);
    }
    
    /*  Add the new order book to the list in the correct spot, sorted by price.
        This is effectively a linked-list insertion algorithm */
    function createPriceBook(OrderBook storage ob, uint _priceInWei) internal {
        uint highestPrice = ob.highestPrice;
        uint lowestPrice = ob.lowestPrice;
        
        //New order book is the only order book 
        if (lowestPrice == 0) {
            ob.prices[_priceInWei].lowerPrice = 0;
            ob.prices[_priceInWei].higherPrice = _priceInWei;
            
            ob.lowestPrice = _priceInWei;
            ob.highestPrice = _priceInWei;
        }
        
        //New order book is the lowest priced
        else if (_priceInWei < lowestPrice) {
            ob.prices[lowestPrice].lowerPrice = _priceInWei;
            ob.prices[_priceInWei].higherPrice = lowestPrice;
            
            ob.lowestPrice = _priceInWei;
        }
        
        //New order book is the highest priced
        else if (_priceInWei > highestPrice) {
            ob.prices[highestPrice].higherPrice = _priceInWei;
            ob.prices[_priceInWei].higherPrice = _priceInWei;
            ob.prices[_priceInWei].lowerPrice = highestPrice;
            
            ob.highestPrice = _priceInWei;
        }
        
        //New order book is between highest and lowest priced
        else {
            uint currentPrice = ob.highestPrice;
            bool found = false;
            
            while (currentPrice > 0 && found == false) {
                
                if (_priceInWei > currentPrice && _priceInWei < ob.prices[currentPrice].higherPrice ) {
                    ob.prices[_priceInWei].higherPrice = ob.prices[currentPrice].higherPrice;
                    ob.prices[_priceInWei].lowerPrice = currentPrice;
                    
                    ob.prices[ob.prices[currentPrice].higherPrice].lowerPrice = _priceInWei;
                    ob.prices[currentPrice].higherPrice = _priceInWei;
                    
                    found = true;
                }
                
                currentPrice = ob.prices[currentPrice].lowerPrice;
            }
        }
    }
    
    function addOffer(OrderBook storage ob, uint _priceInWei, uint _amount, address _who) internal {
        ob.prices[_priceInWei].offers_length = ob.prices[_priceInWei].offers_length.add(1);
        ob.prices[_priceInWei].offers[ob.prices[_priceInWei].offers_length] = Offer(_amount, _who);
        
        uint offersLength = ob.prices[_priceInWei].offers_length;
        
        //If no order book exists for the price of this offer, create one
        if (offersLength == 1) {
            ob.prices[_priceInWei].offers_key = 1;
            ob.size = ob.size.add(1);
            
            createPriceBook(ob, _priceInWei);
        }
    }
    
    function getOffer(OrderBook storage ob, uint _priceInWei, uint _offerKey) internal view returns(Offer){
        return ob.prices[_priceInWei].offers[_offerKey];    
    }
    
    /*  TODO: A better clearing logic 
        Each removal of an offer reduces offers_length and offers_key by 1
    */
    function clearOffer(OrderBook storage ob, uint _priceInWei, uint _offerKey) internal {
        ob.prices[_priceInWei].offers[_offerKey].amount = 0;
        
        /*If we've zeroed out a PriceBook, update the list */
        if (_offerKey == ob.prices[_priceInWei].offers_length) {
            removePriceBook(ob, _priceInWei);
        }
    }
    
    function removePriceBook(OrderBook storage ob, uint _priceInWei) internal {
        uint lowerPrice = ob.prices[_priceInWei].lowerPrice;
        uint higherPrice = ob.prices[_priceInWei].higherPrice;
        
        if (ob.size == 1) {
            ob.lowestPrice = 0;
            ob.highestPrice = 0;
        }
        
        else if (_priceInWei == ob.highestPrice) {
            ob.prices[lowerPrice].higherPrice = lowerPrice;
            
            ob.highestPrice = lowerPrice;
        }
        
        else if (_priceInWei == ob.lowestPrice) {
            ob.prices[higherPrice].lowerPrice = 0;
            
            ob.lowestPrice = ob.prices[_priceInWei].higherPrice;
        }
        
        else {
            ob.prices[lowerPrice].higherPrice = ob.prices[_priceInWei].higherPrice;
            ob.prices[higherPrice].lowerPrice = ob.prices[_priceInWei].lowerPrice;
        }
        
        ob.size = ob.size.sub(1);
        
    }

}