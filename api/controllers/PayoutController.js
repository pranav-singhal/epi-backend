
module.exports = {
  validateVpa: async (req, res) => {
    const vpa = _.get(req, 'body.vpa');
    const vpaDetails = await FiatService.validateVpa(vpa);
    return res.json(vpaDetails);
  },

  generateSignatureForTransaction: async (req, res) => {
    const senderAddress = _.get(req, 'body.senderAddress');
    const amount = parseInt(_.get(req, 'body.amount'));

    const signedTransactionResponse = await Web3Service.generateSignedTransaction(senderAddress, amount);
    return res.json(signedTransactionResponse);
  }
};
