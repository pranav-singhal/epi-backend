/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
  create: async (req, res) => {
    const msgType = _.get(req.body, 'type');
    let messageResponse = {message: 'invalid msg type'};
    let txResponse = null;
    const sender = _.get(req.body, 'sender');
    const recipient = _.get(req.body, 'recipient');

    const txHash = _.get(req.body, 'txDetails.hash', '');
    const txAmount = _.get(req.body, 'txDetails.amount');
    const qrCodeId = _.get(req.body, 'txDetails.qrCodeId');
    const chainId = _.get(req.body, 'txDetails.chainId', 0);
    let notificationError = null;

    // TODO: add payload validations
    if (msgType === 'recieved') {
      const txFrom = sender;
      const txTo = recipient;

      txResponse = await Transaction.createNewTransaction({
        from: txFrom,
        to: txTo,
        hash: txHash,
        amount: txAmount,
        status: 'pending',
        qrCodeId,
        chainId
      });
    }

    if (msgType === 'request') {
      txFrom = recipient;
      txTo = sender;

      txResponse = await Transaction.createNewTransaction({
        from: txFrom,
        to: txTo,
        hash: '',
        amount: txAmount,
        status: 'unconfirmed',
        chainId,
      });
    }

    if (txResponse) {
      // create message
      messageResponse = await Message.createNewMessage({
        type: msgType,
        sender,
        recipient,
        transactionId: txResponse.id
      });

      if (messageResponse) {
        try {
          await NotificationService.sendNotification(msgType, {
            amount: txAmount,
            transactionId: txResponse.id,
            recipient: recipient,
            from: sender
          });
        } catch(e) {
          console.log("notification error: ", e)
            notificationError = e;
        }

      }
    }
    return res.json({data: {
      ...messageResponse,
      transaction: txResponse,
      notificationError
    }});
  },

  getMessagesWithFilters: async (req, res) => {

    const sender = _.get(req, 'query.sender');
    const recipient = _.get(req, 'query.recipient');
    const qrcode = _.get(req, 'query.qrcode');
    const chainId = _.get(req, 'query.chainId');


    if (qrcode) {
      const messages = await Message.getMessagesByQrCode(qrcode);

      return res.json({messages});
    }

    const messages = await Message.getMessages(sender, recipient, chainId);

    res.json({messages});

  },

  getThreadsForSender: async (req, res) => {
    const sender = _.get(req, 'query.sender');
    const populateDetails = _.get(req, 'query.populate_details', false);

    if (populateDetails) {
      const threads = await Message.getThreadsWithDetails(sender);
      return res.json({threads});
    }

    const threads = await Message.getThreads(sender );

    return res.json({threads});
  }
};

