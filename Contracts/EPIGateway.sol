import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract EPIGateway {
    using ECDSA for bytes32;

    address private owner;
    address private paymaster; // allowed to withdraw all funds from contract
    address private oracle; // allowed to revert Payouts when needed

    uint256 maxAllowedPayment = 1000000000000000; // 0.001
    uint256 minAllowedLimit = 0; // 0.0
    mapping(string => bool) private Fiats;
    mapping(string => bool) private usedNonces; // used to prevent replay attacks using signed messages
    bool private isWhitelistingEnabled = true;
    bool private isPaused = true;

    // START: EVENTS

    event PaymentReceived(
        address sender,
        string reciever,
        uint256 paymentAmount,
        uint256 intentAmount,
        string intentCurrency
    );

    event PaymentReverted(bytes32 txHash, address _target);

    event BalanceWithdrawn(address to, uint256 amount);

    // END: EVENTS

    constructor(address _paymaster, address _oracle) {
        owner = msg.sender; // 'msg.sender' is sender of current call, contract deployer for a constructor
        paymaster = _paymaster;
        oracle = _oracle;
        Fiats["INR"] = true;
    }

    // START: MODIFIERS
    modifier onlyOwner() {
        require(
            owner == msg.sender,
            "only Gateway admins can call this function"
        );
        _;
    }

    modifier onlyOracle() {
        require(oracle == msg.sender, "only Oracle can call this function");
        _;
    }

    modifier onlyPaymaster() {
        require(
            paymaster == msg.sender,
            "only Paymaster can call this function"
        );
        _;
    }

    modifier isEnabled() {
        require(isPaused == false, "contract is paused");
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

            require(
                unsignedMsghash.toEthSignedMessageHash().recover(
                    signedMsgHash
                ) == oracle,
                "Message incorrectly signed"
            );
            require(usedNonces[nonce] == false, "Nonce already used.");
            _;
        }
    }

    // END: MODIFIERS

    // START: ADMIN FUNCTIONS

    function toggleContractPause(bool _newPauseStatus) public onlyOwner {
        isPaused = _newPauseStatus;
    }

    function toggleWhiteListing(bool _whitelist) public onlyOwner {
        isWhitelistingEnabled = _whitelist;
    }

    function changeOracle(address newOracle) public onlyOwner {
        oracle = newOracle;
    }

    function changeOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function changePaymaster(address newPaymaster) public onlyOwner {
        paymaster = newPaymaster;
    }

    function changeMaxAllowedLimit(uint256 _newLimit) public onlyPaymaster {
        maxAllowedPayment = _newLimit;
    }

    function withdraw(address payable to, uint256 amount) public onlyPaymaster {
        require(to != address(0));
        require(amount <= address(this).balance);
        to.transfer(amount);
        emit BalanceWithdrawn(to, amount);
    }

    // END: ADMIN FUNCTIONS

    function hashTransaction(
        address sender,
        string memory nonce,
        uint256 amount
    ) public pure returns (bytes32) {
        bytes32 hash = keccak256(
            // order of parameters passed to the method matters. it should match the generator in oracle
            abi.encodePacked(sender, nonce, amount)
        );

        return hash;
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
        isEnabled
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

    function revertPayment(
        bytes32 txHash,
        address payable payee,
        uint256 amount
    ) public onlyOracle isEnabled {
        require(payee != address(0));
        require(
            amount > minAllowedLimit,
            "Transaction value must be more than 0.0 ETH"
        );
        payee.transfer(amount);
        emit PaymentReverted(txHash, payee);
    }
}
