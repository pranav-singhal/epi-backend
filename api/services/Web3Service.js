const {ethers} = require('ethers');
const crypto = require('crypto')

const wallet = new ethers.Wallet(
  _.get(sails, 'config.contractadminwallet.pvtkey'),
);

const generateNonce = () => crypto.randomBytes(16).toString('hex')

const mintMsgHash = (recipient, amount, newNonce) => ethers.utils.solidityKeccak256(['address', 'string', 'uint256'], [recipient, newNonce, amount]);

module.exports = {
  generateSignedTransaction: async (_senderAddress, _amount) => {
    const nonce = generateNonce();
    const unsignedMsgHash = mintMsgHash(_senderAddress, _amount, nonce);
    let messageHashBytes = ethers.utils.arrayify(unsignedMsgHash);

    const signedMsgHash = await wallet.signMessage(messageHashBytes)

    return {unsignedMsgHash, signedMsgHash, nonce};

  }
};
