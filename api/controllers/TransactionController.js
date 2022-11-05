/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Transaction = require("../models/Transaction");

module.exports = {
  update: async (req, res) => {
      const txId = _.get(req,'body.id');
      const hash = _.get(req,'body.hash', '');
      const status = _.get(req,'body.status');

      const dbResponse = await Transaction.updateTransaction(txId, {
          hash,
          status
      })

      return res.json(dbResponse);


  }

};

