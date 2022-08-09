// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IWallet {
    function send(string memory tokenSymbol, address _to, uint _amount) external;

    function buy(address _shop, uint _amount) external;

    // sell OMG tokens to shop 
    function sellTokens(address _shop, uint _amount) external payable;

    // withdrawal of ETH
    function withdraw(uint amount) external;

    function getBalance(string memory tokenSymbol) external view returns (uint);

    function importToken(address tokenAddress) external;
    
}
