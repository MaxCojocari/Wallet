//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20.sol";

contract ERC20 is IERC20 {

    address public owner;
    mapping(address => uint) private balances;
    mapping(address => mapping(address => uint)) private allowances;
    string private _name;
    string private _symbol;
    uint private totalTokenSupply;
    uint private nrDecimals;



    modifier enoughBalance(address _account, uint _value) {
        require(balanceOf(_account) >= _value, "ERC20: not enough balance");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ERC20: not the owner!");
        _;
    }


    
    constructor (
        string memory name_, 
        string memory symbol_, 
        uint _nrDecimals,
        uint initialSupply, 
        address shop
    ) 
    {
        owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        nrDecimals = _nrDecimals;

        mint(initialSupply, shop);
    }



    function name() external view override returns(string memory) {
        return _name;
    }

    function symbol() external view override returns(string memory) {
        return _symbol;
    }

    function decimals() external view override returns(uint) {
        return nrDecimals;
    }

    function totalSupply() external view override returns(uint) {
        return totalTokenSupply;
    }

    function mint(uint amount, address shop) public onlyOwner {
        balances[shop] += amount;
        totalTokenSupply += amount;

        emit Transfer(address(0), shop, amount);
    }

    function burn(address _from, uint amount) external onlyOwner enoughBalance(_from, amount) {
        balances[_from] -= amount;
        totalTokenSupply -= amount;
        emit Transfer(_from, address(0), amount);
    }

    function balanceOf(address account) public view override returns(uint){
        return balances[account];
    }

    function transfer(address to, uint amount) external enoughBalance(msg.sender, amount) override {
        require(to != address(0), "ERC20: transfer to the zero address");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }

    function allowance(address _owner, address _spender) public view override returns(uint) {
        return allowances[_owner][_spender];
    }

    function approve(address spender, uint amount) public override {
        _approve(spender, msg.sender, amount);
    }

    function _approve(address sender, address spender, uint amount) public {
        allowances[sender][spender] = amount;
        emit Approve(sender, spender, amount);
    }


    function transferFrom(
        address sender, 
        address recipient, 
        uint amount
    ) 
        external 
        enoughBalance(sender, amount) 
        override
    {
        require(
            sender != address(0), 
            "ERC20: transfer from the zero address"
        );
        require(
            recipient != address(0), 
            "ERC20: transfer to the zero address"
        );
        require(
            amount <= allowances[sender][recipient], 
            "ERC20: not enough allowance"
        );

        allowances[sender][recipient] -= amount;
        balances[sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
}



contract OMGToken is ERC20 {
    constructor(address shop) ERC20("OMGToken", "OMG", 18, 1e20, shop) {}
}



contract OMGShop {
    IERC20 public token;
    address payable public owner;

    event Bought(uint amount, address indexed buyer);
    event Sold(uint amount, address indexed seller);


    constructor() {
        token = new OMGToken(address(this));
        owner = payable(msg.sender);
    }


    modifier onlyOwner() {
        require(
            msg.sender == owner, 
            "ERC20: not the owner"
        );
        _;
    }


    function sell(uint _amountToSell) external {
        require(
            _amountToSell > 0 &&
            token.balanceOf(msg.sender) >= _amountToSell,
            "Incorrect amount to sell!"
        );

        // token.allowance(_owner, _spender) == allowance
        require(
            token.allowance(msg.sender, address(this)) >= _amountToSell,
            "Check allowance!"
        );

        // transfer in the context of the smart contract (ERC20)
        token.transferFrom(msg.sender, address(this), _amountToSell);

        // transfer of ETH to msg.sender (according to token-ETH exchange rate)
        //payable(msg.sender).transfer(_amountToSell);
        (bool success, ) = msg.sender.call{value: _amountToSell}("");
        require(success, "OMGShop: call to msg.sender failed");
        
        emit Sold(_amountToSell, msg.sender);
    }

    receive() external payable {
        uint tokensToBuy = msg.value;
        require(
            tokensToBuy > 0, 
            "Not enough funds!"
        );

        require(
            tokenSupply() >= tokensToBuy, 
            "Not enough tokens!"
        );

        token.transfer(msg.sender, tokensToBuy);
        token.approve(msg.sender, tokensToBuy);

        emit Bought(tokensToBuy, msg.sender);
    }


    function withdraw() external onlyOwner {
        require(
            owner != address(0), 
            "The owner cannot be the zero address"
        );
        owner.transfer(tokenSupply());
    }


    function tokenSupply() public view returns(uint) {
        return token.balanceOf(address(this));
    }

}
