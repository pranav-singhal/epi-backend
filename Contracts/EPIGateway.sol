// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
import "hardhat/console.sol";

contract EPIGateway {
    address private owner;
    event OwnerSet(address indexed oldOwner, address indexed newOwner);
    event PaymentReceived(
        address sender,
        string reciever,
        uint256 paymentAmount,
        uint256 intentAmount,
        string intentCurrency
    );
    uint256 maxAllowedPayment = 1000000000000000; // 0.001
    uint256 minAllowedLimit = 0; // 0.001
    mapping(string => bool) public Fiats;

    constructor() {
        console.log("Owner contract deployed by:", msg.sender);
        owner = msg.sender; // 'msg.sender' is sender of current call, contract deployer for a constructor
        emit OwnerSet(address(0), owner);
        Fiats["INR"] = true;
    }

    function createInrPayout(
        string memory reciever,
        uint256 fiatIntentAmount,
        string memory fiatIntentString
    ) public payable {
        require(
            msg.value <= maxAllowedPayment,
            "Transaction value must be less than 0.01 ETH"
        );
        require(
            msg.value > minAllowedLimit,
            "Transaction value must be more than 0.0 ETH"
        );
        require(fiatIntentAmount > 0, "Intended amount must be great than 0");
        require(
            Fiats[fiatIntentString] == true,
            "Only Certain currencies are allowed"
        );
        emit PaymentReceived(
            msg.sender,
            reciever,
            msg.value,
            fiatIntentAmount,
            fiatIntentString
        );
    }
}
