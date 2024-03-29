/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const WalletUser = require('../models/WalletUser');
const NotificationService = require('../services/NotificationService');
const Web3Service = require('../services/Web3Service');

// TODO : move these multiple defintions to a utils file
const keyBy = (collection, iteratee) => {
  return _.reduce(collection, (result, item) => {
    const key = _.isFunction(iteratee) ? iteratee(item) : _.get(item, iteratee);
    result[key] = item;
    return result;
  }, {});
};

const chainsById = keyBy(sails.config.chains, 'id');


module.exports = {
  create: async (req, res) => {
    const msgType = _.get(req.body, 'type');
    let messageResponse = {message: 'invalid msg type'};
    let txResponse = null;
    let sender = _.get(req.body, 'sender');
    let recipient = _.get(req.body, 'recipient');

    const txHash = _.get(req.body, 'txDetails.hash', '');
    const txAmount = _.get(req.body, 'txDetails.amount');
    const qrCodeId = _.get(req.body, 'txDetails.qrCodeId');
    const chainId = _.get(req.body, 'txDetails.chainId', 0);
    let notificationError = null;

    const senderDetails = await WalletUser.getUserByUsername(sender);
    const recipientDetails = await WalletUser.getUserByUsername(recipient);

    // Start: validate signature

    const validationPayload = req.body;
    const signature = req.headers['x-signature'];
    const timestamp = req?.body?.timestamp || 0;
    const address = senderDetails.address;

    const isTimestampValid = Web3Service.validateTimestamp(timestamp);

    if (!isTimestampValid) {
      res.status = 400;
      return res.json({message: 'Signature has expired'});
    }


    const signerAddress = await Web3Service.getSignerFromPayload(validationPayload, signature);
    const isSignatureValid = await Web3Service.validateSignedPayload(signature, validationPayload, address);

    if (!isSignatureValid) {
      res.status = 400;
      return res.json({message: 'Invalid signature', sentSignature: signature});
    }


    if (senderDetails?.address !== signerAddress) {
      res.status = 400;
      return res.json({message: 'Signer not allowed to send message for sender', sentSignature: signature});
    }

    //END: validate signature

    if (!senderDetails?.id) {
      res.status = 400;
      return res.json({message: 'invalid sender'});
    }

    if (!recipientDetails?.id) {
      res.status = 400;
      return res.json({message: 'invalid recipient'});
    }

    sender = senderDetails.id;
    recipient = recipientDetails.id;

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
      const chainIdentifier = chainsById[chainId]?.identifier;

      Web3Service.updateTransactionOnCompletion(
        txResponse.id,
        txResponse.hash,
        chainIdentifier
      );
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
          console.log('notification error: ', e);
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

    const senderDetails = await WalletUser.getUserByUsername(sender);
    const recipientDetails = await WalletUser.getUserByUsername(recipient);

    if (!senderDetails?.id) {
      res.status = 400;
      return res.json({message: 'invalid sender'});
    }

    if (!recipientDetails?.id) {
      res.status = 400;
      return res.json({message: 'invalid recipeint'});
    }

    if (qrcode) {
      const messages = await Message.getMessagesByQrCode(qrcode);

      return res.json({messages});
    }

    const messages = await Message.getMessages(senderDetails?.id, recipientDetails?.id);

    res.json({messages});

  },

  getThreadsForSender: async (req, res) => {
    const sender = _.get(req, 'query.sender');
    const senderDetails = await WalletUser.getUserByUsername(sender);
    if (!senderDetails?.id) {
      res.status = 400;
      return res.json({message: 'invalid sender'});
    }
    const populateDetails = _.get(req, 'query.populate_details', false);

    if (populateDetails) {
      const threads = await Message.getThreadsWithDetails(senderDetails.id);
      return res.json({threads});
    }

    const threads = await Message.getThreads(senderDetails.id );

    return res.json({threads});
  },

  tempFunction: async (req, res) => {

    const username = _.get(req,'body.username')
    await NotificationService.tempFunction(username);
    return res.json(1);
  }
};

