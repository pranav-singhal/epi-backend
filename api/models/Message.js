/**
 * Message.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    type: { type: 'string' },

    sender: { type: 'string' },

    recipient: { type: 'string' },

    transactionId: { type: 'number' }

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },
  createNewMessage:  async (opts) => {
    const query = `INSERT INTO message ("type", "sender", "recipient", "transactionId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

    const dbResponse = await sails
                          .getDatastore()
                          .sendNativeQuery(query, [opts.type, opts.sender, opts.recipient, opts.transactionId || 0, Date.now(), Date.now()]);

    return dbResponse.rows[0];

  },

  getMessages: async (sender, recipient) => {
    const query = `Select * from message m inner join transaction t on m."transactionId" = t."id" where m."sender" = $1 and m."recipient" = $2`;

    let dbResponseSentMessages = await sails
                          .getDatastore()
                          .sendNativeQuery(query, [sender, recipient]);

    dbResponseSentMessages = dbResponseSentMessages.rows;

    let dbResponseRecievedMessages = await sails
                          .getDatastore()
                          .sendNativeQuery(query, [recipient, sender]);

    dbResponseRecievedMessages = dbResponseRecievedMessages.rows;
    dbResponseSentMessages = _.map(dbResponseSentMessages, (_message) => {
      return {..._message, type: 'sent'};
    });

    dbResponseRecievedMessages = _.map(dbResponseRecievedMessages, (_message) => {
      return {..._message, type: 'recieved'};
    });



    return [...dbResponseRecievedMessages, ...dbResponseSentMessages];
  },

  getMessagesByQrCode: async (qrCode) => {
    const query = `SELECT * from message m inner join transaction t on m."transactionId" = t."id" where t."qrcode_id" = $1`;
    let dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query, [qrCode]);

    return dbResponse.rows;
  },

  getThreadsWithDetails: async (sender) => {
    const query = `SELECT wallet_user.username, wallet_user.id, wallet_user.avatar, wallet_user.address, wallet_user.user_type from message inner join wallet_user on (message.sender = wallet_user."id"::varchar or message.recipient = wallet_user."id"::varchar) where message.sender = $1 or message.recipient = $1`;
    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query, [sender]);
    const threadUsers = _.filter(dbResponse.rows, _user => {
      return _user.id !== parseInt(sender);
    });
    return _.unique(threadUsers || [], false, 'username');
  },

  getThreads: async (sender) => {
    const query = `SELECT sender, recipient from message where "sender" = $1 or "recipient" = $1`;


    const dbResponse = await sails
                          .getDatastore()
                          .sendNativeQuery(query, [sender]);
    let users = [];

    _.forEach(dbResponse.rows, (item) => {
      users = [...users, ..._.values(item)];
    });

    users = _.uniq(users);
    _.remove(users, user => user === sender);

    return users;
  }

};

