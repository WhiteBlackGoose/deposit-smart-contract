// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Pfandsystem {
    struct Item {
        string name;
        bytes32 sha256hash;
        uint256 deposit;
    }

    enum ReturnedState{
        Returned,
        Received
    }

    mapping(address => ReturnedState) private userStates;

    Item public item;
    address public owner;

    constructor(string memory name, bytes32 hash, uint256 deposit) {
        item.name = name;
        item.sha256hash = hash;
        item.deposit = deposit;
        owner = msg.sender; // Set the contract creator as the owner
    }

    function checkReturnState(address user) view public returns (ReturnedState){
            return (userStates[user]);
    }

    // Function to borrow the item
    function borrowItem() payable public {
        require(checkReturnState(msg.sender) == ReturnedState.Returned, "Item already borrowed");
        require(msg.value == item.deposit, "Deposit does not match requirements.");
        userStates[msg.sender] = ReturnedState.Received;
    }

    // Function to return the item
    function returnItem() public {
        require(checkReturnState(msg.sender) == ReturnedState.Received, "Item available");
        userStates[msg.sender] = ReturnedState.Returned;
        payable(msg.sender).transfer(item.deposit);
    }

}
