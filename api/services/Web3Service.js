const { ethers } = require('ethers');
const crypto = require('crypto');

const signers = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.Wallet(value.gateway.contract.admin.pvtkey);

  return result;
}, {});

const providers = _.reduce(sails.config.chains, (result, value, key) => {
  result[key] = new ethers.providers.JsonRpcProvider(
    `https://${value.infura.network}.infura.io/v3/${value.infura.apikey}`
  );

  return result;
}, {});

// move this to env
const TIMESTAMP_TOLERANCE = (sails?.config?.signature?.verification?.timestamp?.tolerance || 50) *1000;

const generateNonce = () => crypto.randomBytes(16).toString('hex');

const mintMsgHash = (recipient, amount, newNonce) => ethers.utils.solidityKeccak256(['address', 'string', 'uint256'], [recipient, newNonce, amount.toString()]);

const flattenObj = (ob) => {

  // The object which contains the
  // final result
  let result = {};

  // loop through the object "ob"
  for (const i in ob) {

    // We check the type of the i using
    // typeof() function and recursively
    // call the function again
    if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i])) {
      const temp = flattenObj(ob[i]);
      for (const j in temp) {

        // Store temp in result
        result[i + '.' + j] = temp[j];
      }
    }

    // Else store ob[i] in result directly
    else {
      result[i] = ob[i];
    }
  }
  return result;
};

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

  validateTimestamp: (timestamp) => (Date.now() - timestamp < TIMESTAMP_TOLERANCE && Date.now() - timestamp >= 0),

  updateTransactionOnCompletion: (txId, txHash, chain) => {
    providers[chain].waitForTransaction(txHash)
    .then(() => {

      // TODO - fire a notification to sender when transaction has been mined;
      Transaction.updateTransaction(txId, {
        hash: txHash,
        status: 'completed'
      });
    });
  }
};
