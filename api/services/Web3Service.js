const { ethers } = require('ethers');
const crypto = require('crypto');

const signers = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.Wallet(value.gateway.contract.admin.pvtkey);

  return result;
}, {});

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

  getSignerFromPayload:  (payload, signature) => {
    // payload is flattened to remove nesting. It is then ordered so that signature can be verified
    // if payload is not ordered and flattened, same payload will generate a different strigified value,
    // and thus a different signature on client and server
    const flattenedPayload = flattenObj(payload);
    const stringifiedPayload = JSON.stringify(flattenedPayload, Object.keys(flattenedPayload).sort());
    return ethers.utils.verifyMessage(stringifiedPayload, signature);
  },

  validateSignedPayload: async (signature, payload, address) => {
    // payload is flattened to remove nesting. It is then ordered so that signature can be verified
    // if payload is not ordered and flattened, same payload will generate a different strigified value,
    // and thus a different signature on client and server
    const signerAddr = await Web3Service.getSignerFromPayload(payload, signature);
    return signerAddr === address;
  },

  validateTimestamp: (timestamp) => (Date.now() - timestamp < TIMESTAMP_TOLERANCE && Date.now() - timestamp >= 0)
};
