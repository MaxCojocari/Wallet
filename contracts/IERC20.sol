//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC20 {
    function name() external view returns(string memory);

    function symbol() external view returns(string memory);

    function decimals() external view returns(uint);

    function totalSupply() external view returns(uint);

    function balanceOf(address account) external view returns(uint);

    function transfer(address _to, uint amount) external;

    // returns the amount which the _spender is still allowed to 
    // withdraw from the _owner
    function allowance(address _owner, address _spender) external view returns(uint);

    // allows spender to withdraw from the account several times,
    // up to amount value
    function approve(address spender, uint amount) external;

    function transferFrom(address sender, address recipient, uint amount) external;

    
    
    event Transfer(address indexed from, address indexed to, uint amount);

    event Approve(address indexed owner, address indexed to, uint amount);
}
