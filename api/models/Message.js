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

    const dbResponse = await sails
                          .getDatastore()
                          .sendNativeQuery(query, [sender, recipient]) ;

    return dbResponse.rows;
  },

  getThreads: async (sender) => {
    const query = `SELECT sender, recipient from message where "sender" = $1 or "recipient" = $1`;


    const dbResponse = await sails
                          .getDatastore()
                          .sendNativeQuery(query, [sender]);
    let users = [];

    _.forEach(dbResponse.rows, (item) => {
        users = [...users, ..._.values(item)]
    })
    console.log(users, dbResponse.rows);
    users = _.uniq(users);
    _.remove(users, user => user === sender);

    return users;
  }

};

