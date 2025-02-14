// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Borger {
    bool private locked;
    
    struct Item {
        string name;
        bytes32 sha256hash;
        uint256 deposit;
    }

    enum ReturnedState{
        Returned,
        Received
    }

    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    mapping(address => ReturnedState) private userStates;

    Item public item;
    address public owner;

    constructor() {
        item.name = "Vitalik Buterin";
        item.sha256hash = 0xdd76cf5210b29098297dbb17b8ece744ef72c154f55cc0d1a4db0749932293ef;
        item.deposit =  21 ether;
        owner = msg.sender;
    }

    function checkReturnState(address user) view public returns (ReturnedState){
            return (userStates[user]);
    }

    function borrowItem() public payable {
        require(checkReturnState(msg.sender) == ReturnedState.Returned, "Item already borrowed");
        require(msg.value == item.deposit, "Deposit does not match requirements.");
        require(address(this).balance >= msg.value, "Contract doesn't have enough balance");
        userStates[msg.sender] = ReturnedState.Received;
    }


    function returnItem(bytes32 _hash) public noReentrant{
        require(checkReturnState(msg.sender) == ReturnedState.Received, "Item available");
        require(_hash == item.sha256hash, "Hash doesn't match");
        userStates[msg.sender] = ReturnedState.Returned;
        payable(msg.sender).transfer(item.deposit);
    }
}
