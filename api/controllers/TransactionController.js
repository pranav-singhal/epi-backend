/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const { getTransactionDetailsFromHash } = require("../services/ContractFunctionService");

const keyBy = (collection, iteratee) => {
  return _.reduce(collection, (result, item) => {
    const key = _.isFunction(iteratee) ? iteratee(item) : _.get(item, iteratee);
    result[key] = item;
    return result;
  }, {});
};

const chainsById = keyBy(sails.config.chains, 'id');

module.exports = {
  update: async (req, res) => {
    const txId = _.get(req,'body.id');
    const hash = _.get(req,'body.hash', '');
    const status = _.get(req,'body.status');

    const transactionDetailsFromDb = await Transaction.getTransactionFromId(txId);

    if(hash && status === 'pending') {
      const transactionDetailsFromChain = await getTransactionDetailsFromHash(hash, chainsById[transactionDetailsFromDb.chainId]?.identifier)

      const dbResponse = await Transaction.updateTransaction(txId, {
        hash,
        status
      });
    }
    

    // TODO - send notification update the transaction update

    return res.json(dbResponse);
  },

  getByQRCodeId: async (req, res) => {
    const qrCodeId = _.get(req, 'params.id');

    if (!qrCodeId) {
      return res.send({
        status: false,
        error: 'qr code not found'
      });
    }

    const transaction = await Transaction.findOne({ qrcode_id: qrCodeId });

    return res.send({ transaction });
  }
};

