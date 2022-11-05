/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
  update: async (req, res) => {
    const txId = _.get(req,'body.id');
    const hash = _.get(req,'body.hash', '');
    const status = _.get(req,'body.status');

    const dbResponse = await Transaction.updateTransaction(txId, {
      hash,
      status
    });

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

