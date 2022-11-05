/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Message = require("../models/Message");
const Transaction = require("../models/Transaction");

module.exports = {
  create: async (req, res) => {
    const msgType = _.get(req.body, 'type');
    let messageResponse = {message: 'invalid msg type'};
    let txResponse = null;
    const sender = _.get(req.body, 'sender');
    const recipient = _.get(req.body, 'recipient');
    
    const txHash = _.get(req.body, 'txDetails.hash', '');
    const txAmount = _.get(req.body, 'txDetails.amount');

      // TODO: add payload validations  
      if (msgType === 'recieved') {
        const txFrom = sender;
        const txTo = recipient;
          
        
        txResponse = await Transaction.createNewTransaction({
            from: txFrom,
            to: txTo,
            hash: txHash,
            amount: txAmount,
            status: 'pending'
        })

        

      }

      if (msgType === 'request') {
        txFrom = recipient;
        txTo = sender;

        txResponse = await Transaction.createNewTransaction({
            from: txFrom,
            to: txTo,
            hash: '',
            amount: txAmount,
            status: 'unconfirmed'
        })
      }

      if (txResponse) {
        // create message
        messageResponse = await Message.createNewMessage({
            type: msgType,
            sender,
            recipient,
            transactionId: txResponse.id
        })

    }
    return res.json({data: {
        ...messageResponse,
        transaction: txResponse
    }})


  },

  getMessagesWithFilters: async (req, res) => {
      console.log(req.query);
      const sender = _.get(req, 'query.sender');
      const recipient = _.get(req, 'query.recipient');

      const messages = await Message.getMessages(sender, recipient);

      res.json({messages});

  },

  getThreadsForSender: async (req, res) => {
    const sender = _.get(req, 'query.sender');
    console.log('sneder:', sender);

    const threads = await Message.getThreads(sender);

    res.json({threads});
  }
};

