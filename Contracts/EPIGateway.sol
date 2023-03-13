import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract EPIGateway {
    using ECDSA for bytes32;

    address private owner;
    uint256 maxAllowedPayment = 1000000000000000; // 0.001
    uint256 minAllowedLimit = 0; // 0.0
    mapping(string => bool) private Fiats;
    mapping(string => bool) private usedNonces; // used to prevent replay attacks using signed messages
    bool private isWhitelistingEnabled = true;

    event OwnerSet(address indexed oldOwner, address indexed newOwner);
    event PaymentReceived(
        address sender,
        string reciever,
        uint256 paymentAmount,
        uint256 intentAmount,
        string intentCurrency
    );
    event PaymentReverted(bytes32 txHash, address _target);

    constructor() {
        owner = msg.sender; // 'msg.sender' is sender of current call, contract deployer for a constructor
        emit OwnerSet(address(0), owner);
        Fiats["INR"] = true;
    }

    modifier onlyOnwer() {
        require(
            owner == msg.sender,
            "only Gateway admins can call this function"
        );
        _;
    }

    modifier checkWhitelisting(
        address sender,
        bytes memory signedMsgHash,
        string memory nonce,
        uint256 amount
    ) {
        if (!isWhitelistingEnabled) {
            _;
        } else {
            bytes32 unsignedMsghash = hashTransaction(
                msg.sender,
                nonce,
                amount
            );

            // TODO: deployer of the contract also signs the transactions
            // this can be further abstracted to separate the two
            require(
                unsignedMsghash.toEthSignedMessageHash().recover(
                    signedMsgHash
                ) == owner,
                "Message incorrectly signed"
            );
            require(usedNonces[nonce] == false, "Nonce already used.");
            _;
        }
    }

    function hashTransaction(
        address sender,
        string memory nonce,
        uint256 amount
    ) public pure returns (bytes32) {
        bytes32 hash = keccak256(
            abi.encodePacked(sender, nonce, amount) // order of parameters passed to the method matters. it should match the generator in oracle
        );

        return hash;
    }

    function toggleWhiteListing(bool _whitelist) public onlyOnwer {
        isWhitelistingEnabled = _whitelist;
    }

    function createInrPayout(
        string memory reciever,
        uint256 fiatIntentAmount,
        string memory fiatIntentString,
        string memory nonce,
        bytes memory signedMsgHash
    )
        public
        payable
        checkWhitelisting(msg.sender, signedMsgHash, nonce, msg.value)
    {
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
        usedNonces[nonce] = true;
        emit PaymentReceived(
            msg.sender,
            reciever,
            msg.value,
            fiatIntentAmount,
            fiatIntentString
        );
    }

    function revertPayment(bytes32 txHash, address payable payee)
        public
        payable
    {
        require(msg.sender == owner, "Only admins can revert payments");
        require(payee != address(0));
        require(
            msg.value > minAllowedLimit,
            "Transaction value must be more than 0.0 ETH"
        );
        payee.transfer(msg.value);
        emit PaymentReverted(txHash, payee);
    }
}
