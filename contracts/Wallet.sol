// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IWallet.sol";
import "./ERC20.sol";

contract Wallet is IWallet {
    IERC20 public token;
    OMGShop public shop;
    address payable public ownerWallet;
    mapping(string => uint) internal walletTokenBalances;
    bool isOMGTokenPresent = false;

    receive() external payable {
        walletTokenBalances["ETH"] += msg.value;
    }

    constructor () payable {
        ownerWallet = payable(msg.sender);
        token = new OMGToken(address(this));
        shop = new OMGShop();
    }

    function compareStrings(string memory a, string memory b) 
        public 
        pure 
        returns (bool) 
    {
        return (
            keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b)))
        );
    }

    modifier onlyOwner() {
        require(msg.sender == ownerWallet, "Wallet: not an owner");
        _;
    }

    modifier enoughBalance(string memory tokenSymbol, uint amount) {
        require(
            compareStrings(tokenSymbol, token.symbol()) || compareStrings(tokenSymbol, "ETH"), 
            "Wallet: no support for this token"
        );
        require(walletTokenBalances[tokenSymbol] >= amount, "Wallet: not enough tokens" );
        _;
    }

    function send(string memory tokenSymbol, address _to, uint _amount)   
        external 
        onlyOwner 
        enoughBalance(tokenSymbol, _amount) 
        override 
    {
        require(_to != address(0), "Wallet: send to the zero address");
        if (compareStrings(tokenSymbol, "OMG")) {
            token.transfer(_to, _amount);
            walletTokenBalances[tokenSymbol] -= _amount;
        }
        else if (compareStrings(tokenSymbol, "ETH")) {
            payable(_to).transfer(_amount);
            walletTokenBalances[tokenSymbol] -= _amount;
        }
        else 
            revert("does not accept this token");
    }

    function buy(address _shop, uint _amount)   
        external
        onlyOwner
        enoughBalance("ETH", _amount) 
        override 
    {
        require(_shop != address(0), "Wallet: buy from the zero address (shop)");
        //payable(_shop).transfer(_amount);
        (bool sent, ) = _shop.call{value: _amount}("");
        require(sent, "Wallet: eth transfer to shop failed");
        walletTokenBalances[token.symbol()] += _amount;
        walletTokenBalances["ETH"] -= _amount;
    }

    function sellTokens(address _shop, uint _amount) 
        external
        payable
        onlyOwner
        enoughBalance("OMG", _amount)
        override 
    {
        //OMGShop(_shop).sell(_amount);
        (bool success, ) = _shop.call(
            abi.encodeWithSignature("sell(uint256)", _amount)
        );
        require(success, "Wallet: call to shop failed");
        walletTokenBalances[token.symbol()] -= _amount;
        //walletTokenBalances["ETH"] += _amount;
    }

    function withdraw(uint _amount) external onlyOwner override {
        payable(msg.sender).transfer(_amount);
        walletTokenBalances["ETH"] -= _amount;
    }

    function getBalance(string memory tokenSymbol) external view override returns (uint) {
        require(
            compareStrings(tokenSymbol, "ETH") || (compareStrings(tokenSymbol, "OMG") && isOMGTokenPresent), 
            "Wallet: this token does not exist"
        );
        return walletTokenBalances[tokenSymbol];
    }

    function importToken(address tokenAddress) external onlyOwner override {
        require(tokenAddress != address(0), "Wallet: creation from zero address");
        walletTokenBalances[token.symbol()] = 0;
        isOMGTokenPresent = true;
    }

    function getMsgSender() external view returns(address) {
        return msg.sender;
    }

}
