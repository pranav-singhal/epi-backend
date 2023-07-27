/**
 * VpaTransaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  getTransactionsForAddress: async (address) => {
    const query = `SELECT * from vpa_transactions where sender = $1`;
    const dbResponse = await sails
    .getDatastore()
    .sendNativeQuery(query, [address]);

    return dbResponse.rows;
  },

  addTransaction: async ({txHash, crypto_amount, crypto_name, fiat_amount, fiat_name, status, meta, sender, reciever}) => {
    const query = `INSERT INTO vpa_transactions ("tx_hash", "crypto_amount", "crypto_name", "fiat_amount", "fiat_name", "status", "meta", "sender", "receiver", "createdat", "updatedat") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10), to_timestamp($11)) RETURNING *`;
    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query, [
        txHash,
        crypto_amount,
        crypto_name,
        fiat_amount,
        fiat_name,
        status,
        meta,
        sender,
        reciever,
        Date.now(),
        Date.now()
      ]);

    return dbResponse.rows[0];
  },

  addEthToInrPendingTransaction: (txHash, crypto_amount, fiat_amount, sender, cryptoName, reciever) => {
    return VpaTransaction.addTransaction({
      txHash,
      crypto_amount,
      crypto_name: cryptoName,
      fiat_amount,
      fiat_name: 'INR',
      status: 'pending',
      meta: {message: 'Please wait while we process your payment'},
      sender,
      reciever
    });
  },

  updateTransactionStatus: async (txId, _status, meta) => {
    const query = `UPDATE vpa_transactions set status = $2, meta =$3, updatedat =to_timestamp($4) where id = $1`;

    const dbResponse = await sails
    .getDatastore()
    .sendNativeQuery(query, [txId, _status, meta, Date.now()]);

    return dbResponse.rows[0];
  },

  updateTransactionStatusByTxHash: async (txHash, _status, meta) => {
    const query = `UPDATE vpa_transactions set status = $2, meta =$3, updatedat =to_timestamp($4) where tx_hash = $1`;

    const dbResponse = await sails
      .getDatastore()
      .sendNativeQuery(query, [txHash, _status, meta, Date.now()]);

    return dbResponse.rows[0];
  },
  updateTransactionStatusToDeclined: (txHash, meta) => VpaTransaction.updateTransactionStatusByTxHash(txHash, 'declined', meta),
  updateTransactionStatusToCompleted: (txHash, meta) => VpaTransaction.updateTransactionStatusByTxHash(txHash, 'completed', meta),

  getTransactionFromTransactionHash: async (txHash, chainId) => {
    const query = `SELECT * from vpa_transactions where tx_hash = $1 AND chain_id = $2`;

    const dbResponse = await sails
    .getDatastore()
    .sendNativeQuery(query, [txHash, chainId]);

    return dbResponse.rows[0];
  }
};
