const { ethers } = require('ethers');
const crypto = require('crypto');

const signers = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.Wallet(value.gateway.contract.admin.pvtkey);

  return result;
}, {});

// move this to env
const TIMESTAMP_TOLERANCE = (sails?.config?.signature?.verification?.timestamp?.tolerance || 50) *1000;

const generateNonce = () => crypto.randomBytes(16).toString('hex');

const mintMsgHash = (recipient, amount, newNonce) => ethers.utils.solidityKeccak256(['address', 'string', 'uint256'], [recipient, newNonce, amount.toString()]);

module.exports = {
  generateSignedTransaction: async (_senderAddress, _amount, _chain) => {
    const nonce = generateNonce();
    const unsignedMsgHash = mintMsgHash(_senderAddress, _amount, nonce);
    let messageHashBytes = ethers.utils.arrayify(unsignedMsgHash);

    const signedMsgHash = await signers[_chain].signMessage(messageHashBytes);

    return { unsignedMsgHash, signedMsgHash, nonce };

  },

  validateSignedPayload: async (signature, payload, address) => {
    const stringifiedPayload = JSON.stringify(payload);
    const signerAddr = await ethers.utils.verifyMessage(stringifiedPayload, signature);
    return signerAddr === address;
  },

  validateTimestamp: (timestamp) => (Date.now() - timestamp < TIMESTAMP_TOLERANCE && Date.now() - timestamp >= 0)
};
