/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const sailsHookGrunt = require("sails-hook-grunt");

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    from: { type: 'string' },

    to: { type: 'string' },

    hash: { type: 'string' },

    amount: { type: 'string' },

    status: { type: 'string' },

    qrcode_id: { type: 'string' }

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },

  createNewTransaction:  async (opts) => {
    const query = `INSERT INTO transaction ("from", "to", "hash", "amount", "status", "qrcode_id", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;

    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query, [opts.from, opts.to, opts.hash, opts.amount, opts.status, opts.qrCodeId || null, Date.now(), Date.now()]);

    return dbResponse.rows[0];
  },

  updateTransaction: async (id, opts) => {
    let query = `UPDATE transaction SET "status" = $1`;
    let valuesArray = [];

    if (opts.hash) {
      query = query + `, hash = $2`;
    }

    query = query + `WHERE id = ${opts.hash ? '$3': '$2'} RETURNING *`;

    valuesArray.push(opts.status);
    if (opts.hash) {
      valuesArray.push(opts.hash);
    }

    valuesArray.push(id)

    const dbResponse = await sails.getDatastore()
      .sendNativeQuery(query, valuesArray);

    return dbResponse.rows[0];
  }
};

